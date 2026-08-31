import 'dotenv/config';
import http from 'http';
import { handle } from './handler.js';
import { dbMode, ensureDb } from './db.js';

const port = Number(process.env.API_PORT) || 8787;

function isApiRoot(url) {
  const p = String(url || '/').split('?')[0];
  return p === '/' || p === '/api' || p === '/api/';
}

http
  .createServer(async (req, res) => {
    if ((req.method || 'GET') === 'GET' && isApiRoot(req.url)) {
      try {
        await ensureDb();
      } catch {
        /* health still reports below */
      }
      const body = JSON.stringify({
        ok: true,
        app: 'JOL-Ashkana API',
        db: dbMode(),
        open: 'http://localhost:5173',
        health: '/api/health',
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(body);
      return;
    }
    handle(req, res);
  })
  .listen(port, '127.0.0.1', async () => {
    try {
      const mode = await ensureDb();
      console.log(`JOL-Ashkana API http://127.0.0.1:${port}  db=${mode}`);
    } catch (err) {
      console.error('DB start failed:', err.message);
    }
    console.log('Open the app at http://localhost:5173');
  });
