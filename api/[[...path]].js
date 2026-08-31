import { handle } from '../server/handler.js';

export default async function handler(req, res) {
  await handle(req, res);
}
