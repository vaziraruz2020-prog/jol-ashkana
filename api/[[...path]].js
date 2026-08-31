import { handle } from '../server/handler.js';

export default async function handler(req, res) {
  try {
    await handle(req, res);
  } catch (err) {
    console.error(err);
    if (res.headersSent) return;
    const body = JSON.stringify({
      ok: false,
      error: 'server',
      hint: err?.message || 'API crashed',
    });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(body);
  }
}
