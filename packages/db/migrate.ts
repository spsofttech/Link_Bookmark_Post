import fs from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import serverConfig from "@karakeep/shared/config";

import { db } from "./drizzle";

if (serverConfig.degradedMode) {
  console.log("Skipping database migrations in degraded mode");
} else {
  try {
    const candidates = [
      path.resolve(__dirname, "./drizzle"),
      path.resolve(process.cwd(), "packages/db/drizzle"),
      path.resolve(process.cwd(), "drizzle"),
      path.resolve(__dirname, "../../packages/db/drizzle"),
    ];
    for (const folder of candidates) {
      if (fs.existsSync(path.join(folder, "meta/_journal.json"))) {
        migrate(db, { migrationsFolder: folder });
        break;
      }
    }
  } catch (e) {
    console.warn("Failed to apply database migrations:", e);
  }
}
