/**
 * apply-migration.mjs
 * Runs migration_missing_tables.sql against Supabase Postgres
 * to create all missing tables.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!DB_URL) {
  console.error("❌ No DATABASE_URL set in .env");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("✅ Connected to Supabase Postgres");

const sql = readFileSync(
  path.resolve(__dirname, "migration_missing_tables.sql"),
  "utf8",
);

// Split on statement boundaries to run them one by one so we see which fails
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

let passed = 0;
let failed = 0;

for (const stmt of statements) {
  try {
    await client.query(stmt);
    passed++;
  } catch (e) {
    console.error(
      `❌ FAILED:\n   ${stmt.slice(0, 100)}...\n   Error: ${e.message}`,
    );
    failed++;
  }
}

await client.end();

console.log(`\n📊 Migration complete: ${passed} succeeded, ${failed} failed`);

// Verify tables now
const verifyClient = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});
await verifyClient.connect();
const res = await verifyClient.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
);
console.log("\n✅ Tables now in database:");
console.log(res.rows.map((r) => r.tablename).join(", "));
await verifyClient.end();
