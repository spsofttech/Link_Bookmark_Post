const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT "userId", count(*) FROM bookmarks GROUP BY "userId";');
  console.log('BOOKMARKS PER USER:', res.rows);
  await client.end();
}

main().catch(console.error);
