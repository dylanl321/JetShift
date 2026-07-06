-- Migration: 0002_personalize_trips
-- Adds round-trip, flight, and personalization columns. plan_json now stores a full Itinerary.

ALTER TABLE trips ADD COLUMN return_datetime TEXT;      -- ISO datetime for return leg, or NULL
ALTER TABLE trips ADD COLUMN flight_number TEXT;        -- e.g. "BA178", optional
ALTER TABLE trips ADD COLUMN age INTEGER;               -- chronological age, optional
ALTER TABLE trips ADD COLUMN chronotype TEXT;           -- 'early' | 'intermediate' | 'late'
ALTER TABLE trips ADD COLUMN caffeine TEXT;             -- 'none' | 'sensitive' | 'average' | 'tolerant'
ALTER TABLE trips ADD COLUMN uses_melatonin INTEGER;    -- 0 | 1
