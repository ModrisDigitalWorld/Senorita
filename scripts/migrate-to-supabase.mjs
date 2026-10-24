import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pg = require('/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js');
const { Pool } = pg;

const src = new Pool({ connectionString: process.env.DATABASE_URL });
const dst = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// JSONB columns that need explicit stringification per table
const JSON_COLS = {
  products: ['images', 'tags'],
  orders: ['shipping_address'],
  order_items: ['variant_info'],
};

// Order matters — respect foreign key constraints
const TABLES = [
  'users',
  'categories',
  'coupons',
  'banners',
  'products',
  'product_variants',
  'addresses',
  'orders',
  'order_items',
  'cart_items',
  'wishlist_items',
  'reviews',
];

async function migrateTable(table) {
  const { rows } = await src.query(`SELECT * FROM "${table}"`);
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows — skipped`);
    return;
  }

  const jsonCols = JSON_COLS[table] || [];
  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const vals = cols.map(c => {
      const v = row[c];
      if (jsonCols.includes(c) && v !== null && typeof v === 'object') {
        return JSON.stringify(v);
      }
      return v;
    });
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    try {
      await dst.query(
        `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        vals
      );
      inserted++;
    } catch (e) {
      console.warn(`    ⚠ row skipped in ${table}: ${e.message.split('\n')[0]}`);
      skipped++;
    }
  }

  console.log(`  ${table}: ${inserted} inserted, ${skipped} skipped  (total ${rows.length})`);
}

async function run() {
  console.log('Starting migration: Replit DB → Supabase\n');
  try {
    for (const table of TABLES) {
      await migrateTable(table);
    }
    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await src.end();
    await dst.end();
  }
}

run();
