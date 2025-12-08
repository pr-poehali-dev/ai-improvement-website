"""
Business: Teacher management API - get students list, view student details, send messages
Args: event with httpMethod, body, headers; context with request_id
Returns: HTTP response with student data or operation results
"""

import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-in-production')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except:
        return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
        
        if not auth_token:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Токен авторизации не предоставлен'})
            }
        
        payload = verify_token(auth_token)
        if not payload:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Недействительный токен'})
            }
        
        teacher_id = payload.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT role FROM users WHERE id = %s", (teacher_id,))
        user = cursor.fetchone()
        
        if not user or user['role'] != 'teacher':
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Доступ запрещен. Только для преподавателей'})
            }
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            student_id = query_params.get('student_id')
            
            if student_id:
                cursor.execute(
                    """
                    SELECT u.id, u.email, u.full_name, u.created_at,
                           up.test_results, up.completed_topics, up.last_activity
                    FROM users u
                    LEFT JOIN user_progress up ON u.id = up.user_id
                    WHERE u.id = %s AND u.role = 'student'
                    """,
                    (student_id,)
                )
                student = cursor.fetchone()
                
                if not student:
                    cursor.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Студент не найден'})
                    }
                
                test_results = student['test_results'] or []
                tests_completed = len(test_results)
                average_score = sum(r.get('score', 0) for r in test_results) / tests_completed if tests_completed > 0 else 0
                
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'student': {
                            'id': student['id'],
                            'full_name': student['full_name'],
                            'email': student['email'],
                            'created_at': student['created_at'].isoformat(),
                            'tests_completed': tests_completed,
                            'average_score': round(average_score, 1),
                            'test_results': test_results,
                            'completed_topics': student['completed_topics'] or [],
                            'last_activity': student['last_activity'].isoformat() if student['last_activity'] else None
                        }
                    })
                }
            else:
                cursor.execute(
                    """
                    SELECT u.id, u.email, u.full_name, u.created_at,
                           up.test_results, up.last_activity
                    FROM users u
                    LEFT JOIN user_progress up ON u.id = up.user_id
                    WHERE u.role = 'student'
                    ORDER BY u.created_at DESC
                    """
                )
                students = cursor.fetchall()
                
                students_list = []
                for student in students:
                    test_results = student['test_results'] or []
                    tests_completed = len(test_results)
                    average_score = sum(r.get('score', 0) for r in test_results) / tests_completed if tests_completed > 0 else 0
                    
                    students_list.append({
                        'id': student['id'],
                        'full_name': student['full_name'],
                        'email': student['email'],
                        'tests_completed': tests_completed,
                        'average_score': round(average_score, 1),
                        'last_activity': student['last_activity'].isoformat() if student['last_activity'] else None
                    })
                
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'students': students_list})
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'send_message':
                student_id = body_data.get('student_id')
                message = body_data.get('message', '').strip()
                
                if not student_id or not message:
                    cursor.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'ID студента и сообщение обязательны'})
                    }
                
                cursor.execute(
                    """
                    INSERT INTO teacher_messages (teacher_id, student_id, message)
                    VALUES (%s, %s, %s)
                    RETURNING id, created_at
                    """,
                    (teacher_id, student_id, message)
                )
                result = cursor.fetchone()
                conn.commit()
                
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'message_id': result['id'],
                        'sent_at': result['created_at'].isoformat()
                    })
                }
            
            elif action == 'update_material_status':
                material_id = body_data.get('material_id')
                student_id = body_data.get('student_id')
                status = body_data.get('status')
                teacher_comment = body_data.get('teacher_comment', '')
                
                if not material_id or not student_id or not status:
                    cursor.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'material_id, student_id и status обязательны'})
                    }
                
                cursor.execute(
                    """
                    INSERT INTO material_status
                    (material_id, student_id, status, teacher_comment, reviewed_at, updated_at)
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT (material_id, student_id)
                    DO UPDATE SET 
                        status = EXCLUDED.status,
                        teacher_comment = EXCLUDED.teacher_comment,
                        reviewed_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    (material_id, student_id, status, teacher_comment)
                )
                conn.commit()
                
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'get_material_statuses':
                material_id = body_data.get('material_id')
                
                if not material_id:
                    cursor.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'material_id обязателен'})
                    }
                
                cursor.execute(
                    """
                    SELECT ms.student_id, u.full_name, u.email, ms.status, 
                           ms.teacher_comment, ms.updated_at
                    FROM material_status ms
                    JOIN users u ON u.id = ms.student_id
                    WHERE ms.material_id = %s
                    ORDER BY ms.updated_at DESC
                    """,
                    (material_id,)
                )
                
                statuses = []
                for row in cursor.fetchall():
                    statuses.append({
                        'student_id': row['student_id'],
                        'student_name': row['full_name'],
                        'student_email': row['email'],
                        'status': row['status'],
                        'teacher_comment': row['teacher_comment'],
                        'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None
                    })
                
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'statuses': statuses})
                }
            
            elif action == 'add_student':
                email = body_data.get('email', '').strip().lower()
                
                if not email:
                    cursor.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Email обязателен'})
                    }
                
                cursor.execute("SELECT id FROM users WHERE email = %s AND role = 'student'", (email,))
                student = cursor.fetchone()
                
                if not student:
                    cursor.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Студент с таким email не найден'})
                    }
                
                cursor.execute(
                    """
                    INSERT INTO teacher_students (teacher_id, student_id)
                    VALUES (%s, %s)
                    ON CONFLICT (teacher_id, student_id) DO NOTHING
                    """,
                    (teacher_id, student['id'])
                )
                conn.commit()
                
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'message': 'Студент добавлен'})
                }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'})
        }