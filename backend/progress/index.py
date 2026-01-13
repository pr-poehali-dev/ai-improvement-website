"""
Business: Save and retrieve user test progress and learning history
Args: event with httpMethod, body, headers; context with request_id
Returns: HTTP response with progress data
"""

import json
import os
import jwt
from datetime import datetime
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

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
    
    user_id = payload.get('user_id')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'save_test_result':
                test_result = {
                    'topic': body_data.get('topic', 'Тест'),
                    'score': body_data.get('score', 0),
                    'total_questions': body_data.get('total_questions', 0),
                    'correct_answers': body_data.get('correct_answers', 0),
                    'date': datetime.utcnow().isoformat()
                }
                
                cursor.execute(
                    "SELECT test_results FROM user_progress WHERE user_id = %s",
                    (user_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    current_results = row['test_results'] or []
                    current_results.append(test_result)
                    
                    cursor.execute(
                        "UPDATE user_progress SET test_results = %s, last_activity = %s WHERE user_id = %s",
                        (json.dumps(current_results), datetime.utcnow(), user_id)
                    )
                else:
                    cursor.execute(
                        "INSERT INTO user_progress (user_id, test_results, last_activity) VALUES (%s, %s, %s)",
                        (user_id, json.dumps([test_result]), datetime.utcnow())
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'message': 'Результат сохранён'})
                }
            
            elif action == 'save_completed_topic':
                topic = body_data.get('topic', '')
                
                cursor.execute(
                    "SELECT completed_topics FROM user_progress WHERE user_id = %s",
                    (user_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    current_topics = row['completed_topics'] or []
                    if topic not in current_topics:
                        current_topics.append(topic)
                        
                        cursor.execute(
                            "UPDATE user_progress SET completed_topics = %s, last_activity = %s WHERE user_id = %s",
                            (json.dumps(current_topics), datetime.utcnow(), user_id)
                        )
                else:
                    cursor.execute(
                        "INSERT INTO user_progress (user_id, completed_topics, last_activity) VALUES (%s, %s, %s)",
                        (user_id, json.dumps([topic]), datetime.utcnow())
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'message': 'Тема отмечена как изученная'})
                }
            
            elif action == 'mark_lecture_viewed':
                lecture_data = {
                    'title': body_data.get('title', ''),
                    'duration': body_data.get('duration', ''),
                    'viewed_at': datetime.utcnow().isoformat()
                }
                
                cursor.execute(
                    "SELECT viewed_lectures FROM user_progress WHERE user_id = %s",
                    (user_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    viewed_lectures = row['viewed_lectures'] or []
                    
                    # Check if lecture already viewed (by title)
                    existing = next((i for i, l in enumerate(viewed_lectures) if l.get('title') == lecture_data['title']), None)
                    
                    if existing is not None:
                        # Update view time
                        viewed_lectures[existing] = lecture_data
                    else:
                        # Add new lecture
                        viewed_lectures.append(lecture_data)
                    
                    cursor.execute(
                        "UPDATE user_progress SET viewed_lectures = %s, last_activity = %s WHERE user_id = %s",
                        (json.dumps(viewed_lectures), datetime.utcnow(), user_id)
                    )
                else:
                    cursor.execute(
                        "INSERT INTO user_progress (user_id, viewed_lectures, last_activity) VALUES (%s, %s, %s)",
                        (user_id, json.dumps([lecture_data]), datetime.utcnow())
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'message': 'Лекция отмечена как просмотренная'})
                }
        
        elif method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action')
            
            if action == 'get_teachers':
                cursor.execute(
                    """
                    SELECT u.id, u.full_name, u.email
                    FROM users u
                    INNER JOIN teacher_students ts ON ts.teacher_id = u.id
                    WHERE ts.student_id = %s AND u.role = 'teacher'
                    ORDER BY u.full_name
                    """,
                    (user_id,)
                )
                teachers = cursor.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'teachers': [
                            {
                                'id': t['id'],
                                'full_name': t['full_name'],
                                'email': t['email']
                            }
                            for t in teachers
                        ]
                    })
                }
            
            cursor.execute(
                """
                SELECT u.id, u.email, u.full_name, u.created_at,
                       up.test_results, up.completed_topics, up.viewed_lectures, up.last_activity
                FROM users u
                LEFT JOIN user_progress up ON u.id = up.user_id
                WHERE u.id = %s
                """,
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'user': {
                        'id': user['id'],
                        'email': user['email'],
                        'full_name': user['full_name'],
                        'created_at': user['created_at'].isoformat(),
                        'test_results': user['test_results'] or [],
                        'completed_topics': user['completed_topics'] or [],
                        'viewed_lectures': user['viewed_lectures'] or [],
                        'last_activity': user['last_activity'].isoformat() if user['last_activity'] else None
                    }
                })
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