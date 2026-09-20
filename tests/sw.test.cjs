const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require.resolve('../sw.js'), 'utf8');

function worker(fetch, cached) {
    const handlers = {};
    const writes = [];
    vm.runInNewContext(source, {
        self: { location: { origin: 'https://browserlab.io' }, addEventListener: (name, fn) => { handlers[name] = fn; } },
        URL, Response, fetch, console,
        caches: { match: async () => cached, open: async () => ({ put: async (request, response) => writes.push(await response.text()) }) }
    });
    return { handlers, writes };
}

test('returning visitors receive new HTML rather than a stale cached page', async () => {
    const w = worker(async () => new Response('updated guide'), new Response('old guide'));
    let response;
    w.handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://browserlab.io/transcript-for-youtube' }, respondWith: value => { response = value; } });
    assert.equal(await (await response).text(), 'updated guide');
    assert.deepEqual(w.writes, ['updated guide']);
});

test('offline navigation falls back to the cached guide', async () => {
    const w = worker(async () => { throw new Error('offline'); }, new Response('saved guide'));
    let response;
    w.handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://browserlab.io/blog/youtube-shorts-transcript' }, respondWith: value => { response = value; } });
    assert.equal(await (await response).text(), 'saved guide');
});

test('HTTP errors do not overwrite a cached page with an error document', async () => {
    const w = worker(async () => new Response('error', { status: 500 }), new Response('saved guide'));
    let response;
    w.handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://browserlab.io/' }, respondWith: value => { response = value; } });
    assert.equal((await response).status, 500);
    assert.deepEqual(w.writes, []);
});

test('does not intercept off-site requests or non-GET requests', () => {
    const w = worker(() => { throw new Error('must not fetch'); });
    for (const request of [{ method: 'POST', mode: 'cors', url: 'https://browserlab.io/' }, { method: 'GET', mode: 'navigate', url: 'https://chromewebstore.google.com/' }]) {
        w.handlers.fetch({ request, respondWith: () => assert.fail('must not intercept') });
    }
});
