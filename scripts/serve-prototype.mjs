import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = Number.parseInt(process.argv[2] || '8000', 10);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME_TYPES = Object.freeze({
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
});

function send(response, status, body, headers = {}) {
    response.writeHead(status, {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...headers
    });
    response.end(body);
}

createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        send(response, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
        return;
    }

    try {
        const url = new URL(request.url || '/', `http://${HOST}:${PORT}`);
        const pathname = decodeURIComponent(url.pathname);
        const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        const filePath = resolve(ROOT, relativePath);
        const insideRoot = filePath === ROOT || filePath.startsWith(`${ROOT}${sep}`);

        if (!insideRoot) {
            send(response, 403, 'Forbidden');
            return;
        }

        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) {
            send(response, 404, 'Not Found');
            return;
        }

        const body = request.method === 'HEAD' ? null : await readFile(filePath);
        send(response, 200, body, {
            'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Content-Length': fileStat.size
        });
    } catch (error) {
        const status = error?.code === 'ENOENT' ? 404 : 500;
        send(response, status, status === 404 ? 'Not Found' : 'Internal Server Error');
    }
}).listen(PORT, HOST, () => {
    console.log(`S.Center prototype: http://${HOST}:${PORT}/`);
});
