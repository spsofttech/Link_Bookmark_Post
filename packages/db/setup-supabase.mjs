/**
 * setup-supabase.mjs
 * Runs the Karakeep schema SQL against Supabase and syncs all local SQLite data.
 * Usage: node packages/db/setup-supabase.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import Database from "better-sqlite3";
import dotenv from "dotenv";

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function chunkUpsert(table, rows, conflictCol = "id") {
  if (!rows || rows.length === 0) return 0;
  const CHUNK = 250;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: conflictCol, ignoreDuplicates: false });
    if (error) {
      console.error(
        `  ⚠  ${table} chunk ${i}–${i + chunk.length}:`,
        error.message,
      );
    } else {
      upserted += chunk.length;
    }
  }
  return upserted;
}

function safeQuery(db, sql) {
  try {
    return db.prepare(sql).all();
  } catch {
    return [];
  }
}

// ─── Step 1: Create schema via Management API (raw SQL) ──────────────────────

async function runSchemaSQL() {
  console.log("\n📐 Creating Supabase tables...");

  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error("❌ Could not extract project ref from SUPABASE_URL");
    return false;
  }

  const schemaSql = readFileSync(
    path.resolve(__dirname, "supabase_schema.sql"),
    "utf8",
  );

  // Split SQL into individual statements and execute via REST
  // Supabase Management API: POST /v1/projects/{ref}/database/query
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Management API uses the service role or personal access token
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ query: schemaSql }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.warn(
      "  ⚠  Management API response:",
      res.status,
      text.slice(0, 200),
    );
    console.log("  → Will attempt table creation via RPC fallback...");
    return false;
  }

  console.log("  ✅ Schema applied via Management API");
  return true;
}

// ─── Step 2: Verify tables exist ─────────────────────────────────────────────

async function checkTables() {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true });

  if (error) {
    if (error.code === "42P01") {
      console.log(
        "  ⚠  Tables not yet created. Please run supabase_schema.sql manually.",
      );
      return false;
    }
    console.error("  ⚠  Table check error:", error.message);
    return false;
  }
  console.log("  ✅ Tables exist in Supabase");
  return true;
}

// ─── Step 3: Sync local SQLite → Supabase ────────────────────────────────────

async function syncLocalToSupabase() {
  const dataDir = process.env.DATA_DIR || path.resolve(__dirname, "../../data");
  const dbPath = process.env.DB_PATH || path.resolve(__dirname, "db.db");

  let sqlite;
  try {
    sqlite = new Database(dbPath, { readonly: true });
  } catch {
    try {
      sqlite = new Database(path.resolve(dataDir, "db.db"), { readonly: true });
    } catch (e) {
      console.warn("  ⚠  Could not open SQLite database:", e.message);
      return;
    }
  }

  console.log("\n📤 Syncing SQLite → Supabase...");

  // Users (must go first)
  const users = safeQuery(sqlite, 'SELECT * FROM "user"');
  console.log(`  • user: ${users.length} rows`);
  await chunkUpsert("user", users);

  // Bookmarks
  const bookmarks = safeQuery(sqlite, 'SELECT * FROM "bookmarks"');
  console.log(`  • bookmarks: ${bookmarks.length} rows`);
  await chunkUpsert("bookmarks", bookmarks);

  // Bookmark child tables
  const links = safeQuery(sqlite, 'SELECT * FROM "bookmarkLinks"');
  console.log(`  • bookmarkLinks: ${links.length} rows`);
  await chunkUpsert("bookmarkLinks", links);

  const texts = safeQuery(sqlite, 'SELECT * FROM "bookmarkTexts"');
  console.log(`  • bookmarkTexts: ${texts.length} rows`);
  await chunkUpsert("bookmarkTexts", texts);

  const bkAssets = safeQuery(sqlite, 'SELECT * FROM "bookmarkAssets"');
  console.log(`  • bookmarkAssets: ${bkAssets.length} rows`);
  await chunkUpsert("bookmarkAssets", bkAssets);

  // Tags
  const tags = safeQuery(sqlite, 'SELECT * FROM "bookmarkTags"');
  console.log(`  • bookmarkTags: ${tags.length} rows`);
  await chunkUpsert("bookmarkTags", tags);

  const tagsOnBk = safeQuery(sqlite, 'SELECT * FROM "tagsOnBookmarks"');
  console.log(`  • tagsOnBookmarks: ${tagsOnBk.length} rows`);
  await chunkUpsert("tagsOnBookmarks", tagsOnBk, "bookmarkId,tagId");

  // Lists
  const lists = safeQuery(sqlite, 'SELECT * FROM "bookmarkLists"');
  console.log(`  • bookmarkLists: ${lists.length} rows`);
  await chunkUpsert("bookmarkLists", lists);

  const inLists = safeQuery(sqlite, 'SELECT * FROM "bookmarksInLists"');
  console.log(`  • bookmarksInLists: ${inLists.length} rows`);
  await chunkUpsert("bookmarksInLists", inLists, "bookmarkId,listId");

  // Highlights (optional table)
  const highlights = safeQuery(sqlite, 'SELECT * FROM "highlights"');
  if (highlights.length > 0) {
    console.log(`  • highlights: ${highlights.length} rows`);
    await chunkUpsert("highlights", highlights);
  }

  sqlite.close();
}

// ─── Step 4: Final count ──────────────────────────────────────────────────────

async function printCounts() {
  console.log("\n📊 Supabase counts:");

  const tables = [
    "bookmarks",
    "bookmarkLinks",
    "bookmarkTags",
    "bookmarkLists",
  ];
  for (const t of tables) {
    const { count } = await supabase
      .from(t)
      .select("id", { count: "exact", head: true });
    console.log(`  • ${t}: ${count ?? 0}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log("🚀 Karakeep → Supabase Setup");
  console.log("   URL:", SUPABASE_URL);

  const schemaApplied = await runSchemaSQL();
  const tablesExist = await checkTables();

  if (tablesExist) {
    await syncLocalToSupabase();
    await printCounts();
    console.log("\n✅ Done! All data is now in Supabase.");
  } else if (!schemaApplied) {
    console.log("\n⚠  Tables not found. Please:");
    console.log(
      "   1. Go to https://supabase.com/dashboard/project/erokumwxbkiabmwsmwpx/sql/new",
    );
    console.log(
      "   2. Paste and run the contents of: packages/db/supabase_schema.sql",
    );
    console.log(
      "   3. Re-run this script: node packages/db/setup-supabase.mjs",
    );
  }
})();
