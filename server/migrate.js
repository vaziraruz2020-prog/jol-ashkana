import path from 'path';
import { fileURLToPath } from 'url';
import { MIGRATIONS } from './sql-migrations.js';

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
  for (const file of MIGRATIONS) {
    if (applied.has(file.id)) continue;
    for (const stmt of splitSql(file.sql)) {
      try {
        await query(stmt);
      } catch (err) {
        if (stmt.trim().startsWith('DO $$')) {
          console.warn(`migration skip: ${file.id} DO block (${err.message})`);
          continue;
        }
        throw err;
      }
    }
    await query('INSERT INTO schema_migrations (id) VALUES ($1)', [file.id]);
    console.log(`migration applied: ${file.id}`);
  }
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] && path.normalize(process.argv[1]) === path.normalize(thisFile);
if (invoked) {
  import('dotenv/config')
    .then(() => import('./db.js'))
    .then(async ({ ensureDb, closeDb }) => {
      await ensureDb();
      console.log('migrations ok');
      await closeDb();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
