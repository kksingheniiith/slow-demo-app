const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// FIX: Extensions that benefit from gzip compression
const COMPRESSIBLE = ['.html', '.js', '.css', '.json', '.svg'];

// FIX: Cache durations for static assets
const CACHE_MAX_AGE = {
  '.html': 0,              // Don't cache HTML (always fresh)
  '.js': 31536000,         // 1 year for JS (assuming versioned)
  '.css': 31536000,        // 1 year for CSS
  '.svg': 2592000,         // 30 days for SVG
  '.ico': 2592000,         // 30 days for favicon
  default: 86400           // 1 day default
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent path traversal — keep requests inside ROOT.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    
    // FIX: Set cache headers
    const maxAge = CACHE_MAX_AGE[ext] || CACHE_MAX_AGE.default;
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': maxAge > 0 ? `public, max-age=${maxAge}` : 'no-cache, no-store, must-revalidate',
    };

    // FIX: Enable gzip compression for text-based assets
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const shouldCompress = COMPRESSIBLE.includes(ext) && acceptEncoding.includes('gzip');

    if (shouldCompress) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      const stream = fs.createReadStream(filePath);
      stream.pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✓ Server listening on http://0.0.0.0:${PORT}`);
  console.log(`✓ Gzip compression enabled`);
  console.log(`✓ Cache headers configured`);
});
