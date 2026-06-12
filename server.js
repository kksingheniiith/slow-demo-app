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

// Cache durations (in seconds)
const CACHE_MAX_AGE = {
  '.html': 300,        // 5 minutes for HTML
  '.js': 31536000,     // 1 year for JS (use versioning)
  '.css': 31536000,    // 1 year for CSS (use versioning)
  '.json': 300,        // 5 minutes for JSON
  '.png': 2592000,     // 30 days for images
  '.jpg': 2592000,
  '.svg': 2592000,
  '.ico': 2592000,
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
    
    // Check if client supports gzip compression
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const supportsGzip = acceptEncoding.includes('gzip');
    
    // Determine if we should compress (text-based files)
    const shouldCompress = supportsGzip && 
      (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json' || ext === '.svg');
    
    // Set headers
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE[ext] || 300}`,
      'ETag': `"${stat.size}-${stat.mtime.getTime()}"`,
    };
    
    // Check ETag for 304 Not Modified
    const clientETag = req.headers['if-none-match'];
    if (clientETag === headers['ETag']) {
      res.writeHead(304);
      return res.end();
    }
    
    if (shouldCompress) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Optimized server listening on http://0.0.0.0:${PORT}`);
  console.log(`📊 Features enabled: gzip compression, caching headers, ETags`);
});
