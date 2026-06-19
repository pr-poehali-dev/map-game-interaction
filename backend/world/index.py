import json
import os
import datetime
import psycopg2

PERIOD = 12
FRAME = 2
SECTOR = 10
DAY_SECONDS = 86400


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


def _ms(dt):
    return int(dt.timestamp() * 1000)


def _sector_of(x, y):
    fx = x % PERIOD
    fy = y % PERIOD
    if fx < FRAME or fy < FRAME:
        return None
    return (x // PERIOD, y // PERIOD)


def _auth(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT p.id, p.username, p.clan_id, c.tag, c.name "
        "FROM players p LEFT JOIN clans c ON c.id = p.clan_id WHERE p.token = %s",
        (token,),
    )
    r = cur.fetchone()
    if not r:
        return None
    return {'id': r[0], 'username': r[1], 'clan_id': r[2], 'clan_tag': r[3], 'clan_name': r[4]}


def handler(event, context):
    '''Синхронизация игрового мира: позиции игроков, предметы на карте, чат, приваты.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', 'sync')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    try:
        me = _auth(cur, token)
        if not me:
            return _resp(401, {'error': 'Не авторизован'})

        uname = me['username']

        if action == 'sync':
            x = int(body.get('x', 5))
            y = int(body.get('y', 5))
            cur.execute(
                "UPDATE players SET pos_x = %s, pos_y = %s, last_seen = now() WHERE id = %s",
                (x, y, me['id']),
            )
            # игроки онлайн (активны за последние 30 сек)
            cur.execute(
                "SELECT username, pos_x, pos_y, char_index FROM players "
                "WHERE last_seen > now() - interval '30 seconds' AND username <> %s",
                (uname,),
            )
            players = [{'name': r[0], 'x': r[1], 'y': r[2], 'char': r[3]} for r in cur.fetchall()]

            cur.execute("SELECT id, x, y, sprite, creator, editors, solid FROM items")
            items = [{
                'id': r[0], 'x': r[1], 'y': r[2], 'sprite': r[3],
                'creator': r[4], 'editors': r[5], 'solid': r[6],
            } for r in cur.fetchall()]

            cur.execute(
                "SELECT pv.col, pv.row, pv.owner, pv.until, c.tag, c.name, c.color "
                "FROM privats pv LEFT JOIN clans c ON c.id = pv.clan_id WHERE pv.until > now()"
            )
            privats = [{
                'col': r[0], 'row': r[1], 'owner': r[2], 'until': _ms(r[3]),
                'clanTag': r[4] or '', 'clanName': r[5] or '', 'color': r[6] or '#2bdc87',
            } for r in cur.fetchall()]

            cur.execute(
                "SELECT id, username, text FROM chat_messages ORDER BY id DESC LIMIT 30"
            )
            chat = [{'id': r[0], 'name': r[1], 'text': r[2]} for r in reversed(cur.fetchall())]

            return _resp(200, {'players': players, 'items': items, 'privats': privats, 'chat': chat})

        if action == 'drop':
            x = int(body['x'])
            y = int(body['y'])
            sec = _sector_of(x, y)
            if sec is None:
                return _resp(403, {'error': 'В рамке нельзя ставить'})
            # проверка привата
            cur.execute(
                "SELECT owner, clan_id FROM privats WHERE col = %s AND row = %s AND until > now()",
                (sec[0], sec[1]),
            )
            pv = cur.fetchone()
            if pv:
                allowed = (pv[0] == uname) or (pv[1] is not None and pv[1] == me['clan_id'])
                if not allowed:
                    return _resp(403, {'error': 'Сектор приватен'})
            cur.execute("SELECT id FROM items WHERE x = %s AND y = %s", (x, y))
            if cur.fetchone():
                return _resp(409, {'error': 'Клетка занята'})
            sprite = body['sprite']
            creator = body.get('creator', uname)
            editors = body.get('editors', [])
            solid = bool(body.get('solid', False))
            cur.execute(
                "INSERT INTO items (x, y, sprite, creator, editors, solid) "
                "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (x, y, json.dumps(sprite), creator, json.dumps(editors), solid),
            )
            return _resp(200, {'id': cur.fetchone()[0]})

        if action == 'pick':
            item_id = int(body['id'])
            cur.execute("SELECT x, y FROM items WHERE id = %s", (item_id,))
            it = cur.fetchone()
            if not it:
                return _resp(404, {'error': 'Нет предмета'})
            sec = _sector_of(it[0], it[1])
            if sec is not None:
                cur.execute(
                    "SELECT owner, clan_id FROM privats WHERE col = %s AND row = %s AND until > now()",
                    (sec[0], sec[1]),
                )
                pv = cur.fetchone()
                if pv:
                    allowed = (pv[0] == uname) or (pv[1] is not None and pv[1] == me['clan_id'])
                    if not allowed:
                        return _resp(403, {'error': 'Нельзя забрать из привата'})
            cur.execute("DELETE FROM items WHERE id = %s", (item_id,))
            return _resp(200, {'ok': True})

        if action == 'edit':
            item_id = int(body['id'])
            sprite = body['sprite']
            cur.execute("SELECT creator, editors FROM items WHERE id = %s", (item_id,))
            it = cur.fetchone()
            if not it:
                return _resp(404, {'error': 'Нет предмета'})
            editors = it[1] or []
            if uname != it[0] and uname not in editors:
                editors = editors + [uname]
            cur.execute(
                "UPDATE items SET sprite = %s, editors = %s WHERE id = %s",
                (json.dumps(sprite), json.dumps(editors), item_id),
            )
            return _resp(200, {'ok': True})

        if action == 'solid':
            item_id = int(body['id'])
            cur.execute("UPDATE items SET solid = %s WHERE id = %s", (bool(body.get('solid')), item_id))
            return _resp(200, {'ok': True})

        if action == 'chat':
            text = (body.get('text') or '').strip()[:280]
            if text:
                cur.execute("INSERT INTO chat_messages (username, text) VALUES (%s, %s)", (uname, text))
            return _resp(200, {'ok': True})

        if action == 'privatize':
            col = int(body['col'])
            row = int(body['row'])
            until = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)
            cur.execute("SELECT until FROM privats WHERE col = %s AND row = %s", (col, row))
            ex = cur.fetchone()
            if ex and ex[0] > datetime.datetime.now(datetime.timezone.utc):
                return _resp(409, {'error': 'Сектор уже приватен'})
            cur.execute(
                "INSERT INTO privats (col, row, owner, clan_id, until) VALUES (%s, %s, %s, %s, %s) "
                "ON CONFLICT (col, row) DO UPDATE SET owner = EXCLUDED.owner, clan_id = EXCLUDED.clan_id, until = EXCLUDED.until",
                (col, row, uname, me['clan_id'], until),
            )
            return _resp(200, {'until': _ms(until)})

        if action == 'extend':
            col = int(body['col'])
            row = int(body['row'])
            cur.execute("SELECT owner, clan_id FROM privats WHERE col = %s AND row = %s", (col, row))
            pv = cur.fetchone()
            if not pv:
                return _resp(404, {'error': 'Нет привата'})
            allowed = (pv[0] == uname) or (pv[1] is not None and pv[1] == me['clan_id'])
            if not allowed:
                return _resp(403, {'error': 'Нет прав на продление'})
            until = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)
            cur.execute("UPDATE privats SET until = %s WHERE col = %s AND row = %s", (until, col, row))
            return _resp(200, {'until': _ms(until)})

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()