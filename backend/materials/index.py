"""
Business: Material management for teachers - upload, list, and share materials with students
Args: event with httpMethod, body, headers; context with request_id
Returns: HTTP response with materials data
"""

import json
import os
import base64
import uuid
import jwt
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-in-production')

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except:
        return None

def get_db_connection():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=RealDictCursor,
        options='-c search_path=t_p91447108_ai_improvement_websi,public'
    )

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers_dict = event.get('headers', {})
    auth_token = headers_dict.get('X-Auth-Token') or headers_dict.get('x-auth-token')
    
    response_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if not auth_token:
        return {
            'statusCode': 401,
            'headers': response_headers,
            'body': json.dumps({'error': 'Токен авторизации не предоставлен'}),
            'isBase64Encoded': False
        }
    
    payload = verify_token(auth_token)
    if not payload:
        return {
            'statusCode': 401,
            'headers': response_headers,
            'body': json.dumps({'error': 'Недействительный токен'}),
            'isBase64Encoded': False
        }
    
    user_id = payload.get('user_id')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': response_headers,
                'body': json.dumps({'error': 'Пользователь не найден'}),
                'isBase64Encoded': False
            }
        
        user_role = user['role']
        
        if method == 'GET':
            if user_role == 'teacher':
                cursor.execute("""
                    SELECT id, title, description, content, file_url, file_type, 
                           file_size, category, created_at
                    FROM learning_materials 
                    WHERE teacher_id = %s 
                    ORDER BY created_at DESC
                """, (user_id,))
            else:
                cursor.execute("""
                    SELECT lm.id, lm.title, lm.description, lm.content, lm.file_url, 
                           lm.file_type, lm.file_size, lm.category, lm.created_at,
                           u.full_name as teacher_name
                    FROM learning_materials lm
                    JOIN teacher_students ts ON lm.teacher_id = ts.teacher_id
                    JOIN users u ON lm.teacher_id = u.id
                    WHERE ts.student_id = %s
                    ORDER BY lm.created_at DESC
                """, (user_id,))
            
            materials = []
            rows = cursor.fetchall()
            print(f"Found {len(rows)} materials for user_id={user_id}, role={user_role}")
            
            for row in rows:
                material = {
                    'id': row['id'],
                    'title': row['title'],
                    'description': row['description'],
                    'content': row.get('content'),
                    'file_url': row['file_url'],
                    'file_type': row['file_type'],
                    'file_size': row['file_size'],
                    'category': row['category'],
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None
                }
                if user_role == 'student':
                    material['teacher_name'] = row['teacher_name']
                materials.append(material)
            
            print(f"Returning {len(materials)} materials")
            
            return {
                'statusCode': 200,
                'headers': response_headers,
                'body': json.dumps({'materials': materials}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            if user_role != 'teacher':
                return {
                    'statusCode': 403,
                    'headers': response_headers,
                    'body': json.dumps({'error': 'Только преподаватели могут загружать материалы'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'create':
                title = body_data.get('title', '').strip()
                description = body_data.get('description', '').strip()
                content = body_data.get('content', '').strip()
                category = body_data.get('category', 'Общее')
                
                if not title or not content:
                    return {
                        'statusCode': 400,
                        'headers': response_headers,
                        'body': json.dumps({'error': 'Название и содержание обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    INSERT INTO learning_materials 
                    (teacher_id, title, description, content, file_url, file_type, file_size, category)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (user_id, title, description, content, '', 'text/plain', len(content), category))
                
                material_id = cursor.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': response_headers,
                    'body': json.dumps({
                        'success': True,
                        'material_id': material_id
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'upload':
                title = body_data.get('title', '').strip()
                description = body_data.get('description', '').strip()
                file_base64 = body_data.get('file_base64')
                file_name = body_data.get('file_name')
                file_type = body_data.get('file_type', 'application/octet-stream')
                category = body_data.get('category', 'Общее')
                
                if not title or not file_base64 or not file_name:
                    return {
                        'statusCode': 400,
                        'headers': response_headers,
                        'body': json.dumps({'error': 'Название, файл и имя файла обязательны'}),
                        'isBase64Encoded': False
                    }
                
                file_data = base64.b64decode(file_base64)
                file_size = len(file_data)
                
                file_extension = file_name.split('.')[-1] if '.' in file_name else 'bin'
                unique_filename = f"materials/{uuid.uuid4()}.{file_extension}"
                
                s3 = boto3.client('s3',
                    endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                )
                
                s3.put_object(
                    Bucket='files',
                    Key=unique_filename,
                    Body=file_data,
                    ContentType=file_type
                )
                
                file_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_filename}"
                
                cursor.execute("""
                    INSERT INTO learning_materials 
                    (teacher_id, title, description, file_url, file_type, file_size, category)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (user_id, title, description, file_url, file_type, file_size, category))
                
                material_id = cursor.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': response_headers,
                    'body': json.dumps({
                        'success': True,
                        'material_id': material_id,
                        'file_url': file_url
                    }),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': response_headers,
                    'body': json.dumps({'error': 'Неверное действие'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            if user_role != 'teacher':
                return {
                    'statusCode': 403,
                    'headers': response_headers,
                    'body': json.dumps({'error': 'Только преподаватели могут удалять материалы'}),
                    'isBase64Encoded': False
                }
            
            params = event.get('queryStringParameters') or {}
            material_id = params.get('material_id')
            
            if not material_id:
                return {
                    'statusCode': 400,
                    'headers': response_headers,
                    'body': json.dumps({'error': 'ID материала не указан'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                DELETE FROM learning_materials 
                WHERE id = %s AND teacher_id = %s
            """, (material_id, user_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': response_headers,
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': response_headers,
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': response_headers,
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }