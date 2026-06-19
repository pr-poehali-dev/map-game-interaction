import json
import os
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
        'body': json.dumps(body, default=str),
    }


def _auth(cur, token):
    if not token:
        return None
    cur.execute("SELECT id, username, clan_id FROM players WHERE token = %s", (token,))
    r = cur.fetchone()
    if not r:
        return None
    return {'id': r[0], 'username': r[1], 'clan_id': r[2]}


def _clan_json(cur, clan_id):
    cur.execute("SELECT id, name, tag, color FROM clans WHERE id = %s", (clan_id,))
    c = cur.fetchone()
    if not c:
        return None
    cur.execute("SELECT username FROM players WHERE clan_id = %s", (clan_id,))
    members = [m[0] for m in cur.fetchall()]
    return {'id': c[0], 'name': c[1], 'tag': c[2], 'color': c[3], 'members': members}


def handler(event, context):
    '''Кланы: список с поиском, создание, заявки на вступление, приём, выход, лидерборд.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    body = json.loads(event.get('body') or '{}')
    action = body.get('action', 'list')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    try:
        me = _auth(cur, token)
        if not me:
            return _resp(401, {'error': 'Не авторизован'})

        if action == 'list':
            q = (body.get('query') or '').strip().lower()
            cur.execute(
                "SELECT c.id, c.name, c.tag, c.color, count(p.id) "
                "FROM clans c LEFT JOIN players p ON p.clan_id = c.id GROUP BY c.id ORDER BY c.id DESC"
            )
            clans = []
            for r in cur.fetchall():
                if q and q not in (r[1] + r[2]).lower():
                    continue
                clans.append({'id': r[0], 'name': r[1], 'tag': r[2], 'color': r[3], 'count': r[4]})
            # мои заявки
            cur.execute("SELECT clan_id FROM clan_requests WHERE player_id = %s", (me['id'],))
            requested = [x[0] for x in cur.fetchall()]
            my_clan = _clan_json(cur, me['clan_id']) if me['clan_id'] else None
            return _resp(200, {'clans': clans, 'requested': requested, 'myClan': my_clan})

        if action == 'create':
            if me['clan_id']:
                return _resp(409, {'error': 'Вы уже в клане'})
            name = (body.get('name') or '').strip().upper()[:64]
            if not name:
                return _resp(400, {'error': 'Введите название'})
            tag = name[:3].upper()
            color = body.get('color', '#4dc9ff')
            cur.execute("SELECT id FROM clans WHERE name = %s", (name,))
            if cur.fetchone():
                return _resp(409, {'error': 'Название занято'})
            cur.execute(
                "INSERT INTO clans (name, tag, color) VALUES (%s, %s, %s) RETURNING id",
                (name, tag, color),
            )
            cid = cur.fetchone()[0]
            cur.execute("UPDATE players SET clan_id = %s WHERE id = %s", (cid, me['id']))
            return _resp(200, {'myClan': _clan_json(cur, cid)})

        if action == 'request':
            if me['clan_id']:
                return _resp(409, {'error': 'Вы уже в клане'})
            cid = int(body['clanId'])
            cur.execute(
                "INSERT INTO clan_requests (clan_id, player_id) VALUES (%s, %s) "
                "ON CONFLICT (clan_id, player_id) DO NOTHING",
                (cid, me['id']),
            )
            return _resp(200, {'ok': True})

        if action == 'requests':
            # заявки в мой клан
            if not me['clan_id']:
                return _resp(200, {'requests': []})
            cur.execute(
                "SELECT r.id, p.username FROM clan_requests r "
                "JOIN players p ON p.id = r.player_id WHERE r.clan_id = %s",
                (me['clan_id'],),
            )
            reqs = [{'id': r[0], 'username': r[1]} for r in cur.fetchall()]
            return _resp(200, {'requests': reqs})

        if action == 'accept':
            if not me['clan_id']:
                return _resp(403, {'error': 'Вы не в клане'})
            req_id = int(body['requestId'])
            cur.execute(
                "SELECT player_id, clan_id FROM clan_requests WHERE id = %s", (req_id,)
            )
            r = cur.fetchone()
            if not r or r[1] != me['clan_id']:
                return _resp(404, {'error': 'Заявка не найдена'})
            cur.execute("UPDATE players SET clan_id = %s WHERE id = %s", (me['clan_id'], r[0]))
            cur.execute("DELETE FROM clan_requests WHERE player_id = %s", (r[0],))
            return _resp(200, {'myClan': _clan_json(cur, me['clan_id'])})

        if action == 'leave':
            cur.execute("UPDATE players SET clan_id = NULL WHERE id = %s", (me['id'],))
            return _resp(200, {'ok': True})

        if action == 'leaderboard':
            cur.execute(
                "SELECT creator, count(*) FROM items GROUP BY creator ORDER BY count(*) DESC LIMIT 20"
            )
            rows = [{'name': r[0], 'items': r[1]} for r in cur.fetchall()]
            return _resp(200, {'leaders': rows})

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()
