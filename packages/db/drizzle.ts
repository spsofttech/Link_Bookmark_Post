import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import serverConfig from "@karakeep/shared/config";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  serverConfig.supabase?.url ||
  "postgresql://postgres:SidGajera07*@db.erokumwxbkiabmwsmwpx.supabase.co:5432/postgres";

export const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

export function getInMemoryDB() {
  return db;
}
