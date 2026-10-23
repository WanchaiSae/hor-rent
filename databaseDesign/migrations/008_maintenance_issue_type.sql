BEGIN;

ALTER TABLE maintenance_jobs
  ADD COLUMN IF NOT EXISTS issue_type VARCHAR(30) NOT NULL DEFAULT 'other';

ALTER TABLE maintenance_jobs
  DROP CONSTRAINT IF EXISTS maintenance_jobs_issue_type_check;

ALTER TABLE maintenance_jobs
  ADD CONSTRAINT maintenance_jobs_issue_type_check
  CHECK (issue_type IN (
    'lighting',
    'air_conditioning',
    'electrical',
    'plumbing',
    'door_lock',
    'furniture',
    'laundry_machine',
    'water_dispenser',
    'other'
  ));

CREATE INDEX IF NOT EXISTS maintenance_jobs_issue_type_status_idx
  ON maintenance_jobs (issue_type, status, reported_at DESC);

COMMIT;
