import { loadEnvConfig } from "@next/env";

/** Loads the shared project-root .env while preserving variables already set by the shell. */
export function loadProjectEnvironment(projectRoot: string): void {
  loadEnvConfig(projectRoot);
}

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB } = process.env;
  if (!POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_DB) {
    throw new Error(
      "Set DATABASE_URL or provide POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB in the project-root .env",
    );
  }

  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  const databaseUrl = new URL(`postgresql://${host}:${port}`);
  databaseUrl.username = POSTGRES_USER;
  databaseUrl.password = POSTGRES_PASSWORD;
  databaseUrl.pathname = `/${POSTGRES_DB}`;
  return databaseUrl.toString();
}
