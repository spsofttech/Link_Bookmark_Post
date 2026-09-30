import Database from "better-sqlite3";

const db = new Database("data/db.db", { readonly: true });

console.log("=== USERS IN DATA/DB.DB ===");
const users = db.prepare('SELECT id, name, email, role FROM "user"').all();
console.log(users);

console.log("\n=== BOOKMARKS PER USER ===");
const bookmarkCounts = db
  .prepare(
    'SELECT userId, count(*) as count FROM "bookmarks" GROUP BY userId',
  )
  .all();
console.log(bookmarkCounts);

console.log("\n=== BOOKMARK LISTS PER USER ===");
const listCounts = db
  .prepare(
    'SELECT userId, count(*) as count FROM "bookmarkLists" GROUP BY userId',
  )
  .all();
console.log(listCounts);

console.log("\n=== BOOKMARK TAGS PER USER ===");
const tagCounts = db
  .prepare(
    'SELECT userId, count(*) as count FROM "bookmarkTags" GROUP BY userId',
  )
  .all();
console.log(tagCounts);

db.close();
