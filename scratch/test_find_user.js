const { db } = require('./packages/db');

async function test() {
  try {
    const user = await db.query.users.findFirst();
    console.log('FIND FIRST USER:', user);
  } catch (err) {
    console.error('ERROR FIND FIRST USER:', err);
  }
}

test();
