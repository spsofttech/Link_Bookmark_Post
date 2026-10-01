import pg from 'pg';

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'sa-east-1',
  'ca-central-1',
  'me-central-1',
  'af-south-1'
];

async function test() {
  console.log('Testing transaction pooler (6543)...');
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const pool = new pg.Pool({
      connectionString: `postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@${host}:6543/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000
    });
    try {
      const res = await pool.query('SELECT 1');
      console.log('\n=============================================');
      console.log('SUCCESS TRANSACTION POOLER (6543):', region);
      console.log(`postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@${host}:6543/postgres`);
      console.log('=============================================\n');
      await pool.end();
      return;
    } catch (e) {
      if (e.message.includes('tenant/user') && e.message.includes('not found')) {
        // wrong region
      } else {
        console.log(`Region ${region} (6543) error:`, e.message);
      }
      await pool.end();
    }
  }

  console.log('Testing session pooler (5432)...');
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const pool = new pg.Pool({
      connectionString: `postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@${host}:5432/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000
    });
    try {
      const res = await pool.query('SELECT 1');
      console.log('\n=============================================');
      console.log('SUCCESS SESSION POOLER (5432):', region);
      console.log(`postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@${host}:5432/postgres`);
      console.log('=============================================\n');
      await pool.end();
      return;
    } catch (e) {
      if (e.message.includes('tenant/user') && e.message.includes('not found')) {
        // wrong region
      } else {
        console.log(`Region ${region} (5432) error:`, e.message);
      }
      await pool.end();
    }
  }

  // Also test postgresql://postgres:SidGajera07*@db.erokumwxbkiabmwsmwpx.supabase.co:6543/postgres
  console.log('Testing direct host on pooler port 6543...');
  try {
    const pool = new pg.Pool({
      connectionString: `postgresql://postgres.erokumwxbkiabmwsmwpx:SidGajera07*@db.erokumwxbkiabmwsmwpx.supabase.co:6543/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    await pool.query('SELECT 1');
    console.log('SUCCESS DIRECT POOLER 6543');
    await pool.end();
  } catch (e) {
    console.log('Direct pooler 6543 error:', e.message);
  }
}

test();
