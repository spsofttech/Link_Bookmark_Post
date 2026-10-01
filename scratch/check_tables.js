import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const res = await pool.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
);
console.log('Tables in public schema:', res.rows.map(x => x.tablename).sort());
await pool.end();
