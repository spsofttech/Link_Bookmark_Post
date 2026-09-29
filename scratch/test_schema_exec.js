const Database = require('better-sqlite3');
const { SCHEMA_SQL } = require('../packages/db/schema_sql');

const mem = new Database(':memory:');
console.log('Tables before:', mem.prepare("SELECT count(1) as c FROM sqlite_master WHERE type='table'").get().c);

mem.exec(SCHEMA_SQL);
console.log('Tables after:', mem.prepare("SELECT count(1) as c FROM sqlite_master WHERE type='table'").get().c);
console.log('User table check:', mem.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user'").get());
console.log('Migrations count:', mem.prepare("SELECT count(1) as c FROM __drizzle_migrations").get().c);
