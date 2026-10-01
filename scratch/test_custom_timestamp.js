import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { customType, pgTable, text } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pgTimestampMs = customType({
  dataType() {
    return "bigint";
  },
  toDriver(value) {
    if (value instanceof Date) {
      return value.getTime().toString();
    }
    return Math.floor(value).toString();
  },
  fromDriver(value) {
    return new Date(Number(value));
  },
});

const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  createdAt: pgTimestampMs("lastSavedAt").notNull().$defaultFn(() => new Date()),
});

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool);

  const testId = "test_custom_ts_" + Date.now();
  console.log("Inserting test bookmark with custom timestamp (JS Date)...");
  await db.insert(bookmarks).values({
    id: testId,
    userId: "ulpk43eemvbinl6b2nczpk7x",
    type: "text",
    createdAt: new Date(),
  });
  console.log("Inserted!");

  const fetched = await db.select().from(bookmarks).where(eq(bookmarks.id, testId));
  console.log("Fetched:", fetched[0]);
  console.log("Is createdAt a Date?", fetched[0].createdAt instanceof Date, "Value:", fetched[0].createdAt);

  await db.delete(bookmarks).where(eq(bookmarks.id, testId));
  console.log("Deleted!");

  await pool.end();
}

main().catch(console.error);
