import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("DATABASE_URL:", process.env.DATABASE_URL);

async function testSupabaseJs() {
  console.log("\n--- Testing @supabase/supabase-js ---");
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await client.from("user").select("*").limit(5);
  if (error) {
    console.error("Supabase JS Error:", error);
  } else {
    console.log("Supabase JS Users count:", data?.length, "Sample user:", data?.[0]?.email);
  }
}

async function testPg() {
  console.log("\n--- Testing pg (Direct Postgres to Supabase) ---");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const res = await pool.query('SELECT count(*) FROM "user"');
    console.log("PG Query success! User count in Supabase:", res.rows[0]);
  } catch (err) {
    console.error("PG Query Error:", err);
  } finally {
    await pool.end();
  }
}

async function main() {
  await testSupabaseJs();
  await testPg();
}

main();
