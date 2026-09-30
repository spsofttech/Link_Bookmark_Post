import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function deduplicateDatabase(dbPath) {
  console.log(`\n--- Processing DB: ${dbPath} ---`);
  if (!fs.existsSync(dbPath)) {
    console.log("File does not exist, skipping.");
    return;
  }

  const db = new Database(dbPath);

  const initialBookmarksCount = db.prepare("SELECT COUNT(*) as cnt FROM bookmarks").get().cnt;
  console.log(`Initial bookmarks count: ${initialBookmarksCount}`);

  // Find duplicates per user strictly by title (when title is non-empty)
  const duplicateBookmarkGroups = db.prepare(`
    SELECT userId, title, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
    FROM bookmarks
    WHERE title IS NOT NULL AND title != ''
    GROUP BY userId, title
    HAVING cnt > 1
  `).all();

  console.log(`Found ${duplicateBookmarkGroups.length} duplicate title groups.`);

  let deletedBookmarksCount = 0;

  db.transaction(() => {
    for (const group of duplicateBookmarkGroups) {
      const ids = group.ids.split(",");
      const keepId = ids[0]; // Keep the first ID
      const removeIds = ids.slice(1); // IDs to remove

      for (const removeId of removeIds) {
        // Re-map tagsOnBookmarks to keepId if not already existing
        const existingTags = db.prepare("SELECT tagId FROM tagsOnBookmarks WHERE bookmarkId = ?").all(keepId).map(r => r.tagId);
        const tagsToRemove = db.prepare("SELECT tagId FROM tagsOnBookmarks WHERE bookmarkId = ?").all(removeId);
        
        for (const { tagId } of tagsToRemove) {
          if (!existingTags.includes(tagId)) {
            try {
              db.prepare("UPDATE tagsOnBookmarks SET bookmarkId = ? WHERE bookmarkId = ? AND tagId = ?").run(keepId, removeId, tagId);
            } catch {
              // Ignore unique constraint
            }
          }
        }
        db.prepare("DELETE FROM tagsOnBookmarks WHERE bookmarkId = ?").run(removeId);

        // Re-map bookmarksInLists to keepId if not already existing
        const existingLists = db.prepare("SELECT listId FROM bookmarksInLists WHERE bookmarkId = ?").all(keepId).map(r => r.listId);
        const listsToRemove = db.prepare("SELECT listId FROM bookmarksInLists WHERE bookmarkId = ?").all(removeId);

        for (const { listId } of listsToRemove) {
          if (!existingLists.includes(listId)) {
            try {
              db.prepare("UPDATE bookmarksInLists SET bookmarkId = ? WHERE bookmarkId = ? AND listId = ?").run(keepId, removeId, listId);
            } catch {
              // Ignore unique constraint
            }
          }
        }
        db.prepare("DELETE FROM bookmarksInLists WHERE bookmarkId = ?").run(removeId);

        // Delete from bookmarkLinks, bookmarkTexts by id
        db.prepare("DELETE FROM bookmarkLinks WHERE id = ?").run(removeId);
        db.prepare("DELETE FROM bookmarkTexts WHERE id = ?").run(removeId);

        // Delete the duplicate bookmark
        db.prepare("DELETE FROM bookmarks WHERE id = ?").run(removeId);
        deletedBookmarksCount++;
      }
    }

    // Deduplicate bookmarkTags per user by (userId, name)
    const duplicateTagGroups = db.prepare(`
      SELECT userId, name, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
      FROM bookmarkTags
      GROUP BY userId, name
      HAVING cnt > 1
    `).all();

    let deletedTagsCount = 0;
    for (const group of duplicateTagGroups) {
      const ids = group.ids.split(",");
      const keepId = ids[0];
      const removeIds = ids.slice(1);

      for (const removeId of removeIds) {
        db.prepare("UPDATE OR IGNORE tagsOnBookmarks SET tagId = ? WHERE tagId = ?").run(keepId, removeId);
        db.prepare("DELETE FROM tagsOnBookmarks WHERE tagId = ?").run(removeId);
        db.prepare("DELETE FROM bookmarkTags WHERE id = ?").run(removeId);
        deletedTagsCount++;
      }
    }

    // Clean up orphaned records
    db.prepare("DELETE FROM bookmarkLinks WHERE id NOT IN (SELECT id FROM bookmarks)").run();
    db.prepare("DELETE FROM bookmarkTexts WHERE id NOT IN (SELECT id FROM bookmarks)").run();
    db.prepare("DELETE FROM tagsOnBookmarks WHERE bookmarkId NOT IN (SELECT id FROM bookmarks)").run();
    db.prepare("DELETE FROM bookmarksInLists WHERE bookmarkId NOT IN (SELECT id FROM bookmarks)").run();

    // Remove exact duplicate rows in junction tables
    db.prepare(`
      DELETE FROM tagsOnBookmarks
      WHERE rowid NOT IN (
        SELECT MIN(rowid)
        FROM tagsOnBookmarks
        GROUP BY bookmarkId, tagId
      )
    `).run();

    db.prepare(`
      DELETE FROM bookmarksInLists
      WHERE rowid NOT IN (
        SELECT MIN(rowid)
        FROM bookmarksInLists
        GROUP BY bookmarkId, listId
      )
    `).run();

    console.log(`Deleted ${deletedBookmarksCount} duplicate bookmarks.`);
    console.log(`Deleted ${deletedTagsCount} duplicate tags.`);
  })();

  const finalBookmarksCount = db.prepare("SELECT COUNT(*) as cnt FROM bookmarks").get().cnt;
  const finalTagsCount = db.prepare("SELECT COUNT(*) as cnt FROM bookmarkTags").get().cnt;
  const finalLinksCount = db.prepare("SELECT COUNT(*) as cnt FROM bookmarkLinks").get().cnt;

  console.log(`Final bookmark count for ${dbPath}: ${finalBookmarksCount}`);
  db.close();
}

const dbFiles = [
  path.resolve("data/db.db"),
  path.resolve("apps/web/public/db.db"),
  path.resolve("apps/web/db.db"),
  path.resolve("packages/db/db.db"),
];

for (const f of dbFiles) {
  deduplicateDatabase(f);
}
