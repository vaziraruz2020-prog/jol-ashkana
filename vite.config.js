import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

function apiPlugin() {
  let child;
  return {
    name: 'jol-api',
    configureServer() {
      if (child) return;
      child = spawn(process.execPath, [path.join(root, 'server', 'dev.js')], {
        cwd: root,
        stdio: 'inherit',
        windowsHide: true,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },
});
