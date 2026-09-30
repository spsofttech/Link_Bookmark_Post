import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const candidateFiles = [
  path.resolve("data/db.db"),
  path.resolve("apps/web/public/db.db"),
  path.resolve("apps/web/db.db"),
  path.resolve("packages/db/db.db"),
  "C:/tmp/data/db.db",
  path.resolve(process.env.LOCALAPPDATA || "", "Temp/data/db.db"),
  path.resolve(process.env.TEMP || "", "data/db.db"),
];

console.log("=== CHECKING ALL DB FILES ===");
for (const p of candidateFiles) {
  if (fs.existsSync(p)) {
    try {
      const db = new Database(p);
      const bCnt = db.prepare("SELECT COUNT(*) as cnt FROM bookmarks").get().cnt;
      const tCnt = db.prepare("SELECT COUNT(*) as cnt FROM bookmarkTags").get().cnt;
      console.log(`DB File '${p}' (size ${fs.statSync(p).size} bytes): ${bCnt} bookmarks, ${tCnt} tags.`);
      db.close();
    } catch (e) {
      console.log(`DB File '${p}': error ${e.message}`);
    }
  } else {
    console.log(`DB File '${p}': NOT FOUND`);
  }
}
