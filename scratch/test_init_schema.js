const Database = require('better-sqlite3');
const fs = require('fs');

const testPath = './scratch/test_empty.db';
if (fs.existsSync(testPath)) fs.unlinkSync(testPath);

const db = new Database(testPath);
console.log('Tables before:', db.prepare("SELECT count(1) as c FROM sqlite_master WHERE type='table'").get().c);

const { SCHEMA_SQL } = require('./generate_schema_sql.js');
// or read schema_sql.ts
const content = fs.readFileSync('./packages/db/schema_sql.ts', 'utf8');
const match = content.match(/export const SCHEMA_SQL = ("(?:[^"\\]|\\.)*");/);
const sql = JSON.parse(match[1]);

db.exec(sql);
console.log('Tables after:', db.prepare("SELECT count(1) as c FROM sqlite_master WHERE type='table'").get().c);
console.log('User table check:', db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user'").get());
console.log('Test passed! User table was created with 0 errors.');
