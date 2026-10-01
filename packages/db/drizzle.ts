import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import serverConfig from "@karakeep/shared/config";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  serverConfig.supabase?.databaseUrl ||
  "postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres";

export const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

export function getInMemoryDB() {
  return db;
}
