// Preview the production export with clean routes like Vercel. No dev bundler.
const http = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const path = require('node:path');

const dist = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.wav': 'audio/wav',
};

http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.replace(/^\/+/, '');
    let file = path.resolve(dist, relative || 'index.html');
    if (!file.startsWith(dist + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if (!path.extname(file)) {
      const cleanRoute = file + '.html';
      file = await stat(cleanRoute).then(() => cleanRoute, () => path.join(file, 'index.html'));
    }
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found. Run npm run build before previewing.');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Production PWA: http://localhost:${port}`);
});
