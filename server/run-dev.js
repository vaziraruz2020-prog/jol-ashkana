import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const kids = [];
let stopping = false;

function start(args) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    windowsHide: true,
  });
  kids.push(child);
  child.on('exit', (code) => {
    if (stopping) return;
    stop();
    process.exit(code ?? 0);
  });
}

function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of kids) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});

start([path.join(root, 'server', 'dev.js')]);
start([viteBin]);