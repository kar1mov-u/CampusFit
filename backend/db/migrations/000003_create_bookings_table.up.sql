CREATE TABLE bookings (
    booking_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,  --fk
    facility_id  UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,  --fk
    date         DATE NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    note         TEXT,
    is_canceled  BOOLEAN NOT NULL DEFAULT FALSE,
    admin_note   TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);