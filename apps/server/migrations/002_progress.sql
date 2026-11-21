-- Player progress, build stars, buildings (E04/E05 foundation)
CREATE TABLE IF NOT EXISTS players (
    id              UUID PRIMARY KEY,
    guest_token     TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL DEFAULT 'Гость',
    coins           INT NOT NULL DEFAULT 0 CHECK (coins >= 0),
    diamonds        INT NOT NULL DEFAULT 0 CHECK (diamonds >= 0),
    build_stars     INT NOT NULL DEFAULT 0 CHECK (build_stars >= 0),
    max_level_cleared INT NOT NULL DEFAULT 0 CHECK (max_level_cleared >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS level_first_clears (
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    level_no    INT NOT NULL CHECK (level_no >= 1 AND level_no <= 300),
    stars_rated INT NOT NULL DEFAULT 1 CHECK (stars_rated BETWEEN 1 AND 3),
    coins_gained INT NOT NULL DEFAULT 0,
    build_star_gained BOOLEAN NOT NULL DEFAULT FALSE,
    cleared_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, level_no)
);

CREATE TABLE IF NOT EXISTS player_buildings (
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    building_id TEXT NOT NULL CHECK (building_id ~ '^B(0[1-9]|1[0-9]|20)$'),
    stage       INT NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 3),
    style       TEXT NOT NULL DEFAULT 'tropical'
                CHECK (style IN ('tropical', 'luxury', 'fantasy')),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, building_id)
);

CREATE TABLE IF NOT EXISTS economy_ledger (
    id              BIGSERIAL PRIMARY KEY,
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,
    kind            TEXT NOT NULL,
    delta_coins     INT NOT NULL DEFAULT 0,
    delta_diamonds  INT NOT NULL DEFAULT 0,
    delta_stars     INT NOT NULL DEFAULT 0,
    meta            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS economy_ledger_player_idx ON economy_ledger(player_id);
