const Database = require("better-sqlite3");

const candidates = [
  "packages/db/db.db",
  "apps/web/db.db",
  "data/db.db",
];

let db = null;
let dbPath = null;
for (const p of candidates) {
  try {
    db = new Database(p, { readonly: true });
    dbPath = p;
    break;
  } catch {}
}

if (!db) {
  console.log("No SQLite DB found in any candidate path");
  process.exit(1);
}

console.log("Opened:", dbPath);

const tables = [
  "bookmarks",
  "bookmarkLinks",
  "bookmarkTexts",
  "bookmarkAssets",
  "bookmarkTags",
  "tagsOnBookmarks",
  "bookmarkLists",
  "bookmarksInLists",
];

console.log("\n=== Local SQLite Data Count ===");
for (const t of tables) {
  try {
    const row = db.prepare(`SELECT COUNT(*) as cnt FROM "${t}"`).get();
    console.log(`  ${t}: ${row.cnt}`);
  } catch (e) {
    console.log(`  ${t}: ERROR - ${e.message}`);
  }
}

// Also show last 5 bookmarks
try {
  const recent = db
    .prepare(
      `SELECT id, title, type, createdAt FROM "bookmarks" ORDER BY createdAt DESC LIMIT 5`,
    )
    .all();
  if (recent.length > 0) {
    console.log("\n=== Most Recent 5 Bookmarks ===");
    recent.forEach((b) => {
      console.log(`  [${b.type}] ${b.title || "(no title)"} — ${new Date(b.createdAt).toLocaleString()}`);
    });
  }
} catch {}

db.close();
