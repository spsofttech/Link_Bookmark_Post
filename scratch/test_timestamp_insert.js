import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, timestamp, bigint } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const bookmarksBigint = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  createdAt: bigint("lastSavedAt", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool);

  const testId = "test_ts_" + Date.now();
  console.log("Testing insert with bigint mode (Date.now())...");
  await db.insert(bookmarksBigint).values({
    id: testId,
    userId: "ulpk43eemvbinl6b2nczpk7x",
    type: "text",
    createdAt: Date.now(),
  });
  console.log("Inserted!");

  const fetched = await db.select().from(bookmarksBigint).where(eq(bookmarksBigint.id, testId));
  console.log("Fetched:", fetched[0]);

  await db.delete(bookmarksBigint).where(eq(bookmarksBigint.id, testId));
  console.log("Deleted!");

  await pool.end();
}

main().catch(console.error);
