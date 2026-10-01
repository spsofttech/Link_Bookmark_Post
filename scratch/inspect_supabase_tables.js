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
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log("=== TABLES IN SUPABASE PUBLIC SCHEMA ===");
  for (const row of res.rows) {
    const t = row.table_name;
    const countRes = await pool.query(`SELECT count(*) FROM "${t}"`);
    console.log(`Table: "${t}" -> ${countRes.rows[0].count} rows`);
  }

  await pool.end();
}

inspect().catch(console.error);
