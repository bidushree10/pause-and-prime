import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { CONFIG } from './server/config.js';
import { initializeDb } from './server/db.js';
import { handleApiRequest } from './server/api.js';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;

      // Handle API routes
      if (pathname.startsWith('/api/')) {
        let body = {};
        if (req.method === 'POST' || req.method === 'PUT') {
          try {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const rawBody = Buffer.concat(buffers).toString('utf-8');
            if (rawBody.trim().length > 0) {
              body = JSON.parse(rawBody);
            }
          } catch (parseErr) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
            return;
          }
        }

        const handled = await handleApiRequest(req, res, pathname, parsedUrl.searchParams, body);
        if (handled) return;
      }

      // Serve static files from public directory
      let filePath = path.join(CONFIG.PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

      // Security check: prevent directory traversal
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(CONFIG.PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
      }

      // Check if file exists, fallback to index.html for SPA navigation
      if (!existsSync(normalizedPath) || (await fs.stat(normalizedPath)).isDirectory()) {
        filePath = path.join(CONFIG.PUBLIC_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });

      createReadStream(filePath).pipe(res);
    } catch (err) {
      console.error('Unhandled server error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
      }
    }
  });
}

export async function startServer(port = CONFIG.PORT) {
  await initializeDb();
  const server = createServer();
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[Pause & Prime] Server listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}

// Auto-start locally
if (!process.env.VERCEL && process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer(CONFIG.PORT);
}

// Vercel serverless entry point
let dbInitialized = false;
const vercelServer = http.createServer(async (req, res) => {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
  const handler = createServer();
  handler.emit('request', req, res);
});

export default vercelServer;