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
    const resolvedPath = path.resolve(filename);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignore error if already exists
      }
    }

    if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).size === 0) {
      const candidates = [
        path.resolve(process.cwd(), "packages/db/db.db"),
        path.resolve(process.cwd(), "data/db.db"),
        path.resolve(__dirname, "./db.db"),
        path.resolve(__dirname, "../../packages/db/db.db"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && candidate !== resolvedPath) {
          try {
            fs.copyFileSync(candidate, resolvedPath);
            break;
          } catch {
            // Ignore error copying template
          }
        }
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
