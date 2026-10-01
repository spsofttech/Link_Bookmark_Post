import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

// Check actual columns of the user table
const res = await pool.query(`
  SELECT column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user'
  ORDER BY ordinal_position
`);
console.log('Columns in "user" table:');
res.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) default=${r.column_default} nullable=${r.is_nullable}`));

await pool.end();
