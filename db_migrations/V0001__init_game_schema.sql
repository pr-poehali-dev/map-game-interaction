CREATE TABLE clans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    tag VARCHAR(8) NOT NULL,
    color VARCHAR(16) NOT NULL DEFAULT '#4dc9ff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(32) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    char_index INTEGER NOT NULL DEFAULT 0,
    pos_x INTEGER NOT NULL DEFAULT 5,
    pos_y INTEGER NOT NULL DEFAULT 5,
    clan_id INTEGER REFERENCES clans(id),
    token VARCHAR(64),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clan_requests (
    id SERIAL PRIMARY KEY,
    clan_id INTEGER NOT NULL REFERENCES clans(id),
    player_id INTEGER NOT NULL REFERENCES players(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(clan_id, player_id)
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    sprite JSONB NOT NULL,
    creator VARCHAR(32) NOT NULL,
    editors JSONB NOT NULL DEFAULT '[]',
    solid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_pos ON items(x, y);

CREATE TABLE privats (
    id SERIAL PRIMARY KEY,
    col INTEGER NOT NULL,
    row INTEGER NOT NULL,
    owner VARCHAR(32) NOT NULL,
    clan_id INTEGER REFERENCES clans(id),
    until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(col, row)
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    text VARCHAR(280) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_created ON chat_messages(created_at);
