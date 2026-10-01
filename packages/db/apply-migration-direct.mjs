/**
 * apply-migration-direct.mjs
 * Uses Session Pooler (port 5432) which supports DDL statements unlike pgBouncer (port 6543)
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Use SESSION pooler on port 5432 (supports DDL, unlike transaction pooler on 6543)
const SESSION_POOLER_URL =
  "postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";

console.log("Connecting to Session Pooler (port 5432)...");
const client = new pg.Client({
  connectionString: SESSION_POOLER_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("✅ Connected!");

const sql = readFileSync(
  path.resolve(__dirname, "migration_missing_tables.sql"),
  "utf8",
);

// Run the entire file in one go (all statements in one command)
try {
  await client.query(sql);
  console.log("✅ Migration SQL executed successfully!");
} catch (e) {
  console.error("❌ Migration failed:", e.message);

  // Try running statement by statement for better error reporting
  console.log("\nTrying statement-by-statement...");
  const statements = sql
    .split(/;\s*(?=\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let passed = 0;
  let failed = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      passed++;
    } catch (e2) {
      console.error(`  ❌ ${stmt.slice(0, 80).trim()}`);
      console.error(`     Error: ${e2.message}`);
      failed++;
    }
  }
  console.log(`\n📊 Statement-by-statement: ${passed} ok, ${failed} failed`);
}

await client.end();

// Verify
console.log("\nVerifying tables in database...");
const verifyClient = new pg.Client({
  connectionString: SESSION_POOLER_URL,
  ssl: { rejectUnauthorized: false },
});
await verifyClient.connect();
const res = await verifyClient.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
);
const tables = res.rows.map((r) => r.tablename);
console.log("Tables in database:", tables);

const expected = [
  "account",
  "apiKey",
  "assets",
  "backups",
  "bookmarkAssets",
  "bookmarkLinks",
  "bookmarkLists",
  "bookmarkTags",
  "bookmarkTexts",
  "bookmarks",
  "bookmarksInLists",
  "chatMessages",
  "chatSessions",
  "config",
  "customPrompts",
  "highlights",
  "importSessionBookmarks",
  "importSessions",
  "importStagingBookmarks",
  "invites",
  "listCollaborators",
  "listInvitations",
  "passwordResetToken",
  "rssFeeds",
  "rssFeedImports",
  "ruleEngineActions",
  "ruleEngineRules",
  "session",
  "subscriptions",
  "tagsOnBookmarks",
  "user",
  "userReadingProgress",
  "verificationToken",
  "webhooks",
];

const missing = expected.filter((t) => !tables.includes(t));
if (missing.length === 0) {
  console.log("\n✅ ALL TABLES PRESENT — Schema is complete!");
} else {
  console.log("\n⚠ Still missing:", missing);
}

await verifyClient.end();
