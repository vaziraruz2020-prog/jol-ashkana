import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { CIS_GEO } from './geo-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const storeFile = path.join(dataDir, 'store.json');

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

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS countries (
    id TEXT PRIMARY KEY,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    currency TEXT NOT NULL,
    currency_label_ru TEXT NOT NULL,
    currency_label_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    country_id TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    locale TEXT DEFAULT 'ru',
    country_id TEXT,
    city_id TEXT,
    district_id TEXT,
    active_role TEXT NOT NULL DEFAULT 'buyer',
    is_support INTEGER NOT NULL DEFAULT 0,
    blocked INTEGER NOT NULL DEFAULT 0,
    blocked_reason TEXT DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS kitchens (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    owner_full_name TEXT NOT NULL DEFAULT '',
    bio TEXT DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    country_id TEXT NOT NULL,
    city_id TEXT NOT NULL,
    district_id TEXT NOT NULL,
    cutoff_hour INTEGER NOT NULL DEFAULT 18,
    delivery_pickup INTEGER NOT NULL DEFAULT 1,
    delivery_courier INTEGER NOT NULL DEFAULT 1,
    emoji TEXT DEFAULT '🍞',
    accent TEXT DEFAULT '#E85D04',
    verification_status TEXT NOT NULL DEFAULT 'pending',
    verification_note TEXT DEFAULT '',
    hidden INTEGER NOT NULL DEFAULT 0,
    confirm_cooks_here INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS dishes (
    id TEXT PRIMARY KEY,
    kitchen_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT '',
    price INTEGER NOT NULL,
    unit TEXT DEFAULT 'шт',
    ingredients TEXT DEFAULT '',
    leftover INTEGER NOT NULL DEFAULT 20,
    available_tomorrow INTEGER NOT NULL DEFAULT 1,
    emoji TEXT DEFAULT '🍽',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    buyer_user_id TEXT NOT NULL,
    kitchen_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    delivery_type TEXT NOT NULL,
    slot TEXT NOT NULL,
    address TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    pay_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'accepted',
    for_date TEXT NOT NULL,
    total INTEGER NOT NULL,
    currency TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    dish_id TEXT NOT NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    author_user_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
  )`,
];

let mem = null;
let pgSql = null;
let ready = false;

function emptyStore() {
  return {
    countries: [],
    cities: [],
    districts: [],
    users: [],
    kitchens: [],
    dishes: [],
    orders: [],
    orderItems: [],
    tickets: [],
  };
}

function toSnake(key) {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function toCamel(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

function loadMem() {
  if (mem) return mem;
  try {
    mem = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
  } catch {
    mem = emptyStore();
  }
  for (const key of Object.keys(emptyStore())) {
    if (!Array.isArray(mem[key])) mem[key] = [];
  }
  return mem;
}

function saveMem() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(storeFile, JSON.stringify(mem, null, 2));
  } catch {
    /* Vercel /tmp or read-only — keep memory */
  }
}

async function pgQuery(text, params = []) {
  const rows = await pgSql(text, params);
  return Array.isArray(rows) ? rows.map(toCamel) : [];
}

export async function ensureDb() {
  if (ready) return;
  if (process.env.DATABASE_URL) {
    const { neon } = await import('@neondatabase/serverless');
    pgSql = neon(process.env.DATABASE_URL);
    for (const stmt of SCHEMA) {
      await pgSql(stmt, []);
    }
  } else {
    loadMem();
  }
  ready = true;
  await seedGeo();
  await seedAdmin();
}

async function seedGeo() {
  const existing = await list('countries');
  if (existing.length) return;
  for (const c of CIS_GEO.countries) await insert('countries', c);
  for (const c of CIS_GEO.cities) await insert('cities', c);
  for (const d of CIS_GEO.districts) await insert('districts', d);
}

async function seedAdmin() {
  const email = String(process.env.ADMIN_EMAIL || 'support@jol-ashkana.local').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'Support2025!';
  const found = await findOne('users', (u) => u.email === email);
  if (found) {
    if (!Number(found.isSupport)) await update('users', found.id, { isSupport: 1 });
    return;
  }
  await insert('users', {
    id: 'user_support',
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    name: 'Support',
    phone: '',
    locale: 'ru',
    countryId: 'uz',
    cityId: 'tashkent',
    districtId: 'yunusabad',
    activeRole: 'buyer',
    isSupport: 1,
    blocked: 0,
    blockedReason: '',
    createdAt: new Date().toISOString(),
  });
}

export async function list(collection, pred) {
  await ensureDb();
  if (pgSql) {
    const table = TABLES[collection];
    const rows = await pgQuery(`SELECT * FROM ${table}`, []);
    return pred ? rows.filter(pred) : rows;
  }
  const rows = loadMem()[collection] || [];
  return pred ? rows.filter(pred) : [...rows];
}

export async function findOne(collection, pred) {
  const rows = await list(collection, pred);
  return rows[0] || null;
}

export async function findById(collection, id) {
  if (!id) return null;
  if (pgSql) {
    const table = TABLES[collection];
    const rows = await pgQuery(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return rows[0] || null;
  }
  return (loadMem()[collection] || []).find((r) => r.id === id) || null;
}

export async function insert(collection, row) {
  await ensureDb();
  if (pgSql) {
    const table = TABLES[collection];
    const keys = Object.keys(row);
    const cols = keys.map(toSnake).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map((k) => row[k] ?? null);
    await pgQuery(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values);
    return row;
  }
  const s = loadMem();
  s[collection].push(row);
  saveMem();
  return row;
}

export async function update(collection, id, patch) {
  await ensureDb();
  if (pgSql) {
    const table = TABLES[collection];
    const keys = Object.keys(patch);
    if (!keys.length) return findById(collection, id);
    const set = keys.map((k, i) => `${toSnake(k)} = $${i + 1}`).join(', ');
    const values = keys.map((k) => patch[k] ?? null);
    values.push(id);
    await pgQuery(`UPDATE ${table} SET ${set} WHERE id = $${keys.length + 1}`, values);
    return findById(collection, id);
  }
  const s = loadMem();
  const idx = s[collection].findIndex((r) => r.id === id);
  if (idx < 0) return null;
  s[collection][idx] = { ...s[collection][idx], ...patch };
  saveMem();
  return s[collection][idx];
}

export function flag(v) {
  return v === true || v === 1 || v === '1';
}
