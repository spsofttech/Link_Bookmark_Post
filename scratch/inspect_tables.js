import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve("data/db.db"));
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("All tables in db.db:", tables.map(t => t.name));

for (const t of tables) {
  try {
    const count = db.prepare(`SELECT count(*) as cnt FROM "${t.name}"`).get().cnt;
    console.log(`Table '${t.name}': ${count} rows`);
  } catch (e) {
    console.log(`Table '${t.name}': error ${e.message}`);
  }
}

db.close();
