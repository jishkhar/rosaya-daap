import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Exercise the server API client in Node without Next's server-only build marker.
function loadClient(base, key = 'test-channel-key', { platformKey = '', host = 'rosaya.localhost:3001' } = {}) {
  process.env.STORE_API_BASE = base;
  process.env.STORE_CHANNEL_KEY = key;
  process.env.STOREFRONT_PLATFORM_KEY = platformKey;
  const filename = fileURLToPath(new URL('../src/lib/api.ts', import.meta.url));
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const unit = new Module(filename);
  unit.paths = Module._nodeModulePaths(path.dirname(filename));
  const requireModule = unit.require.bind(unit);
  const nextHeaders = { headers: async () => new Map([['host', host]]) };   // the request's headers, as next/headers gives them
  unit.require = (name) => name === 'server-only' ? {} : name === 'next/headers' ? nextHeaders : requireModule(name);
  unit._compile(compiled, filename);
  return unit.exports;
}

async function fixture(t, handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return loadClient(`http://127.0.0.1:${server.address().port}`);
}

function shortenDeadline(t) {
  const timeout = AbortSignal.timeout;
  const deadlines = [];
  AbortSignal.timeout = (ms) => { deadlines.push(ms); return timeout(100); };
  t.after(() => { AbortSignal.timeout = timeout; });
  return deadlines;
}

test('a stalled GET stops at its deadline and is not retried', async (t) => {
  let requests = 0;
  const { api } = await fixture(t, () => { requests++; });
  const deadlines = shortenDeadline(t);
  await assert.rejects(api('/products'), (e) => e.status === 504 && e.code === 'timeout');
  assert.deepEqual(deadlines, [10_000]);
  assert.equal(requests, 1);
});

test('the deadline also bounds a response whose body stalls', async (t) => {
  const { api } = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write('{"items":');
  });
  shortenDeadline(t);
  await assert.rejects(api('/products'), (e) => e.status === 504 && e.code === 'timeout');
});

test('a timed-out write is never automatically replayed', async (t) => {
  let requests = 0;
  const { api } = await fixture(t, () => { requests++; });
  const deadlines = shortenDeadline(t);
  await assert.rejects(api('/orders', { method: 'POST', body: { items: [] } }), (e) => e.status === 504);
  assert.deepEqual(deadlines, [30_000]);
  assert.equal(requests, 1);
});

test('backend error status and message remain available to callers', async (t) => {
  const { api } = await fixture(t, (_req, res) => {
    res.writeHead(409, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'duplicate', message: 'Already submitted.' } }));
  });
  await assert.rejects(api('/reviews'), (e) => e.status === 409 && e.code === 'duplicate' && e.message === 'Already submitted.');
});

test('malformed backend JSON becomes an actionable gateway error', async (t) => {
  const { api } = await fixture(t, (_req, res) => { res.end('<html>Backend unavailable</html>'); });
  await assert.rejects(api('/products'), (e) => e.status === 502 && e.code === 'invalid_response');
});

test('successful requests forward the channel and customer headers', async (t) => {
  const { api } = await fixture(t, (req, res) => {
    assert.equal(req.headers['x-channel-key'], 'test-channel-key');
    assert.equal(req.headers['x-customer-token'], 'test-customer-token');
    res.end(JSON.stringify({ items: [] }));
  });
  assert.deepEqual(await api('/products', { token: 'test-customer-token' }), { items: [] });
});

test('an unconfigured channel fails before a network request', async () => {
  const { api } = loadClient('http://127.0.0.1:1', '');
  await assert.rejects(api('/products'), (e) => e.status === 500 && e.code === 'not_configured');
});

test('the hosted storefront sends its own key and the visited address, never a shop key', async (t) => {
  const server = http.createServer((req, res) => {
    assert.equal(req.headers['x-storefront-key'], 'platform-key');
    assert.equal(req.headers['x-store-host'], 'asha.localhost:3001');
    assert.equal(req.headers['x-channel-key'], undefined);
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const { api } = loadClient(`http://127.0.0.1:${server.address().port}`, '', { platformKey: 'platform-key', host: 'asha.localhost:3001' });
  assert.deepEqual(await api('/theme'), { ok: true });
});
