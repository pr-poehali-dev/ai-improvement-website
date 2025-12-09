"""
Business: Chat between students and teachers with JWT authentication
Args: event with httpMethod, body, queryStringParameters, headers
      context with request_id, function_name
Returns: HTTP response dict
"""

import json
import os
import jwt
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            other_user_id = params.get('other_user_id')
            
            if not other_user_id:
                return {
                    'statusCode': 400,
                    'headers': response_headers,
                    'body': json.dumps({'error': 'other_user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                SELECT cm.id, cm.sender_id, cm.receiver_id, cm.message, cm.is_read, cm.created_at,
                       u.full_name
                FROM chat_messages cm
                JOIN users u ON u.id = cm.sender_id
                WHERE (cm.sender_id = %s AND cm.receiver_id = %s)
                   OR (cm.sender_id = %s AND cm.receiver_id = %s)
                ORDER BY cm.created_at ASC
            """, (user_id, other_user_id, other_user_id, user_id))
            
            messages = []
            for row in cursor.fetchall():
                messages.append({
                    'id': row['id'],
                    'sender_id': row['sender_id'],
                    'receiver_id': row['receiver_id'],
                    'message': row['message'],
                    'is_read': row['is_read'],
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                    'sender_name': row['full_name']
                })
            
            cursor.execute("""
                UPDATE chat_messages
                SET is_read = TRUE
                WHERE receiver_id = %s AND sender_id = %s AND is_read = FALSE
            """, (user_id, other_user_id))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': response_headers,
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'send':
                receiver_id = body_data.get('receiver_id')
                message = body_data.get('message', '').strip()
                
                if not receiver_id or not message:
                    return {
                        'statusCode': 400,
                        'headers': response_headers,
                        'body': json.dumps({'error': 'receiver_id и message обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    INSERT INTO chat_messages (sender_id, receiver_id, message)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (user_id, receiver_id, message))
                
                message_id = cursor.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': response_headers,
                    'body': json.dumps({'success': True, 'message_id': message_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'unread_count':
                cursor.execute("""
                    SELECT COUNT(*) as count
                    FROM chat_messages
                    WHERE receiver_id = %s AND is_read = FALSE
                """, (user_id,))
                
                unread_count = cursor.fetchone()['count']
                
                return {
                    'statusCode': 200,
                    'headers': response_headers,
                    'body': json.dumps({'unread_count': unread_count}),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': response_headers,
                    'body': json.dumps({'error': 'Неверное действие'}),
                    'isBase64Encoded': False
                }
        
        else:
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
    
    finally:
        cursor.close()
        conn.close()
