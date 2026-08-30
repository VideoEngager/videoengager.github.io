#!/usr/bin/env node
/**
 * secure-proxy.js — reference implementation of the ONE thing this demo
 * should never do in production: put the Partner API Key (PAK) in the
 * browser.
 *
 * What it does:
 *   1. Serves the static files in /public (so `node server/secure-proxy.js`
 *      is all you need to run the whole demo — no build step, no deps).
 *   2. Exposes POST /api/token/impersonate, which receives
 *      { externalId, email } from the browser, adds the PAK from *this
 *      process's* environment (never sent by the browser), calls
 *      VideoEngager's impersonate endpoint server-side, and returns only
 *      { token, token_expiration } to the browser.
 *
 * The PAK now never appears in a browser network tab, devtools, or
 * history — only in this server's environment.
 *
 * To wire the demo to use this instead of calling VideoEngager directly:
 *   in public/js/outbound-demo.js, construct the client with:
 *     new VideoEngagerClient({ impersonateProxyUrl: '/api/token/impersonate' })
 *   videoengager-client.js already supports this — see impersonate() there.
 *
 * Zero dependencies on purpose (no npm install, nothing to audit): only
 * Node's built-in http/https/fs modules. Node 18+ recommended.
 *
 * Usage:
 *   cp .env.example .env   # fill in VE_PAK
 *   node server/secure-proxy.js
 */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

loadDotEnv(path.join(__dirname, '..', '.env'));

const PORT = Number(process.env.PORT || 8787);
const VE_API_BASE = (process.env.VE_API_BASE || 'https://videome.leadsecure.com').replace(/\/+$/, '');
const VE_PAK = process.env.VE_PAK || null; // server-side only — never sent to the browser
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/token/impersonate') {
    return handleImpersonate(req, res);
  }
  if (req.method === 'GET') {
    return serveStatic(url.pathname, res);
  }
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Method not allowed' }));
});

function handleImpersonate(req, res) {
  readJsonBody(req, (err, body) => {
    if (err) return sendJson(res, 400, { message: 'Invalid JSON body' });

    const externalId = body && body.externalId;
    const email = body && body.email;
    // A per-request pak is accepted for multi-tenant setups (e.g. a partner
    // admin dashboard where the operator picks which tenant to impersonate),
    // but falls back to the server's own env var so the common case needs
    // no secret in the request at all.
    const pak = (body && body.pak) || VE_PAK;

    if (!pak) return sendJson(res, 500, { message: 'Server is not configured with VE_PAK (set it in .env)' });
    if (!externalId || !email) return sendJson(res, 400, { message: 'externalId and email are required' });

    const upstream = `${VE_API_BASE}/api/partners/impersonate/${encodeURIComponent(pak)}/${encodeURIComponent(externalId)}/${encodeURIComponent(email)}`;

    https.get(upstream, { headers: { Accept: 'application/json' } }, (upRes) => {
      let raw = '';
      upRes.on('data', (chunk) => { raw += chunk; });
      upRes.on('end', () => {
        let data;
        try { data = JSON.parse(raw); } catch (_) { data = { raw }; }

        if (upRes.statusCode >= 400) {
          return sendJson(res, upRes.statusCode, data);
        }
        // Only forward what the browser actually needs — never the pak,
        // never any other field VideoEngager might add later.
        return sendJson(res, 200, {
          token: data.token,
          token_expiration: data.token_expiration,
        });
      });
    }).on('error', (e) => sendJson(res, 502, { message: `Upstream request failed: ${e.message}` }));
  });
}

function serveStatic(pathname, res) {
  if (pathname === '/') pathname = '/outbound-demo.html';
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  // Path traversal guard — never serve anything outside /public.
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

function readJsonBody(req, cb) {
  let raw = '';
  let tooBig = false;
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 1e6) { tooBig = true; req.destroy(); }
  });
  req.on('end', () => {
    if (tooBig) return cb(new Error('Body too large'));
    if (!raw) return cb(null, {});
    try { cb(null, JSON.parse(raw)); } catch (e) { cb(e); }
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

/** Minimal .env loader (KEY=VALUE per line, # comments) — no dependency. */
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

server.listen(PORT, () => {
  console.log(`VideoEngager demo (secure proxy) running at http://localhost:${PORT}`);
  console.log(`  → static demo:        http://localhost:${PORT}/outbound-demo.html`);
  console.log(`  → impersonate proxy:  POST http://localhost:${PORT}/api/token/impersonate`);
  console.log(VE_PAK ? '  → VE_PAK loaded from .env' : '  ⚠ VE_PAK not set — pass "pak" in the request body instead');
});
