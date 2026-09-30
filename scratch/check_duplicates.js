import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve("data/db.db"));

console.log("=== USER ACCOUNTS ===");
const users = db.prepare("SELECT id, name, email FROM user").all();
console.table(users);

console.log("\n=== BOOKMARKS COUNT PER USER ===");
const bookmarkCounts = db.prepare("SELECT userId, count(*) as count FROM bookmarks GROUP BY userId").all();
console.table(bookmarkCounts);

console.log("\n=== DUPLICATE BOOKMARKS BY TITLE WITHIN SAME USER ===");
const userTitleDups = db.prepare(`
  SELECT userId, title, COUNT(*) as cnt 
  FROM bookmarks 
  WHERE title IS NOT NULL AND title != '' 
  GROUP BY userId, title 
  HAVING cnt > 1
`).all();
console.log("Total duplicate titles within same user:", userTitleDups.length);
if (userTitleDups.length > 0) {
  console.table(userTitleDups.slice(0, 10));
}

console.log("\n=== DUPLICATE BOOKMARKS ACROSS ALL USERS (SAME TITLE & SAME TYPE) ===");
const globalTitleDups = db.prepare(`
  SELECT title, type, COUNT(*) as cnt 
  FROM bookmarks 
  WHERE title IS NOT NULL AND title != '' 
  GROUP BY title, type 
  HAVING cnt > 1
`).all();
console.log("Total duplicate titles across all users:", globalTitleDups.length);
if (globalTitleDups.length > 0) {
  console.table(globalTitleDups.slice(0, 10));
}

console.log("\n=== DUPLICATE TAGS WITHIN SAME USER ===");
const tagDups = db.prepare(`
  SELECT userId, name, COUNT(*) as cnt 
  FROM tags 
  GROUP BY userId, name 
  HAVING cnt > 1
`).all();
console.log("Duplicate tags within same user:", tagDups.length);

console.log("\n=== DUPLICATE TAGS ON BOOKMARKS (_BookmarkToTag) ===");
try {
  const bookmarkTagDups = db.prepare(`
    SELECT A, B, COUNT(*) as cnt 
    FROM _BookmarkToTag 
    GROUP BY A, B 
    HAVING cnt > 1
  `).all();
  console.log("Duplicate _BookmarkToTag links:", bookmarkTagDups.length);
} catch (e) {
  console.log("Could not query _BookmarkToTag:", e.message);
}

db.close();
