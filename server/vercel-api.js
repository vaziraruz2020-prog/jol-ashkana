import { handle } from './handler.js';

const ALIASES = {
  '/api/login': '/api/auth/login',
  '/api/register': '/api/auth/register',
  '/api/products': '/api/kitchens',
  '/api/product': '/api/kitchens',
};

function queryString(raw) {
  const s = String(raw || '');
  const i = s.indexOf('?');
  return i >= 0 ? s.slice(i) : '';
}

function vercelPath(req) {
  const qpath = req.query?.path;
  if (qpath != null && qpath !== '') {
    const parts = (Array.isArray(qpath) ? qpath : [qpath]).filter(Boolean);
    return `/api/${parts.join('/')}`;
  }
  const raw = String(req.url || '/');
  let path = raw.split('?')[0];
  try {
    if (/^https?:\/\//i.test(raw)) path = new URL(raw).pathname;
  } catch {
    /* keep */
  }
  path = path.replace(/\/+$/, '') || '/';
  if (path.startsWith('/api')) return path;
  return `/api${path.startsWith('/') ? path : `/${path}`}`;
}

function sendJson(res, status, obj) {
  if (res.headersSent) return;
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(obj);
    return;
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

export default async function vercelApi(req, res) {
  try {
    const qs = queryString(req.url);
    let path = vercelPath(req);
    path = ALIASES[path] || path;
    req.url = path + qs;

    const method = req.method || 'GET';
    if (method === 'GET' && (path === '/api' || path === '/api/')) {
      sendJson(res, 200, {
        ok: true,
        app: 'JOL-Ashkana API',
        try: ['/api/health', '/api/geo', '/api/kitchens', 'POST /api/auth/login'],
      });
      return;
    }
    if (method === 'GET' && path === '/api/auth/login') {
      sendJson(res, 200, {
        ok: true,
        hint: 'Open the website and log in there. This URL is POST only: { email, password }',
      });
      return;
    }
    if (method === 'GET' && path === '/api/auth/register') {
      sendJson(res, 200, {
        ok: true,
        hint: 'Open the website and create an account. This URL is POST only: { email, password, name }',
      });
      return;
    }

    await handle(req, res);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, {
      ok: false,
      error: 'server',
      hint: err?.message || 'API crashed',
    });
  }
}
