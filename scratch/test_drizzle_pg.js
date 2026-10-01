import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool, { schema: { userTable } });

  console.log("Fetching users from Supabase via Drizzle Node-Postgres...");
  const users = await db.select().from(userTable).limit(5);
  console.log("Users fetched:", users.length, users[0]);
  await pool.end();
}

main().catch(console.error);
