-- Migration: 0001_create_trips
-- Creates the trips table for storing JetShift plans

CREATE TABLE IF NOT EXISTS trips (
  id               TEXT PRIMARY KEY,
  created_at       TEXT NOT NULL,
  departure_tz     TEXT NOT NULL,
  arrival_tz       TEXT NOT NULL,
  departure_datetime TEXT NOT NULL,
  typical_sleep_start TEXT NOT NULL,  -- HH:MM
  typical_sleep_end   TEXT NOT NULL,  -- HH:MM
  plan_json        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
