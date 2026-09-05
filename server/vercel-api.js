import { handle } from './handler.js';

function restoreUrl(req) {
  const raw = String(req.url || '/');
  let path = raw.split('?')[0];
  const search = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
  try {
    if (/^https?:\/\//i.test(raw)) path = new URL(raw).pathname;
  } catch {
    /* keep */
  }
  if (!path.includes('[...')) return;
  const headers = req.headers || {};
  const original = String(headers['x-invoke-path'] || headers['x-vercel-original-path'] || '')
    .split('?')[0];
  if (original.startsWith('/api/') && !original.includes('[...')) {
    req.url = `${original}${search}`;
  }
}

export default async function vercelApi(req, res) {
  restoreUrl(req);
  try {
    await handle(req, res);
  } catch (err) {
    if (res.headersSent) return;
    const payload = {
      error: err?.code || 'server',
      hint: err?.message || 'Server error',
    };
    try {
      if (typeof res.status === 'function' && typeof res.json === 'function') {
        res.status(500).json(payload);
        return;
      }
    } catch {
      /* fall through */
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
  }
}
