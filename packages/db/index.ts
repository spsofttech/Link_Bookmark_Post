import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export { db, pool } from "./drizzle";
export type { DB } from "./drizzle";
export * as schema from "./schema";
export * from "./supabase";

export class SqliteError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

export type KarakeepDBTransaction = PgTransaction<
  PgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
