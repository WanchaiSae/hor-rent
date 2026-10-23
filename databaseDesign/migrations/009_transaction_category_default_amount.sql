BEGIN;

ALTER TABLE transaction_categories
  ADD COLUMN IF NOT EXISTS default_amount NUMERIC(12, 2);

ALTER TABLE transaction_categories
  DROP CONSTRAINT IF EXISTS transaction_categories_default_amount_check;

ALTER TABLE transaction_categories
  ADD CONSTRAINT transaction_categories_default_amount_check
  CHECK (default_amount IS NULL OR default_amount >= 0);

COMMIT;
