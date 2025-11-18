-- Enum type
CREATE TYPE sport_type AS ENUM ('football', 'basketball', 'tennis');


CREATE TABLE IF NOT EXISTS facilities (
    facility_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    type          sport_type NOT NULL,
    description   TEXT,
    capacity      INTEGER,
    open_time     TIME NOT NULL,
    close_time    TIME NOT NULL,
    image_url     TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

