import Database from "better-sqlite3";
import path from "path";
import { syncAllToSupabase } from "../packages/db/supabase.ts";

const dbPath = path.resolve("data/db.db");
console.log("=== PUSHING ALL IMPORTED DATA TO SUPABASE ===");
console.log("Reading DB from:", dbPath);

const db = new Database(dbPath);
const bookmarksCount = db.prepare("SELECT COUNT(*) as cnt FROM bookmarks").get().cnt;
const tagsCount = db.prepare("SELECT COUNT(*) as cnt FROM bookmarkTags").get().cnt;

console.log(`Found ${bookmarksCount} bookmarks and ${tagsCount} tags in local database.`);

async function main() {
  const result = await syncAllToSupabase(db);
  console.log("Supabase sync result:", result);
  db.close();
}

main();
