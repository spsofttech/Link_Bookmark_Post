const { sqlite, getSupabaseClient, isSupabaseSyncEnabled } = require('./packages/db');

async function check() {
  const localCount = sqlite.prepare('SELECT count(*) as count FROM bookmarks').get();
  console.log('Local SQLite Bookmarks Count:', localCount.count);

  const enabled = isSupabaseSyncEnabled();
  console.log('Supabase Sync Enabled:', enabled);

  const client = getSupabaseClient();
  if (!client) {
    console.log('Supabase Client: Not configured (missing SUPABASE_URL / SUPABASE_KEY in .env)');
    return;
  }

  try {
    const { count, error } = await client.from('bookmarks').select('*', { count: 'exact', head: true });
    if (error) {
      console.log('Supabase query error:', error.message);
    } else {
      console.log('Supabase Remote Bookmarks Count:', count);
    }
  } catch (err) {
    console.log('Supabase fetch exception:', err.message);
  }
}

check();
