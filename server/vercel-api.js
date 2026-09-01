import { handle } from './handler.js';

export default async function vercelApi(req, res) {
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
