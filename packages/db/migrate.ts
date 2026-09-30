import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import serverConfig from "@karakeep/shared/config";

import { db, resolveMigrationsFolder } from "./drizzle";

if (serverConfig.degradedMode) {
  console.log("Skipping database migrations in degraded mode");
} else {
  try {
    const folder = resolveMigrationsFolder();
    if (folder) {
      migrate(db, { migrationsFolder: folder });
    }
  } catch (e) {
    console.warn("Failed to apply database migrations:", e);
  }
}
