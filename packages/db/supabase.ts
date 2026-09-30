import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Database from "better-sqlite3";
import serverConfig from "@karakeep/shared/config";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    serverConfig.supabase.url;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    serverConfig.supabase.serviceRoleKey ||
    serverConfig.supabase.anonKey;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
      });
      return supabaseClient;
    } catch {
      return null;
    }
  }

  return null;
}

async function chunkUpsert(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
) {
  const CHUNK_SIZE = 250;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await client.from(table).upsert(chunk);
    if (error) {
      console.error(`[Supabase Sync] Error upserting into ${table}:`, error);
    }
  }
}

export async function syncAllToSupabase(sqlite: InstanceType<typeof Database>) {
  const client = getSupabaseClient();
  if (!client) {
    console.log("[Supabase Sync] Supabase client not configured.");
    return { success: false, reason: "Supabase not configured" };
  }

  try {
    const users = sqlite.prepare('SELECT * FROM "user"').all() as Record<
      string,
      unknown
    >[];
    if (users.length > 0) await chunkUpsert(client, "user", users);

    const bookmarks = sqlite
      .prepare('SELECT * FROM "bookmarks"')
      .all() as Record<string, unknown>[];
    if (bookmarks.length > 0) await chunkUpsert(client, "bookmarks", bookmarks);

    const links = sqlite
      .prepare('SELECT * FROM "bookmarkLinks"')
      .all() as Record<string, unknown>[];
    if (links.length > 0) await chunkUpsert(client, "bookmarkLinks", links);

    const texts = sqlite
      .prepare('SELECT * FROM "bookmarkTexts"')
      .all() as Record<string, unknown>[];
    if (texts.length > 0) await chunkUpsert(client, "bookmarkTexts", texts);

    const tags = sqlite.prepare('SELECT * FROM "bookmarkTags"').all() as Record<
      string,
      unknown
    >[];
    if (tags.length > 0) await chunkUpsert(client, "bookmarkTags", tags);

    const tagsOnBk = sqlite
      .prepare('SELECT * FROM "tagsOnBookmarks"')
      .all() as Record<string, unknown>[];
    if (tagsOnBk.length > 0)
      await chunkUpsert(client, "tagsOnBookmarks", tagsOnBk);

    const lists = sqlite
      .prepare('SELECT * FROM "bookmarkLists"')
      .all() as Record<string, unknown>[];
    if (lists.length > 0) await chunkUpsert(client, "bookmarkLists", lists);

    const bkInLists = sqlite
      .prepare('SELECT * FROM "bookmarksInLists"')
      .all() as Record<string, unknown>[];
    if (bkInLists.length > 0)
      await chunkUpsert(client, "bookmarksInLists", bkInLists);

    console.log(
      `[Supabase Sync] Successfully synced ${bookmarks.length} bookmarks to Supabase.`,
    );
    return { success: true, count: bookmarks.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Supabase Sync] Failed to sync to Supabase:", err);
    return { success: false, error: message };
  }
}

export async function clearSupabaseData() {
  const client = getSupabaseClient();
  if (!client) return;

  const tables = [
    "bookmarksInLists",
    "tagsOnBookmarks",
    "bookmarkLinks",
    "bookmarkTexts",
    "bookmarkAssets",
    "bookmarkTags",
    "bookmarkLists",
    "bookmarks",
  ];

  for (const table of tables) {
    try {
      await client
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
    } catch {
      // Ignore table deletion errors
    }
  }
}
