CREATE TYPE penalty_type AS ENUM ('late', 'absence', 'damage', 'behavior', 'other');

CREATE TABLE user_penalties (
    penalty_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    given_by_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id     UUID REFERENCES trainer_sessions(session_id) ON DELETE CASCADE,  -- optional
    booking_id     UUID REFERENCES bookings(booking_id) ON DELETE CASCADE,

    reason         TEXT NOT NULL,
    points         INT NOT NULL,
    penalty_type penalty_type NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CHECK (user_id <> given_by_id)
);
