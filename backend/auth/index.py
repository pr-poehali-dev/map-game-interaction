import json
import os
import hashlib
import secrets
import psycopg2


def _resp(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        },
        'isBase64Encoded': False,
        'body': json.dumps(body),
    }


def _hash(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def handler(event, context):
    '''Регистрация и вход игроков. Возвращает токен и профиль (позиция, персонаж, клан).'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')
    username = (body.get('username') or '').strip()[:32]
    password = body.get('password') or ''

    if not username or not password:
        return _resp(400, {'error': 'Введите имя и пароль'})

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        if action == 'register':
            cur.execute("SELECT id FROM players WHERE username = %s", (username,))
            if cur.fetchone():
                return _resp(409, {'error': 'Имя уже занято'})
            char_index = int(body.get('char', 0))
            token = secrets.token_hex(24)
            cur.execute(
                "INSERT INTO players (username, password, char_index, token) "
                "VALUES (%s, %s, %s, %s) RETURNING id, pos_x, pos_y",
                (username, _hash(password), char_index, token),
            )
            row = cur.fetchone()
            return _resp(200, {
                'token': token,
                'username': username,
                'char': char_index,
                'x': row[1],
                'y': row[2],
                'clan': None,
            })

        if action == 'login':
            cur.execute(
                "SELECT id, password, char_index, pos_x, pos_y, clan_id FROM players WHERE username = %s",
                (username,),
            )
            row = cur.fetchone()
            if not row or row[1] != _hash(password):
                return _resp(401, {'error': 'Неверное имя или пароль'})
            token = secrets.token_hex(24)
            cur.execute("UPDATE players SET token = %s, last_seen = now() WHERE id = %s", (token, row[0]))
            clan = None
            if row[5]:
                cur.execute("SELECT id, name, tag, color FROM clans WHERE id = %s", (row[5],))
                c = cur.fetchone()
                if c:
                    clan = {'id': c[0], 'name': c[1], 'tag': c[2], 'color': c[3]}
            return _resp(200, {
                'token': token,
                'username': username,
                'char': row[2],
                'x': row[3],
                'y': row[4],
                'clan': clan,
            })

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()
