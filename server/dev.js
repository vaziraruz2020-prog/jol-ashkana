import 'dotenv/config';
import http from 'http';
import { handle } from './handler.js';

const port = Number(process.env.API_PORT) || 8787;

http
  .createServer((req, res) => {
    handle(req, res);
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`JOL-Ashkana API http://127.0.0.1:${port}`);
  });