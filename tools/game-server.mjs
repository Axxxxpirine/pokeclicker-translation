import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { root } from './resources.mjs';

// Pinned unmodified release, read-only git objects, localhost only.
export async function serveRelease({ gamePath, extra = new Map() } = {}) {
  const game = resolve(gamePath ?? process.env.POKECLICKER_SOURCE ?? resolve(root, '../pokeclicker'));
  const provenance = JSON.parse(readFileSync(resolve(root, 'upstream/provenance.json'), 'utf8'));
  const cache = new Map();
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (extra.has(path)) { res.writeHead(200, { 'content-type': 'application/javascript' }); res.end(extra.get(path)); return; }
    if (path === '/') path = '/index.html';
    if (path.includes('..') || !/^\/[\w\s./()%+&'!,:=~@\-]+$/u.test(path)) { res.writeHead(400).end(); return; }
    try {
      if (!cache.has(path)) cache.set(path, execFileSync('git', ['-C', game, 'show', `${provenance.game.commit}:docs${path}`], { maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }));
      res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }); res.end(cache.get(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)), provenance };
}
