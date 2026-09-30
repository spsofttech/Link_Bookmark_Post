/**
 * run-schema.mjs
 * Connects directly to Supabase Postgres and runs the schema SQL.
 * Then syncs all existing SQLite data to Supabase.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import Database from "better-sqlite3";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DB_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!DB_URL) {
  console.error("❌ SUPABASE_DATABASE_URL not set in .env");
  process.exit(1);
}

// ─── Step 1: Run schema via direct Postgres connection ───────────────────────

async function createSchema() {
  console.log("\n📐 Connecting to Supabase Postgres...");
  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("  ✅ Connected!");

    const sql = readFileSync(
      path.resolve(__dirname, "supabase_schema.sql"),
      "utf8",
    );

    console.log("  → Running schema SQL...");
    await client.query(sql);
    console.log("  ✅ All tables created successfully!");
    return true;
  } catch (err) {
    console.error("  ❌ Schema error:", err.message);
    return false;
  } finally {
    await client.end();
  }
}

// ─── Step 2: Sync SQLite → Supabase via JS client ───────────────────────────

async function syncData() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("⚠  No Supabase JS client credentials — skipping JS sync");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // Find SQLite database
  const candidates = [
    path.resolve(__dirname, "db.db"),
    path.resolve(
      process.env.DATA_DIR || path.resolve(__dirname, "../../data"),
      "db.db",
    ),
    path.resolve(__dirname, "../../data/db.db"),
  ];

  let sqlite = null;
  for (const p of candidates) {
    try {
      sqlite = new Database(p, { readonly: true });
      console.log("\n📦 Opened SQLite database:", p);
      break;
    } catch {
      // try next
    }
  }

  if (!sqlite) {
    console.warn("⚠  Could not find SQLite database — skipping sync");
    return;
  }

  async function upsert(table, rows, conflict = "id") {
    if (!rows?.length) return;
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from(table)
        .upsert(chunk, { onConflict: conflict, ignoreDuplicates: false });
      if (error) console.error(`  ⚠  ${table}:`, error.message);
    }
  }

  function q(sql) {
    try {
      return sqlite.prepare(sql).all();
    } catch {
      return [];
    }
  }

  console.log("\n📤 Syncing SQLite → Supabase...");

  const users = q(
    'SELECT id,name,email,role,password,salt,"emailVerified",image,"bookmarkQuota","storageQuota","browserCrawlingEnabled","bookmarkClickAction","archiveDisplayBehaviour",timezone,"backupsEnabled","backupsFrequency","backupsRetentionDays","readerFontSize","readerLineHeight","readerFontFamily","autoTaggingEnabled","autoSummarizationEnabled","tagStyle","curatedTagIds","inferredTagLang" FROM "user"',
  );
  console.log(`  • user: ${users.length} rows`);
  await upsert("user", users);

  const bookmarks = q('SELECT * FROM "bookmarks"');
  console.log(`  • bookmarks: ${bookmarks.length} rows`);
  await upsert("bookmarks", bookmarks);

  const links = q('SELECT * FROM "bookmarkLinks"');
  console.log(`  • bookmarkLinks: ${links.length} rows`);
  await upsert("bookmarkLinks", links);

  const texts = q('SELECT * FROM "bookmarkTexts"');
  console.log(`  • bookmarkTexts: ${texts.length} rows`);
  await upsert("bookmarkTexts", texts);

  const bkAssets = q('SELECT * FROM "bookmarkAssets"');
  console.log(`  • bookmarkAssets: ${bkAssets.length} rows`);
  await upsert("bookmarkAssets", bkAssets);

  const tags = q('SELECT id,name,"createdAt","userId" FROM "bookmarkTags"');
  console.log(`  • bookmarkTags: ${tags.length} rows`);
  await upsert("bookmarkTags", tags);

  const tagsOnBk = q(
    'SELECT "bookmarkId","tagId","attachedAt","attachedBy" FROM "tagsOnBookmarks"',
  );
  console.log(`  • tagsOnBookmarks: ${tagsOnBk.length} rows`);
  await upsert("tagsOnBookmarks", tagsOnBk, "bookmarkId,tagId");

  const lists = q('SELECT * FROM "bookmarkLists"');
  console.log(`  • bookmarkLists: ${lists.length} rows`);
  await upsert("bookmarkLists", lists);

  const inLists = q(
    'SELECT "bookmarkId","listId","addedAt" FROM "bookmarksInLists"',
  );
  console.log(`  • bookmarksInLists: ${inLists.length} rows`);
  await upsert("bookmarksInLists", inLists, "bookmarkId,listId");

  sqlite.close();
}

// ─── Step 3: Count verification ──────────────────────────────────────────────

async function verifyCounts() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  console.log("\n📊 Final Supabase counts:");
  for (const t of [
    "bookmarks",
    "bookmarkLinks",
    "bookmarkTags",
    "bookmarkLists",
  ]) {
    const { count } = await supabase
      .from(t)
      .select("id", { count: "exact", head: true });
    console.log(`  • ${t}: ${count ?? 0}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log("🚀 Karakeep Supabase Setup");
  console.log("   DB :", DB_URL?.replace(/:([^:@]+)@/, ":***@"));

  const ok = await createSchema();
  if (ok) {
    await syncData();
    await verifyCounts();
    console.log("\n✅ Supabase is ready! All data synced.");
  }
})();
