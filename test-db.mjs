import pg from './backend/node_modules/.pnpm/pg@8.23.1/node_modules/pg/lib/index.js';
const { Client } = pg;

async function check() {
  const client = new Client({ connectionString: 'postgresql://brewlite:brewlite@localhost:5433/brewlite?schema=public' });
  await client.connect();
  const res = await client.query('SELECT id, name, stock, version FROM "Product" WHERE id = $1', ['prod-espresso']);
  console.log('Product in DB:', res.rows[0]);
  await client.end();
}

check().catch(console.error);
