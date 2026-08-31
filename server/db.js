import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { CIS_GEO } from './geo-data.js';
import { runMigrations } from './migrate.js';
import { flag } from './util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const storeFile = path.join(dataDir, 'store.json');

const COLLECTIONS = [
  'countries',
  'cities',
  'districts',
  'users',
  'kitchens',
  'dishes',
  'orders',
  'orderItems',
  'tickets',
  'orderEvents',
  'notifications',
  'auditLog',
];

const TABLE_FOR = {
  countries: 'countries',
  cities: 'cities',
  districts: 'districts',
  users: 'users',
  kitchens: 'kitchens',
  dishes: 'dishes',
  orders: 'orders',
  orderItems: 'order_items',
  tickets: 'tickets',
  orderEvents: 'order_events',
  notifications: 'notifications',
  auditLog: 'audit_log',
};

let mem = null;
let pool = null;
let neonSql = null;
let pglite = null;
let ready = false;
let mode = 'none';

function emptyStore() {
  const s = {};
  for (const key of COLLECTIONS) s[key] = [];
  return s;
}

export function toSnake(key) {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

export function toCamel(row) {
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
  for (const key of COLLECTIONS) {
    if (!Array.isArray(mem[key])) mem[key] = [];
  }
  return mem;
}

function saveMem() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(storeFile, JSON.stringify(mem, null, 2));
  } catch {
    /* read-only host */
  }
}

function onVercel() {
  return Boolean(process.env.VERCEL);
}

export function databaseUrl() {
  return String(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL_UNPOOLED ||
      '',
  ).trim();
}

function isNeonUrl(url) {
  return /neon\.tech/i.test(url || '');
}

