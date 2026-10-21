import { Pool } from "pg";
import { resolve } from "node:path";
import { getDatabaseUrl, loadProjectEnvironment } from "@/lib/config/environment";

loadProjectEnvironment(resolve(process.cwd(), ".."));
const connectionString = getDatabaseUrl();

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

export const db =
  globalForPostgres.postgresPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = db;
}
