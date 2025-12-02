"""
Business: User registration, login, and profile management API
Args: event with httpMethod, body, headers; context with request_id
Returns: HTTP response with auth tokens or user data
"""

import json
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-in-production')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def generate_token(user_id: int, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

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
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                email = body_data.get('email', '').strip().lower()
                password = body_data.get('password', '')
                full_name = body_data.get('full_name', '').strip()
                
                if not email or not password or not full_name:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Все поля обязательны для заполнения'})
                    }
                
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return {
                        'statusCode': 409,
                        'headers': headers,
                        'body': json.dumps({'error': 'Пользователь с таким email уже существует'})
                    }
                
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                cursor.execute(
                    "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s) RETURNING id, email, full_name, created_at",
                    (email, password_hash, full_name)
                )
                user = cursor.fetchone()
                
                cursor.execute(
                    "INSERT INTO user_progress (user_id) VALUES (%s)",
                    (user['id'],)
                )
                
                conn.commit()
                
                token = generate_token(user['id'], user['email'])
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({
                        'token': token,
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'full_name': user['full_name'],
                            'created_at': user['created_at'].isoformat()
                        }
                    })
                }
            
            elif action == 'login':
                email = body_data.get('email', '').strip().lower()
                password = body_data.get('password', '')
                
                if not email or not password:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Email и пароль обязательны'})
                    }
                
                cursor.execute(
                    "SELECT id, email, password_hash, full_name, created_at FROM users WHERE email = %s",
                    (email,)
                )
                user = cursor.fetchone()
                
                if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                    return {
                        'statusCode': 401,
                        'headers': headers,
                        'body': json.dumps({'error': 'Неверный email или пароль'})
                    }
                
                token = generate_token(user['id'], user['email'])
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'token': token,
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'full_name': user['full_name'],
                            'created_at': user['created_at'].isoformat()
                        }
                    })
                }
        
        elif method == 'GET':
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
            
            cursor.execute(
                """
                SELECT u.id, u.email, u.full_name, u.created_at, 
                       up.test_results, up.completed_topics, up.last_activity
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
