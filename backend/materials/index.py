import json
import os
import base64
import uuid
from typing import Dict, Any
import psycopg2
import boto3
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Бизнес: Управление учебными материалами (загрузка, список, удаление)
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
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    
    dsn = os.environ['DATABASE_URL']
    if '?' in dsn:
        dsn = dsn.split('?')[0]
    dsn += '?options=-c search_path=t_p91447108_ai_improvement_websi,public'
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, role FROM users WHERE auth_token = %s", (auth_token,))
        user_row = cursor.fetchone()
        
        if not user_row:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token'}),
                'isBase64Encoded': False
            }
        
        user_id, role = user_row
        
        if role != 'teacher':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Only teachers can manage materials'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            cursor.execute("""
                SELECT id, title, description, file_url, file_type, file_size, 
                       category, created_at
                FROM learning_materials 
                WHERE teacher_id = %s 
                ORDER BY created_at DESC
            """, (user_id,))
            
            materials = []
            for row in cursor.fetchall():
                materials.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'file_url': row[3],
                    'file_type': row[4],
                    'file_size': row[5],
                    'category': row[6],
                    'created_at': row[7].isoformat() if row[7] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'materials': materials}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'upload':
                title = body_data.get('title', '').strip()
                description = body_data.get('description', '').strip()
                file_base64 = body_data.get('file_base64')
                file_name = body_data.get('file_name')
                file_type = body_data.get('file_type', 'application/octet-stream')
                category = body_data.get('category', 'Общее')
                
                if not title or not file_base64 or not file_name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Title, file and file_name are required'}),
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
                
                material_id = cursor.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
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
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            material_id = params.get('material_id')
            
            if not material_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'material_id is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "DELETE FROM learning_materials WHERE id = %s AND teacher_id = %s",
                (material_id, user_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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