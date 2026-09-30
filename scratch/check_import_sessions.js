import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve("data/db.db"));
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

let grandTotal = 0;
console.log("=== DETAILED TABLE ROW COUNTS ===");
for (const t of tables) {
  try {
    const cnt = db.prepare(`SELECT count(*) as cnt FROM "${t.name}"`).get().cnt;
    if (cnt > 0) {
      console.log(`Table '${t.name}': ${cnt} rows`);
      if (t.name !== "__drizzle_migrations" && t.name !== "user") {
        grandTotal += cnt;
      }
    }
  } catch (e) {
    // Ignore error
  }
}

console.log("\nGrand Total Data Rows (excluding system/user tables):", grandTotal);
db.close();
