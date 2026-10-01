import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, integer, boolean, bigint, primaryKey } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  salt: text("salt").notNull().default(""),
  role: text("role").default("user"),
});

const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  title: text("title"),
});

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool, { schema: { users, bookmarks } });

  console.log("Testing Drizzle PG Select on Supabase 'user' table...");
  const userList = await db.select().from(users).limit(5);
  console.log("Users:", userList);

  console.log("Testing Drizzle PG Select on Supabase 'bookmarks' table...");
  const bmList = await db.select().from(bookmarks).limit(5);
  console.log("Bookmarks count:", bmList.length);

  await pool.end();
}

main().catch(console.error);
