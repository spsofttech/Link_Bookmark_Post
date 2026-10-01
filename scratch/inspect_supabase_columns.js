import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function inspect() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const res = await pool.query(`
    SELECT table_name, column_name, data_type, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  `);

  console.log("=== COLUMNS IN SUPABASE PUBLIC SCHEMA ===");
  const tables = {};
  for (const row of res.rows) {
    if (!tables[row.table_name]) tables[row.table_name] = [];
    tables[row.table_name].push(`${row.column_name}: ${row.data_type}`);
  }
  
  for (const [t, cols] of Object.entries(tables)) {
    console.log(`\nTable "${t}":`);
    console.log("  " + cols.join(", "));
  }

  await pool.end();
}

inspect().catch(console.error);
