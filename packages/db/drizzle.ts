// Database initialization and auto-healing engine (v1.0.4)
import fs from "fs";
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

function autoMigrateMissingColumns(dbInstance: InstanceType<typeof Database>) {
  const tableColumns = (tableName: string) => {
    try {
      const rows = dbInstance.pragma(`table_info("${tableName}")`) as {
        name: string;
      }[];
      return new Set(rows.map((r) => r.name));
    } catch {
      return new Set<string>();
    }
  };

  const safeAddColumn = (
    tableName: string,
    colName: string,
    typeDef: string,
  ) => {
    const cols = tableColumns(tableName);
    if (cols.size > 0 && !cols.has(colName)) {
      try {
        dbInstance.exec(
          `ALTER TABLE "${tableName}" ADD COLUMN ${colName} ${typeDef}`,
        );
      } catch {
        // Column may already exist or table missing
      }
    }
  };

  safeAddColumn(
    "user",
    "archiveDisplayBehaviour",
    "text DEFAULT 'show' NOT NULL",
  );
  safeAddColumn("user", "backupsEnabled", "integer DEFAULT false NOT NULL");
  safeAddColumn("user", "backupsFrequency", "text DEFAULT 'weekly' NOT NULL");
  safeAddColumn("user", "backupsRetentionDays", "integer DEFAULT 30 NOT NULL");
  safeAddColumn(
    "user",
    "bookmarkClickAction",
    "text DEFAULT 'open_original_link' NOT NULL",
  );
  safeAddColumn("user", "timezone", "text DEFAULT 'UTC'");
  safeAddColumn("user", "role", "text DEFAULT 'user'");
  safeAddColumn("user", "salt", "text DEFAULT '' NOT NULL");

  safeAddColumn("bookmarks", "lastSavedAt", "integer NOT NULL DEFAULT 0");
  safeAddColumn("bookmarks", "taggingStatus", "text DEFAULT 'pending'");
  safeAddColumn("bookmarks", "summarizationStatus", "text DEFAULT 'pending'");
  safeAddColumn("bookmarks", "embeddingStatus", "text DEFAULT 'pending'");

  safeAddColumn("backups", "status", "text DEFAULT 'pending' NOT NULL");
  safeAddColumn("backups", "errorMessage", "text");
}

// Guarantee all 35 tables, 64 indices, and columns exist even in bundled/serverless environments (Vercel)
try {
  sqlite.exec(SCHEMA_SQL);
  autoMigrateMissingColumns(sqlite);

  // Guarantee primary user exists across all serverless/ephemeral environments
  const userCheck = sqlite
    .prepare(
      "SELECT count(*) as count FROM user WHERE email = 'gajerasiddharth10@gmail.com'",
    )
    .get() as { count: number } | undefined;

  if (!userCheck || userCheck.count === 0) {
    sqlite
      .prepare(
        `INSERT OR REPLACE INTO user (
          id, name, email, role, password, salt
        ) VALUES (
          'cxzee7jvwun32h9bsndixm59',
          'Siddharth Gajera',
          'gajerasiddharth10@gmail.com',
          'admin',
          '$2a$10$HjmtTc9SlLdgrjm3.FGnIuEChS/5wKBJLLSgEJqbYlLvkJeEk3t82',
          '9073499823fe323cfae06ba2cf1ed0c20d3ff8c3d932d6e423fe815b4d8b803f'
        )`,
      )
      .run();
  }

  // Ensure all bookmarks belong to valid user accounts
  try {
    const primaryUserId = "cxzee7jvwun32h9bsndixm59";
    sqlite
      .prepare(
        "UPDATE OR IGNORE \"bookmarks\" SET userId = ? WHERE userId = 'ulpk43eemvbinl6b2nczpk7x' OR userId = ''",
      )
      .run(primaryUserId);
  } catch {
    // Ignore synchronization errors
  }
} catch (e) {
  console.error(
    "Failed to auto-initialize SQLite tables or seed user from schema fallback:",
    e,
  );
}

export function resolveMigrationsFolder(): string | null {
  const current = process.cwd();
  const candidates = [
    path.resolve(__dirname, "./drizzle"),
    path.resolve(__dirname, "../drizzle"),
    path.resolve(__dirname, "../../drizzle"),
    path.resolve(__dirname, "../../../drizzle"),
    path.resolve(current, "packages/db/drizzle"),
    path.resolve(current, "drizzle"),
    path.resolve(current, "../packages/db/drizzle"),
    path.resolve(current, "../../packages/db/drizzle"),
  ];

  for (const folder of candidates) {
    try {
      const journalPath = path.join(folder, "meta/_journal.json");
      if (fs.existsSync(journalPath) && fs.statSync(journalPath).isFile()) {
        return folder;
      }
    } catch {
      // Ignore access errors
    }
  }

  return null;
}

// Schema initialization and column auto-migration are handled safely above via SCHEMA_SQL and autoMigrateMissingColumns.
// Runtime execution of migrate() is disabled to prevent _journal.json bundle missing errors.

export function getInMemoryDB(runMigrations: boolean) {
  const mem = new Database(":memory:");
  const db = drizzle(mem, { schema, logger: false });
  mem.exec(SCHEMA_SQL);
  autoMigrateMissingColumns(mem);
  if (runMigrations) {
    const folder = resolveMigrationsFolder();
    if (folder) {
      try {
        migrate(db, { migrationsFolder: folder });
      } catch {
        // Ignored, schema fallback already applied
      }
    }
  }
  return db;
}
