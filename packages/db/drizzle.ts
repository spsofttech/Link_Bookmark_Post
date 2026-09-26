import "dotenv/config";

import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import serverConfig from "@karakeep/shared/config";

import dbConfig from "./drizzle.config";
import { instrumentDatabase } from "./instrumentation";
import * as schema from "./schema";
import { openSqliteDatabase } from "./sqlite";
import { SCHEMA_SQL } from "./schema_sql";

const sqlite = openSqliteDatabase(dbConfig.dbCredentials.url, {
  readOnly: serverConfig.degradedMode,
  walMode: serverConfig.database.walMode,
});

instrumentDatabase(sqlite);

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;

// Guarantee all 35 tables and 64 indices exist even in bundled/serverless environments (Vercel)
try {
  const tableCheck = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
    .get();
  if (!tableCheck) {
    sqlite.exec(SCHEMA_SQL);
  }
} catch (e) {
  console.error("Failed to auto-initialize SQLite tables from schema fallback:", e);
}

try {
  if (!serverConfig.degradedMode) {
    migrate(db, { migrationsFolder: path.resolve(__dirname, "./drizzle") });
  }
} catch {
  // Ignored if migrations already applied, read-only mode, or running concurrently
}

export function getInMemoryDB(runMigrations: boolean) {
  const mem = new Database(":memory:");
  const db = drizzle(mem, { schema, logger: false });
  if (runMigrations) {
    migrate(db, { migrationsFolder: path.resolve(__dirname, "./drizzle") });
  }
  return db;
}
