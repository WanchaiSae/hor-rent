import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { getDatabaseUrl, loadProjectEnvironment } from "../src/lib/config/environment";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadProjectEnvironment(resolve(scriptDirectory, "../.."));

const databaseUrl = getDatabaseUrl();

const pool = new Pool({ connectionString: databaseUrl });
const client = await pool.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(100) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrations = [
    "001_initial_schema",
    "002_contract_rental_period",
    "003_room_floor",
    "004_backfill_room_floor",
    "005_sync_active_contract_room_status",
    "006_contract_tenant_unique_pair",
    "007_property_operations",
    "008_maintenance_issue_type",
    "009_transaction_category_default_amount",
  ];

  for (const version of migrations) {
    const existing = await client.query(
      "SELECT 1 FROM schema_migrations WHERE version = $1",
      [version],
    );

    if (existing.rowCount) {
      console.log(`Migration ${version} already applied`);
      continue;
    }

    const migration = await readFile(
      resolve(scriptDirectory, `../../databaseDesign/migrations/${version}.sql`),
      "utf8",
    );
    await client.query(migration);
    await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
    console.log(`Applied migration ${version}`);
  }
} finally {
  client.release();
  await pool.end();
}
