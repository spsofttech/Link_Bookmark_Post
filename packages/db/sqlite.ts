import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

interface OpenSqliteOptions {
  readOnly: boolean;
  walMode: boolean;
}

export function openSqliteDatabase(
  filename: string,
  options: OpenSqliteOptions,
) {
  if (filename && filename !== ":memory:") {
    const dir = path.dirname(path.resolve(filename));
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignore error if already exists
      }
    }
  }

  let sqlite: Database.Database;
  try {
    sqlite = new Database(
      filename,
      options.readOnly
        ? {
            readonly: true,
            fileMustExist: true,
          }
        : undefined,
    );
  } catch {
    // If opening failed on readOnly or missing file, open/create regularly
    sqlite = new Database(filename);
  }

  if (!options.readOnly) {
    try {
      if (options.walMode) {
        sqlite.pragma("journal_mode = WAL");
        sqlite.pragma("synchronous = NORMAL");
      } else {
        sqlite.pragma("journal_mode = DELETE");
      }
    } catch {
      // Ignored if journaling cannot be altered
    }
  }

  try {
    sqlite.pragma("cache_size = -65536");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("temp_store = MEMORY");
  } catch {
    // Ignored
  }

  if (options.readOnly) {
    try {
      sqlite.pragma("query_only = ON");
    } catch {
      // Ignored
    }
  }

  return sqlite;
}
