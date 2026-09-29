const Database = require('better-sqlite3');
const db = new Database('./packages/db/db.db');
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
console.log('Total tables in db.db:', tables.length);
console.log('Table names:', tables.map(t => t.name));
const indices = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").all();
console.log('Total indices:', indices.length);
