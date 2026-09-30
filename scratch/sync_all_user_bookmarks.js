import fs from "fs";
import Database from "better-sqlite3";

const dbPaths = ["data/db.db", "packages/db/db.db"];

for (const dbPath of dbPaths) {
  if (!fs.existsSync(dbPath)) continue;
  console.log(`Syncing bookmarks across all users in ${dbPath}...`);

  const db = new Database(dbPath);

  const primaryUserId = "cxzee7jvwun32h9bsndixm59"; // Siddharth Gajera
  const users = db.prepare('SELECT id, email FROM "user"').all();

  console.log("Registered users:", users);

  // Update all bookmarks owned by test user to belong to primary user
  try {
    db.prepare(
      'UPDATE OR IGNORE "bookmarks" SET userId = ? WHERE userId = \'ulpk43eemvbinl6b2nczpk7x\' OR userId = \'\'',
    ).run(primaryUserId);
  } catch {}

  try {
    db.prepare(
      'UPDATE OR IGNORE "bookmarkTags" SET userId = ? WHERE userId = \'ulpk43eemvbinl6b2nczpk7x\' OR userId = \'\'',
    ).run(primaryUserId);
  } catch {}

  try {
    db.prepare(
      'UPDATE OR IGNORE "bookmarkLists" SET userId = ? WHERE userId = \'ulpk43eemvbinl6b2nczpk7x\' OR userId = \'\'',
    ).run(primaryUserId);
  } catch {}

  // Duplicate for all users so any user logged in sees all 987 bookmarks
  const primaryBookmarks = db
    .prepare('SELECT * FROM "bookmarks" WHERE userId = ?')
    .all(primaryUserId);

  const primaryTags = db
    .prepare('SELECT * FROM "bookmarkTags" WHERE userId = ?')
    .all(primaryUserId);

  const primaryLists = db
    .prepare('SELECT * FROM "bookmarkLists" WHERE userId = ?')
    .all(primaryUserId);

  for (const user of users) {
    if (user.id === primaryUserId) continue;

    console.log(`Copying bookmarks to user ${user.email} (${user.id})...`);

    for (const tag of primaryTags) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO "bookmarkTags" (id, name, createdAt, userId)
          VALUES (?, ?, ?, ?)
        `).run(tag.id, tag.name, tag.createdAt, user.id);
      } catch {}
    }

    for (const list of primaryLists) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO "bookmarkLists" (id, name, icon, createdAt, userId, parentId, type, query, description, rssToken, public)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          list.id,
          list.name,
          list.icon,
          list.createdAt,
          user.id,
          list.parentId,
          list.type,
          list.query,
          list.description,
          list.rssToken,
          list.public,
        );
      } catch {}
    }

    for (const b of primaryBookmarks) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO "bookmarks" (
            id, createdAt, archived, favourited, userId, taggingStatus, note, title, type, summary, modifiedAt, summarizationStatus, source, embeddingStatus, lastSavedAt
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `).run(
          b.id,
          b.createdAt,
          b.archived,
          b.favourited,
          user.id,
          b.taggingStatus,
          b.note,
          b.title,
          b.type,
          b.summary,
          b.modifiedAt,
          b.summarizationStatus,
          b.source,
          b.embeddingStatus,
          b.lastSavedAt,
        );
      } catch {}
    }
  }

  const finalPrimaryCount = db
    .prepare('SELECT count(*) as count FROM "bookmarks" WHERE userId = ?')
    .get(primaryUserId).count;

  console.log(`Final bookmark count for Siddharth Gajera (${primaryUserId}): ${finalPrimaryCount}`);

  db.close();
}
