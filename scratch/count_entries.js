import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const candidates = [
  "data/db.db",
  "packages/db/db.db",
  "apps/web/data/db.db",
  "sqlite.db",
];

function findDbFiles(dir) {
  const results = [];
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) {
        if (
          !f.name.startsWith(".") &&
          f.name !== "node_modules" &&
          f.name !== "dist" &&
          f.name !== ".next"
        ) {
          results.push(...findDbFiles(full));
        }
      } else if (f.name.endsWith(".db")) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

const found = findDbFiles(".");

console.log("Found database files:", found);

for (const dbPath of found) {
  console.log(`\n========================================`);
  console.log(`DATABASE FILE: ${dbPath}`);
  console.log(`File Size: ${(fs.statSync(dbPath).size / 1024).toFixed(2)} KB`);
  console.log(`========================================`);

  try {
    const sqlite = new Database(dbPath, { readonly: true });
    const tables = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'",
      )
      .all();

    let totalEntries = 0;
    const tableCounts = [];

    for (const { name } of tables) {
      try {
        const countObj = sqlite.prepare(`SELECT count(*) as count FROM "${name}"`).get();
        const count = countObj ? countObj.count : 0;
        totalEntries += count;
        if (count > 0) {
          tableCounts.push({ name, count });
        }
      } catch (err) {
        // Table count query error
      }
    }

    console.log(`TOTAL ENTRIES: ${totalEntries}`);
    console.log(`----------------------------------------`);
    tableCounts.sort((a, b) => b.count - a.count);
    for (const { name, count } of tableCounts) {
      console.log(`  - ${name}: ${count} entries`);
    }
    sqlite.close();
  } catch (err) {
    console.error(`Error reading ${dbPath}:`, err.message);
  }
}
