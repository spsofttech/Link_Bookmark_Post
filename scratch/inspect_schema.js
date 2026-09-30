import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve("data/db.db"));
const info = db.pragma("table_info(bookmarks)");
console.log("Bookmarks table columns:", info.map(c => c.name));

const sample = db.prepare("SELECT * FROM bookmarks LIMIT 1").get();
console.log("Sample bookmark:", sample);

db.close();
