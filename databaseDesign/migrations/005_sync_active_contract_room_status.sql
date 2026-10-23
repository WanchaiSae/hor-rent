BEGIN;

UPDATE rooms r
SET status = 'occupied',
    updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM contracts c
  WHERE c.room_id = r.id
    AND c.status = 'active'
);

COMMIT;
