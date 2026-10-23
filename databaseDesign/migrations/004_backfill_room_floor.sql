BEGIN;

-- Existing room numbers such as 201 and 301 encode the floor in every digit
-- except the final two. Backfill only unambiguous numeric room numbers.
UPDATE rooms
SET floor = LEFT(room_number, LENGTH(room_number) - 2)::SMALLINT
WHERE floor IS NULL
  AND room_number ~ '^[1-9][0-9]{2,6}$'
  AND LEFT(room_number, LENGTH(room_number) - 2)::INTEGER <= 32767;

COMMIT;
