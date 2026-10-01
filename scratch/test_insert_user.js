import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

// Try inserting a test user to see the exact error
try {
  const res = await pool.query(`
    INSERT INTO "user" (id, name, email, password, salt, role)
    VALUES ('test-id-999', 'Test User', 'test999@example.com', null, '', 'user')
    RETURNING id, name, email
  `);
  console.log('Insert succeeded:', res.rows[0]);
  // Clean up
  await pool.query('DELETE FROM "user" WHERE id = $1', ['test-id-999']);
  console.log('Cleanup done');
} catch (e) {
  console.error('Insert error:', e.message);
  console.error('Error code:', e.code);
  console.error('Error detail:', e.detail);
}

await pool.end();
