import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { closeDb, ensureDb, isPostgres, query } from './db.js';
import { flag } from './util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storeFile = path.join(__dirname, '..', 'data', 'store.json');

const TABLES = {
  countries: 'countries',
  cities: 'cities',
  districts: 'districts',
  users: 'users',
  kitchens: 'kitchens',
  dishes: 'dishes',
  orders: 'orders',
  orderItems: 'order_items',
  tickets: 'tickets',
};

const BOOL_KEYS = [
  'isSupport',
  'blocked',
  'deliveryPickup',
  'deliveryCourier',
  'hidden',
  'confirmCooksHere',
  'availableTomorrow',
];

function toSnake(key) {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function coerce(row) {
  const out = { ...row };
  for (const key of BOOL_KEYS) {
    if (key in out) out[key] = flag(out[key]);
  }
  return out;
}

async function upsert(table, row) {
  const clean = coerce(row);
  const keys = Object.keys(clean).filter((k) => clean[k] !== undefined);
  const cols = keys.map(toSnake);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map((k) => (clean[k] === undefined ? null : clean[k]));
  const updates = cols.filter((c) => c !== 'id').map((c) => `${c} = EXCLUDED.${c}`);
  await query(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
     ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}`,
    values,
  );
}

async function main() {
  await ensureDb();
  if (!isPostgres()) {
    console.error('Set DATABASE_URL before importing JSON into Postgres.');
    process.exit(1);
  }
  if (!fs.existsSync(storeFile)) {
    console.error(`No file at ${storeFile}`);
    process.exit(1);
  }
  const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
  const order = ['countries', 'cities', 'districts', 'users', 'kitchens', 'dishes', 'orders', 'orderItems', 'tickets'];
  let n = 0;
  for (const key of order) {
    const table = TABLES[key];
    const rows = Array.isArray(store[key]) ? store[key] : [];
    for (const row of rows) {
      await upsert(table, row);
      n += 1;
    }
    console.log(`${key}: ${rows.length}`);
  }
  console.log(`imported ${n} rows`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
