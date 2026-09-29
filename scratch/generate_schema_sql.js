const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('./packages/db/db.db');
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
const indices = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name").all();
const migrations = db.prepare("SELECT * FROM __drizzle_migrations ORDER BY id").all();

let sqlScript = "";

for (const t of tables) {
  if (t.sql) {
    sqlScript += t.sql + ";\n\n";
  }
}

for (const idx of indices) {
  if (idx.sql) {
    sqlScript += idx.sql + ";\n\n";
  }
}

for (const m of migrations) {
  sqlScript += `INSERT OR IGNORE INTO __drizzle_migrations (id, hash, created_at) VALUES (${m.id}, '${m.hash}', ${m.created_at});\n`;
}

console.log("Total SQL script length:", sqlScript.length, "bytes");

const tsContent = `// Auto-generated schema fallback to guarantee all tables exist in bundled environments (e.g. Vercel)
export const SCHEMA_SQL = ${JSON.stringify(sqlScript)};
`;

fs.writeFileSync('./packages/db/schema_sql.ts', tsContent);
console.log("Successfully wrote packages/db/schema_sql.ts!");
