import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

export function splitSql(sql) {
  const parts = [];
  let buf = '';
  let inDollar = false;
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (!inDollar && trimmed.startsWith('--')) continue;
    const dollars = (line.match(/\$\$/g) || []).length;
    if (dollars % 2 === 1) inDollar = !inDollar;
    buf += `${line}\n`;
    if (!inDollar && trimmed.endsWith(';')) {
      const stmt = buf.trim();
      if (stmt) parts.push(stmt);
      buf = '';
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

export async function runMigrations(query) {
  await query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  );
  const appliedRows = await query('SELECT id FROM schema_migrations');
  const applied = new Set(appliedRows.map((r) => r.id));
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    for (const stmt of splitSql(sql)) {
      try {
        await query(stmt);
      } catch (err) {
        if (stmt.trim().startsWith('DO $$')) {
          console.warn(`migration skip: ${file} DO block (${err.message})`);
          continue;
        }
        throw err;
      }
    }
    await query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
    console.log(`migration applied: ${file}`);
  }
}

const isCli = process.argv[1] && path.normalize(process.argv[1]).includes(`${path.sep}migrate.js`);
if (isCli) {
  await import('dotenv/config');
  const { ensureDb, closeDb } = await import('./db.js');
  try {
    await ensureDb();
    console.log('migrations ok');
    await closeDb();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
