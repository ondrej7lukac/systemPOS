/**
 * POS Platform — local save server
 * Runs on http://localhost:3333
 * Saves edits to data.json next to this file.
 * No npm install needed — uses only Node built-ins.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = 3333;
const DIR       = __dirname;
const DATA_FILE = path.join(DIR, 'data.json');
const HTML_FILE = path.join(DIR, 'index.html');

// ── helpers ──────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end',  () => resolve(body));
    req.on('error', reject);
  });
}

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type':  'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

// ── server ───────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // GET / → serve index.html
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    } catch (e) {
      res.writeHead(500); return res.end('Cannot read index.html');
    }
  }

  // GET /load → return saved data
  if (req.method === 'GET' && url === '/load') {
    try {
      const data = fs.existsSync(DATA_FILE)
        ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
        : {};
      return json(res, 200, data);
    } catch (e) {
      return json(res, 200, {});
    }
  }

  // POST /save → write data to disk
  if (req.method === 'POST' && url === '/save') {
    try {
      const body = await readBody(req);
      const data = JSON.parse(body);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 400, { ok: false, error: String(e) });
    }
  }

  // 404 fallback
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ⬡  POS Platform server running');
  console.log('  →  http://localhost:' + PORT);
  console.log('  →  Edits saved to: data.json');
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');

  // Auto-open browser
  const open = process.platform === 'win32' ? 'start' : 'open';
  require('child_process').exec(open + ' http://localhost:' + PORT);
});
