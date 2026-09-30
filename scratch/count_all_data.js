import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function getCounts(dbPath) {
  if (!fs.existsSync(dbPath)) return null;
  const db = new Database(dbPath);
  try {
    const bookmarks = db.prepare("SELECT COUNT(*) as cnt FROM bookmarks").get().cnt;
    const bookmarkLinks = db.prepare("SELECT COUNT(*) as cnt FROM bookmarkLinks").get().cnt;
    const bookmarkTags = db.prepare("SELECT COUNT(*) as cnt FROM bookmarkTags").get().cnt;
    const tagsOnBookmarks = db.prepare("SELECT COUNT(*) as cnt FROM tagsOnBookmarks").get().cnt;
    const bookmarksInLists = db.prepare("SELECT COUNT(*) as cnt FROM bookmarksInLists").get().cnt;
    const bookmarkLists = db.prepare("SELECT COUNT(*) as cnt FROM bookmarkLists").get().cnt;
    const users = db.prepare("SELECT COUNT(*) as cnt FROM user").get().cnt;

    db.close();
    return {
      bookmarks,
      bookmarkLinks,
      bookmarkTags,
      tagsOnBookmarks,
      bookmarksInLists,
      bookmarkLists,
      users,
      totalEntries: bookmarks + bookmarkLinks + bookmarkTags + tagsOnBookmarks + bookmarksInLists + bookmarkLists
    };
  } catch (e) {
    db.close();
    return { error: e.message };
  }
}

const dbFiles = {
  "data/db.db": path.resolve("data/db.db"),
  "apps/web/public/db.db": path.resolve("apps/web/public/db.db"),
  "apps/web/db.db": path.resolve("apps/web/db.db"),
  "packages/db/db.db": path.resolve("packages/db/db.db"),
};

console.log("=== TOTAL DATA COUNT SUMMARY ===");
for (const [name, p] of Object.entries(dbFiles)) {
  console.log(`\nPath: ${name}`);
  const counts = getCounts(p);
  console.table(counts);
}
