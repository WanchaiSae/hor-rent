BEGIN;

CREATE TABLE IF NOT EXISTS dormitories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  province VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dormitory_id BIGINT NOT NULL REFERENCES dormitories(id) ON DELETE RESTRICT,
  room_number VARCHAR(20) NOT NULL,
  floor SMALLINT,
  room_type VARCHAR(50),
  capacity SMALLINT NOT NULL DEFAULT 1 CHECK (capacity > 0),
  monthly_rent NUMERIC(12, 2) NOT NULL CHECK (monthly_rent >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dormitory_id, room_number)
);

CREATE TABLE IF NOT EXISTS tenants (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  citizen_id VARCHAR(20) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(255),
  emergency_contact VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dormitory_id BIGINT NOT NULL REFERENCES dormitories(id) ON DELETE RESTRICT,
  room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  rental_period VARCHAR(10) NOT NULL DEFAULT 'monthly',
  contract_number VARCHAR(50) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent NUMERIC(12, 2) NOT NULL CHECK (monthly_rent >= 0),
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  terms TEXT,
  check_in_date DATE,
  check_out_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS contract_tenants (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  move_in_date DATE,
  move_out_date DATE,
  UNIQUE (contract_id, tenant_id),
  CHECK (move_out_date IS NULL OR move_in_date IS NULL OR move_out_date >= move_in_date)
);

CREATE TABLE IF NOT EXISTS transaction_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, type)
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dormitory_id BIGINT NOT NULL REFERENCES dormitories(id) ON DELETE RESTRICT,
  room_id BIGINT REFERENCES rooms(id) ON DELETE RESTRICT,
  contract_id BIGINT REFERENCES contracts(id) ON DELETE RESTRICT,
  category_id BIGINT NOT NULL REFERENCES transaction_categories(id) ON DELETE RESTRICT,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dormitory_id BIGINT NOT NULL REFERENCES dormitories(id) ON DELETE RESTRICT,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  transaction_id BIGINT REFERENCES transactions(id) ON DELETE SET NULL
);

-- Add metadata columns when upgrading a database created from the earlier ER schema.
ALTER TABLE dormitories
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE transaction_categories
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS rooms_dormitory_status_idx ON rooms (dormitory_id, status);
CREATE INDEX IF NOT EXISTS contracts_room_status_idx ON contracts (room_id, status);
CREATE INDEX IF NOT EXISTS contract_tenants_tenant_idx ON contract_tenants (tenant_id);
CREATE INDEX IF NOT EXISTS transactions_dormitory_date_idx ON transactions (dormitory_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS invoices_contract_status_idx ON invoices (contract_id, status);

COMMIT;
