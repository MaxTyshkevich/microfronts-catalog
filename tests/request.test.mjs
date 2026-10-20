import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadTypeScript(file) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(javascript).toString('base64'));
}

const { request } = await loadTypeScript('../src/shared/api/request.ts');

test('request sends guest headers and omits cookies', async (t) => {
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/products');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.headers.get('X-Cart-Key'), 'guest-key');
    assert.equal(options.headers.get('X-Requested-With'), 'microfronts');
    assert.equal(options.headers.has('X-Session-User'), false);
    return Response.json([{ id: 'one' }]);
  };
  assert.deepEqual(await request({ apiBaseUrl: '/api/', cartKey: 'guest-key' }, '/products'), [{ id: 'one' }]);
});

test('request sends session credentials and reports unauthorized API errors', async (t) => {
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  let unauthorized = 0;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.credentials, 'include');
    assert.equal(options.headers.get('X-Session-User'), 'user-1');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    return Response.json({ message: 'Session expired' }, { status: 401 });
  };
  await assert.rejects(
    request({ apiBaseUrl: '/api', cartKey: 'guest-key', sessionScope: 'user:user-1', onUnauthorized: () => unauthorized++ }, '/cart/items', { method: 'POST', body: '{}' }),
    /Session expired/,
  );
  assert.equal(unauthorized, 1);
});

test('request forwards cancellation to fetch', async (t) => {
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  const controller = new AbortController();
  globalThis.fetch = async (_url, options) => {
    controller.abort();
    assert.equal(options.signal.aborted, true);
    throw new DOMException('Aborted', 'AbortError');
  };
  await assert.rejects(request({ apiBaseUrl: '/api', cartKey: 'guest-key' }, '/products', { signal: controller.signal }), { name: 'AbortError' });
});
