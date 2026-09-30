import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve("data/db.db"));

console.log("tagsOnBookmarks info:", db.pragma("table_info(tagsOnBookmarks)"));
console.log("bookmarksInLists info:", db.pragma("table_info(bookmarksInLists)"));
console.log("bookmarkLinks info:", db.pragma("table_info(bookmarkLinks)"));
console.log("bookmarkTexts info:", db.pragma("table_info(bookmarkTexts)"));

db.close();
