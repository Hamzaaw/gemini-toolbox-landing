const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require.resolve('../sw.js'), 'utf8');

function worker(fetch, cached, cacheFailure, cacheNames = []) {
    const handlers = {};
    const writes = [];
    const deleted = [];
    vm.runInNewContext(source, {
        self: { location: { origin: 'https://browserlab.io' }, addEventListener: (name, fn) => { handlers[name] = fn; } },
        URL, Response, fetch, console,
        caches: {
            keys: async () => cacheNames,
            delete: async name => { deleted.push(name); return true; },
            match: async () => cached,
            open: async () => {
                if (cacheFailure === 'open') throw new Error('Storage unavailable');
                return { put: async (request, response) => {
                    if (cacheFailure === 'put') throw new Error('Storage full');
                    writes.push(await response.text());
                } };
            }
        }
    });
    return { handlers, writes, deleted };
}

test('activation removes old site caches while preserving current and unrelated caches', async () => {
    const w = worker(() => {}, undefined, undefined, ['browserlab-v2', 'browserlab-v3', 'gemini-toolbox-v1', 'other-app-cache']);
    let activation;
    w.handlers.activate({ waitUntil: value => { activation = value; } });
    await activation;
    assert.deepEqual(w.deleted.sort(), ['browserlab-v2', 'gemini-toolbox-v1']);
});

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

for (const failure of ['open', 'put']) {
    test(`successful navigation survives cache ${failure} failure`, async () => {
        const w = worker(async () => new Response('fresh page'), new Response('stale page'), failure);
        let response;
        w.handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://browserlab.io/' }, respondWith: value => { response = value; } });
        assert.equal(await (await response).text(), 'fresh page');
        assert.deepEqual(w.writes, []);
    });
}

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
