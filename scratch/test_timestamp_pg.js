import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, timestamp, bigint } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Test both timestamp column & bigint column
const testTable = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("lastSavedAt", { mode: "date" }),
});

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool, { schema: { testTable } });
  try {
    const res = await db.select().from(testTable).limit(1);
    console.log("Timestamp mode select result:", res);
  } catch (e) {
    console.error("Timestamp mode select error:", e.message);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
