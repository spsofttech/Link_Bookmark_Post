import { createClient, SupabaseClient } from "@supabase/supabase-js";
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

/** No-op sync since all data is stored directly in Supabase with no middleman */
export async function syncAllToSupabase(_sqlite?: unknown) {
  return { success: true, count: 0, reason: "Direct Supabase storage active" };
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
        if (["bookmarks", "bookmarkTags", "bookmarkLists"].includes(table)) {
          await client.from(table).delete().eq("userId", userId);
        } else {
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
