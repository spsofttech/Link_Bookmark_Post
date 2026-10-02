const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  const users = await client.query('SELECT id, email, name FROM "user" LIMIT 10;');
  console.log('USERS:', users.rows);
  const count = await client.query('SELECT count(*) FROM bookmarks;');
  console.log('BOOKMARKS COUNT:', count.rows[0].count);
  const bm = await client.query('SELECT id, title, user_id FROM bookmarks LIMIT 5;');
  console.log('BOOKMARKS SAMPLE:', bm.rows);
  await client.end();
}

main().catch(console.error);
