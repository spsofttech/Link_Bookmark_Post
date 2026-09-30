import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Database from "better-sqlite3";
import serverConfig from "@karakeep/shared/config";

let supabaseClient: SupabaseClient | null = null;
let supabaseSyncEnabled = true;

export function isSupabaseSyncEnabled(): boolean {
  return supabaseSyncEnabled;
}

export function setSupabaseSyncEnabled(enabled: boolean): boolean {
  supabaseSyncEnabled = enabled;
  if (!enabled) {
    supabaseClient = null;
  }
  return supabaseSyncEnabled;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseSyncEnabled) return null;
  if (supabaseClient) return supabaseClient;

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    serverConfig.supabase?.url;

  // Support both old-style (anon key) and new-style (publishable key) formats
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    serverConfig.supabase?.serviceRoleKey ||
    serverConfig.supabase?.anonKey;

  if (!url || !key) {
    console.warn(
      "[Supabase] No URL or key configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    );
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    console.log("[Supabase] Client initialized successfully →", url);
    return supabaseClient;
  } catch (err) {
    console.error("[Supabase] Failed to create client:", err);
    return null;
  }
}

/** Upsert rows into a Supabase table in chunks of 250 */
async function chunkUpsert(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
) {
  const CHUNK_SIZE = 250;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await client.from(table).upsert(chunk, {
      onConflict: "id",
      ignoreDuplicates: false,
    });
    if (error) {
      console.error(`[Supabase] Error upserting into "${table}":`, error);
    }
  }
}

/** Sync everything from SQLite into Supabase */
export async function syncAllToSupabase(sqlite: InstanceType<typeof Database>) {
  if (!supabaseSyncEnabled) {
    return { success: false, reason: "Supabase sync is disabled" };
  }
  const client = getSupabaseClient();
  if (!client) {
    console.log("[Supabase] Client not configured — skipping sync.");
    return { success: false, reason: "Supabase not configured" };
  }

  try {
    // Sync users first (other tables reference user ids)
    const users = sqlite.prepare('SELECT * FROM "user"').all() as Record<
      string,
      unknown
    >[];
    if (users.length > 0) await chunkUpsert(client, "user", users);

    // Bookmarks
    const bookmarks = sqlite
      .prepare('SELECT * FROM "bookmarks"')
      .all() as Record<string, unknown>[];
    if (bookmarks.length > 0) await chunkUpsert(client, "bookmarks", bookmarks);

    // Bookmark child tables
    const links = sqlite
      .prepare('SELECT * FROM "bookmarkLinks"')
      .all() as Record<string, unknown>[];
    if (links.length > 0) await chunkUpsert(client, "bookmarkLinks", links);

    const texts = sqlite
      .prepare('SELECT * FROM "bookmarkTexts"')
      .all() as Record<string, unknown>[];
    if (texts.length > 0) await chunkUpsert(client, "bookmarkTexts", texts);

    const bookmarkAssets = sqlite
      .prepare('SELECT * FROM "bookmarkAssets"')
      .all() as Record<string, unknown>[];
    if (bookmarkAssets.length > 0)
      await chunkUpsert(client, "bookmarkAssets", bookmarkAssets);

    // Tags
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

    // Lists
    const lists = sqlite
      .prepare('SELECT * FROM "bookmarkLists"')
      .all() as Record<string, unknown>[];
    if (lists.length > 0) await chunkUpsert(client, "bookmarkLists", lists);

    const bkInLists = sqlite
      .prepare('SELECT * FROM "bookmarksInLists"')
      .all() as Record<string, unknown>[];
    if (bkInLists.length > 0)
      await chunkUpsert(client, "bookmarksInLists", bkInLists);

    // Highlights
    try {
      const highlights = sqlite
        .prepare('SELECT * FROM "highlights"')
        .all() as Record<string, unknown>[];
      if (highlights.length > 0)
        await chunkUpsert(client, "highlights", highlights);
    } catch {
      // Table might not exist yet
    }

    console.log(
      `[Supabase] Sync complete — ${bookmarks.length} bookmarks, ${tags.length} tags, ${lists.length} lists.`,
    );
    return { success: true, count: bookmarks.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Supabase] Sync failed:", err);
    return { success: false, error: message };
  }
}

/** Fetch all bookmarks for a user from Supabase */
export async function fetchBookmarksFromSupabase(
  userId: string,
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("bookmarks")
    .select("*")
    .eq("userId", userId)
    .order("lastSavedAt", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchBookmarks error:", error);
    return [];
  }
  return data ?? [];
}

/** Get bookmark count from Supabase for a user */
export async function getSupabaseBookmarkCount(
  userId?: string,
): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;

  let query = client.from("bookmarks").select("id", { count: "exact" });
  if (userId) query = query.eq("userId", userId);

  const { count, error } = await query;
  if (error) {
    console.error("[Supabase] count error:", error);
    return 0;
  }
  return count ?? 0;
}

/** Clear all bookmark/list data from Supabase for a user */
export async function clearSupabaseData(userId?: string) {
  const client = getSupabaseClient();
  if (!client) return;

  // Order matters due to FK constraints
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
      if (userId) {
        // For tables that have userId column
        if (["bookmarks", "bookmarkTags", "bookmarkLists"].includes(table)) {
          await client.from(table).delete().eq("userId", userId);
        } else {
          // For join tables, delete via cascade from bookmarks
          await client
            .from(table)
            .delete()
            .neq("bookmarkId", "00000000-0000-0000-0000-000000000000");
        }
      } else {
        await client
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
      }
    } catch {
      // Ignore errors for tables without matching columns
    }
  }

  console.log("[Supabase] Data cleared.");
}

/** Test Supabase connection and return status */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  url: string;
  bookmarkCount?: number;
  error?: string;
}> {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    serverConfig.supabase?.url ||
    "";

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      url,
      error: "No Supabase credentials configured",
    };
  }

  try {
    const { count, error } = await client
      .from("bookmarks")
      .select("id", { count: "exact", head: true });

    if (error) {
      return { connected: false, url, error: error.message };
    }

    return { connected: true, url, bookmarkCount: count ?? 0 };
  } catch (err) {
    return {
      connected: false,
      url,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
