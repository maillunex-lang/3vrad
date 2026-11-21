-- E05 inventory / shop + E06 teams scaffold
CREATE TABLE IF NOT EXISTS player_inventory (
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id     TEXT NOT NULL,
    qty         INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, item_id)
);

CREATE TABLE IF NOT EXISTS teams (
    id          UUID PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    owner_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, player_id),
    UNIQUE (player_id)
);

CREATE INDEX IF NOT EXISTS team_members_team_idx ON team_members(team_id);
