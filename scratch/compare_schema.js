import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const res = await pool.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
);
const existingTables = new Set(res.rows.map(x => x.tablename).sort());
console.log('Tables in DB:', [...existingTables].sort());

// Expected tables from schema
const expectedTables = [
  'account', 'apiKey', 'assets', 'backups', 'bookmarkAssets', 'bookmarkLinks',
  'bookmarkLists', 'bookmarkTags', 'bookmarkTexts', 'bookmarks', 'bookmarksInLists',
  'chatMessages', 'chatSessions', 'config', 'customPrompts', 'highlights',
  'importSessionBookmarks', 'importSessions', 'importStagingBookmarks', 'invites',
  'listCollaborators', 'listInvitations', 'passwordResetToken', 'rssFeeds',
  'rssFeedImports', 'ruleEngineActions', 'ruleEngineRules', 'session',
  'subscriptions', 'tagsOnBookmarks', 'user', 'userReadingProgress',
  'verificationToken', 'webhooks'
];

const missing = expectedTables.filter(t => !existingTables.has(t));
console.log('\nMissing tables:', missing);
console.log('\nExtra tables:', [...existingTables].filter(t => !expectedTables.includes(t)));

await pool.end();
