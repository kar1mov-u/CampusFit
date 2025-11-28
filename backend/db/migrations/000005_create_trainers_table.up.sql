CREATE TABLE trainers (
    trainer_id   UUID PRIMARY KEY REFERENCES users(user_id),
    bio          TEXT,
    specialty    TEXT,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);


CREATE TABLE trainer_weekly_schedule (
    schedule_id  UUID PRIMARY KEY,
    trainer_id   UUID REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    facility_id  UUID REFERENCES facilities(facility_id),
    weekday      SMALLINT NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    capacity     INT NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);


CREATE TABLE trainer_sessions (
    session_id   UUID PRIMARY KEY,
    schedule_id  UUID REFERENCES trainer_weekly_schedule(schedule_id),
    trainer_id   UUID REFERENCES trainers(trainer_id),
    facility_id  UUID REFERENCES facilities(facility_id),
    date         DATE NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    capacity     INT NOT NULL,
    is_canceled  BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (schedule_id, date)  -- prevents duplicates by cron
);


