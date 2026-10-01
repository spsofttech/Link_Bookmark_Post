/**
 * Legacy SQLite module - replaced by direct Supabase PostgreSQL connection
 */
export function openSqliteDatabase(_filename: string, _options?: unknown) {
  console.log("[DB] Using direct Supabase PostgreSQL database.");
  return null as unknown;
}
