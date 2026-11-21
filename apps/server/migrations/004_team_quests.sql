-- E06 team weekly/daily quest progress (scaffold)
CREATE TABLE IF NOT EXISTS team_quests (
    team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    quest_id    TEXT NOT NULL,
    progress    INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
    target      INT NOT NULL DEFAULT 1 CHECK (target >= 1),
    reset_at    TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, quest_id)
);
