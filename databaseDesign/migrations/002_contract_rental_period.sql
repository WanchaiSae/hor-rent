BEGIN;

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS rental_period VARCHAR(10) NOT NULL DEFAULT 'monthly';

ALTER TABLE contracts
  ADD CONSTRAINT contracts_rental_period_check
  CHECK (rental_period IN ('monthly', 'daily'));

COMMIT;
