import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function clearDatabase(dbPath) {
  console.log(`\n--- Clearing DB: ${dbPath} ---`);
  if (!fs.existsSync(dbPath)) {
    console.log("File does not exist, skipping.");
    return;
  }

  const db = new Database(dbPath);

  db.transaction(() => {
    // Delete data entries from content tables
    db.prepare("DELETE FROM tagsOnBookmarks").run();
    db.prepare("DELETE FROM bookmarksInLists").run();
    db.prepare("DELETE FROM bookmarkLinks").run();
    db.prepare("DELETE FROM bookmarkTexts").run();
    db.prepare("DELETE FROM bookmarkAssets").run();
    db.prepare("DELETE FROM bookmarks").run();
    db.prepare("DELETE FROM bookmarkTags").run();
    db.prepare("DELETE FROM bookmarkLists").run();
    db.prepare("DELETE FROM importSessionBookmarks").run();
    db.prepare("DELETE FROM importStagingBookmarks").run();
    db.prepare("DELETE FROM importSessions").run();
    db.prepare("DELETE FROM userReadingProgress").run();
    db.prepare("DELETE FROM highlights").run();
    db.prepare("DELETE FROM chatMessages").run();
    db.prepare("DELETE FROM chatSessions").run();
  })();

  const bookmarksCount = db.prepare("SELECT COUNT(*) as cnt FROM bookmarks").get().cnt;
  const tagsCount = db.prepare("SELECT COUNT(*) as cnt FROM bookmarkTags").get().cnt;
  const userCount = db.prepare("SELECT COUNT(*) as cnt FROM user").get().cnt;

  console.log(`Cleared ${dbPath}:`);
  console.log(`- Bookmarks remaining: ${bookmarksCount}`);
  console.log(`- Tags remaining: ${tagsCount}`);
  console.log(`- Users preserved: ${userCount}`);

  db.close();
}

const dbFiles = [
  path.resolve("data/db.db"),
  path.resolve("apps/web/public/db.db"),
  path.resolve("apps/web/db.db"),
  path.resolve("packages/db/db.db"),
];

for (const f of dbFiles) {
  clearDatabase(f);
}
