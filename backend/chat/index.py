import json
import os
from typing import Dict, Any
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Бизнес: Чат между студентами и преподавателями
    Args: event - dict с httpMethod, body, queryStringParameters, headers
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict
    '''
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
    
    headers = event.get('headers', {})
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if not auth_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Auth token required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, role FROM t_p91447108_ai_improvement_websi.users WHERE auth_token = %s", (auth_token,))
        user_row = cursor.fetchone()
        
        if not user_row:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token'}),
                'isBase64Encoded': False
            }
        
        user_id, role = user_row
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            other_user_id = params.get('other_user_id')
            
            if not other_user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'other_user_id is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                SELECT cm.id, cm.sender_id, cm.receiver_id, cm.message, cm.is_read, cm.created_at,
                       u.full_name
                FROM t_p91447108_ai_improvement_websi.chat_messages cm
                JOIN t_p91447108_ai_improvement_websi.users u ON u.id = cm.sender_id
                WHERE (cm.sender_id = %s AND cm.receiver_id = %s)
                   OR (cm.sender_id = %s AND cm.receiver_id = %s)
                ORDER BY cm.created_at ASC
            """, (user_id, other_user_id, other_user_id, user_id))
            
            messages = []
            for row in cursor.fetchall():
                messages.append({
                    'id': row[0],
                    'sender_id': row[1],
                    'receiver_id': row[2],
                    'message': row[3],
                    'is_read': row[4],
                    'created_at': row[5].isoformat() if row[5] else None,
                    'sender_name': row[6]
                })
            
            cursor.execute("""
                UPDATE t_p91447108_ai_improvement_websi.chat_messages
                SET is_read = TRUE
                WHERE receiver_id = %s AND sender_id = %s AND is_read = FALSE
            """, (user_id, other_user_id))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
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
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'receiver_id and message are required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    INSERT INTO t_p91447108_ai_improvement_websi.chat_messages
                    (sender_id, receiver_id, message)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (user_id, receiver_id, message))
                
                message_id = cursor.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message_id': message_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'unread_count':
                cursor.execute("""
                    SELECT COUNT(*)
                    FROM t_p91447108_ai_improvement_websi.chat_messages
                    WHERE receiver_id = %s AND is_read = FALSE
                """, (user_id,))
                
                unread_count = cursor.fetchone()[0]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'unread_count': unread_count}),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cursor.close()
        conn.close()