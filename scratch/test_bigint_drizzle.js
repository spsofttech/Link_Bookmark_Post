import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, bigint, boolean } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  title: text("title"),
  createdAt: bigint("lastSavedAt", { mode: "number" }).notNull(),
  archived: boolean("archived").notNull().default(false),
});

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool, { schema: { bookmarks } });

  const testId = "test_bm_" + Date.now();
  console.log("Inserting test bookmark into Supabase directly...");
  await db.insert(bookmarks).values({
    id: testId,
    userId: "ulpk43eemvbinl6b2nczpk7x",
    type: "text",
    title: "Test Bookmark Direct Supabase",
    createdAt: Date.now(),
    archived: false,
  });
  console.log("Inserted!");

  console.log("Reading test bookmark back from Supabase...");
  const fetched = await db.select().from(bookmarks).where(eq(bookmarks.id, testId));
  console.log("Fetched bookmark from Supabase:", fetched);

  console.log("Deleting test bookmark...");
  await db.delete(bookmarks).where(eq(bookmarks.id, testId));
  console.log("Deleted!");

  await pool.end();
}

main().catch(console.error);
