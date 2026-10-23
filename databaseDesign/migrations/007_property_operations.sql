BEGIN;

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(150),
  phone VARCHAR(30),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dormitory_id BIGINT NOT NULL REFERENCES dormitories(id) ON DELETE RESTRICT,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT,
  amenity_type VARCHAR(30) NOT NULL CHECK (amenity_type IN ('laundry_machine', 'water_dispenser')),
  name VARCHAR(100) NOT NULL,
  asset_tag VARCHAR(50) UNIQUE,
  location VARCHAR(150) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'maintenance', 'inactive')),
  installed_on DATE,
  last_serviced_on DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_jobs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id BIGINT REFERENCES rooms(id) ON DELETE RESTRICT,
  amenity_id BIGINT REFERENCES amenities(id) ON DELETE RESTRICT,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_on DATE,
  cost NUMERIC(12, 2) CHECK (cost IS NULL OR cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (num_nonnulls(room_id, amenity_id) = 1)
);

CREATE INDEX IF NOT EXISTS amenities_dormitory_status_idx
  ON amenities (dormitory_id, status, amenity_type);
CREATE INDEX IF NOT EXISTS maintenance_jobs_status_reported_idx
  ON maintenance_jobs (status, reported_at DESC);
CREATE INDEX IF NOT EXISTS maintenance_jobs_room_idx
  ON maintenance_jobs (room_id) WHERE room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS maintenance_jobs_amenity_idx
  ON maintenance_jobs (amenity_id) WHERE amenity_id IS NOT NULL;

COMMIT;