function dbFail(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function rowsOf(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result.map(toCamel);
  if (Array.isArray(result.rows)) return result.rows.map(toCamel);
  return [];
}

async function connectPostgres(url) {
  if (isNeonUrl(url) || onVercel()) {
    const { neon } = await import('@neondatabase/serverless');
    neonSql = neon(url, { fullResults: true });
    return;
  }
  const pg = await import('pg');
  pool = new pg.default.Pool({
    connectionString: url,
    max: 10,
    connectionTimeoutMillis: 4000,
  });
}

async function dropPool() {
  neonSql = null;
  if (!pool) return;
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  pool = null;
}

async function runSql(client, text, params = []) {
  const result = params.length ? await client.query(text, params) : await client.query(text);
  return rowsOf(result);
}

function pgliteDirs() {
  const home = process.env.LOCALAPPDATA || os.homedir();
  return [
    process.env.PGLITE_DIR,
    path.join(dataDir, 'pglite'),
    path.join(home, 'jol-ashkana', 'pglite'),
  ].filter(Boolean);
}

async function openPglite(dir) {
  const { PGlite } = await import('@electric-sql/pglite');
  fs.mkdirSync(dir, { recursive: true });
  if (typeof PGlite.create === 'function') {
    return PGlite.create(dir);
  }
  const db = new PGlite(dir);
  if (db.waitReady) await db.waitReady;
  return db;
}

async function startPglite() {
  let lastErr;
  for (const dir of pgliteDirs()) {
    try {
      pglite = await openPglite(dir);
      mode = 'pglite';
      await runMigrations(query);
      console.log(`JOL-Ashkana db=pglite dir=${dir}`);
      return;
    } catch (err) {
      lastErr = err;
      if (pglite) {
        try {
          await pglite.close();
        } catch {
          /* ignore */
        }
      }
      pglite = null;
      console.warn(`PGlite failed at ${dir}: ${err.message}`);
    }
  }
  throw lastErr || new Error('pglite_failed');
}

export function isPostgres() {
  return mode === 'postgres' || mode === 'pglite';
}

export function dbMode() {
  return mode;
}

export async function query(text, params = []) {
  if (pglite) return runSql(pglite, text, params);
  if (neonSql) {
    const result = params.length ? await neonSql.query(text, params) : await neonSql.query(text);
    return rowsOf(result);
  }
  if (!pool) throw new Error('db_not_ready');
  return runSql(pool, text, params);
}

export async function withTransaction(fn) {
  if (pglite) {
    return pglite.transaction(async (tx) => fn((text, params = []) => runSql(tx, text, params)));
  }
  if (neonSql) {
    return fn((text, params = []) => query(text, params));
  }
  if (!pool) {
    return fn(async () => {
      throw new Error('sql_on_json_store');
    });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q = async (text, params = []) => runSql(client, text, params);
    const out = await fn(q);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

export function memList(collection, pred) {
  const rows = loadMem()[collection] || [];
  return pred ? rows.filter(pred) : [...rows];
}

export function memFindById(collection, id) {
  if (!id) return null;
  return (loadMem()[collection] || []).find((r) => r.id === id) || null;
}

export function memInsert(collection, row) {
  const s = loadMem();
  if (!Array.isArray(s[collection])) s[collection] = [];
  s[collection].push(row);
  saveMem();
  return row;
}

export function memUpdate(collection, id, patch) {
  const s = loadMem();
  const idx = (s[collection] || []).findIndex((r) => r.id === id);
  if (idx < 0) return null;
  s[collection][idx] = { ...s[collection][idx], ...patch };
  saveMem();
  return s[collection][idx];
}

export async function insertRow(table, row) {
  if (!isPostgres()) {
    const collection = Object.keys(TABLE_FOR).find((k) => TABLE_FOR[k] === table);
    return memInsert(collection || table, row);
  }
  const keys = Object.keys(row);
  const cols = keys.map(toSnake).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map((k) => (row[k] === undefined ? null : row[k]));
  const rows = await query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`, values);
  return rows[0] || row;
}

export async function updateRow(table, id, patch) {
  if (!isPostgres()) {
    const collection = Object.keys(TABLE_FOR).find((k) => TABLE_FOR[k] === table);
    return memUpdate(collection || table, id, patch);
  }
  const keys = Object.keys(patch);
  if (!keys.length) {
    const rows = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return rows[0] || null;
  }
  const set = keys.map((k, i) => `${toSnake(k)} = $${i + 1}`).join(', ');
  const values = keys.map((k) => (patch[k] === undefined ? null : patch[k]));
  values.push(id);
  const rows = await query(`UPDATE ${table} SET ${set} WHERE id = $${keys.length + 1} RETURNING *`, values);
  return rows[0] || null;
}

async function seedGeo() {
  const existing = isPostgres() ? await query('SELECT id FROM countries LIMIT 1') : memList('countries');
  if (existing.length) return;
  for (const c of CIS_GEO.countries) await insertRow('countries', c);
  for (const c of CIS_GEO.cities) await insertRow('cities', c);
  for (const d of CIS_GEO.districts) await insertRow('districts', d);
}

async function seedAdmin() {
  const email = String(process.env.ADMIN_EMAIL || 'support@jol-ashkana.local').toLowerCase().trim();
  const password = String(process.env.ADMIN_PASSWORD || 'Support2025!');
  const found = isPostgres()
    ? (await query('SELECT * FROM users WHERE email = $1', [email]))[0]
    : memList('users', (u) => u.email === email)[0];
  if (found) {
    if (!flag(found.isSupport)) {
      await updateRow('users', found.id, { isSupport: true });
    }
    return;
  }
  await insertRow('users', {
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
    isSupport: true,
    blocked: false,
    blockedReason: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

function useJson(reason) {
  if (reason) console.warn(`JOL-Ashkana: ${reason}`);
  loadMem();
  mode = 'json';
}

async function startPostgres(url) {
  await connectPostgres(url);
  await runMigrations(query);
  mode = 'postgres';
  console.log('JOL-Ashkana db=postgres');
}

export async function ensureDb() {
  if (ready) return mode;
  const url = databaseUrl();
  const forceJson = String(process.env.STORE || '').toLowerCase() === 'json';

  if (onVercel()) {
    if (!url) {
      mode = 'none';
      throw dbFail(
        'db_config',
        'DATABASE_URL is missing. In Vercel: Storage → Create Database → Neon, or Settings → Environment → add DATABASE_URL and JWT_SECRET, then Redeploy.',
      );
    }
    try {
      await startPostgres(url);
    } catch (err) {
      await dropPool();
      mode = 'none';
      throw dbFail('db', `Postgres failed: ${err.message}`);
    }
    ready = true;
    await seedGeo();
    await seedAdmin();
    return mode;
  }

  if (forceJson) {
    useJson('STORE=json — file store (override).');
  } else if (url) {
    try {
      await startPostgres(url);
    } catch (err) {
      await dropPool();
      console.warn(`Postgres URL failed (${err.message}). Using embedded Postgres.`);
      await startPglite();
    }
  } else {
    await startPglite();
  }

  ready = true;
  await seedGeo();
  await seedAdmin();
  return mode;
}

export async function healthCheck() {
  const payload = {
    ok: false,
    db: mode || 'none',
    vercel: onVercel(),
    hasDatabaseUrl: Boolean(databaseUrl()),
    hint: '',
  };
  try {
    await ensureDb();
    if (isPostgres()) {
      await query('SELECT 1 AS ok');
    }
    payload.ok = true;
    payload.db = mode;
    payload.hint =
      mode === 'postgres'
        ? 'Neon/Postgres connected. Accounts persist.'
        : `Using ${mode}. On Vercel you need DATABASE_URL.`;
    return payload;
  } catch (err) {
    payload.ok = false;
    payload.db = mode || 'none';
    payload.error = err.code || 'db';
    payload.hint = err.message || 'Database is not configured';
    return payload;
  }
}

export async function closeDb() {
  if (pglite) {
    try {
      await pglite.close();
    } catch {
      /* ignore */
    }
    pglite = null;
  }
  await dropPool();
  ready = false;
}

export { flag };
