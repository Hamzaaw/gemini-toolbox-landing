const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const cleanup = require('../analytics-cleanup.v1.js');

const PREFERENCE = 'browserlab.analytics.preference.v1';
const LANDING = 'browserlab.analytics.landing.v1';
const PREFIX = 'bl_site_GF94WRMX1Y';

function storage(values) {
    const entries = new Map(Object.entries(values));
    return {
        entries, removed: [],
        removeItem(key) { this.removed.push(key); entries.delete(key); },
        clear() { assert.fail('must not broadly clear storage'); },
        setItem() { assert.fail('must not create storage'); },
        getItem() { assert.fail('cleanup needs no stored values'); }
    };
}

function browser(options = {}) {
    const cookies = new Map(Object.entries(options.cookies || {}));
    const writes = [];
    const document = {};
    Object.defineProperty(document, 'cookie', {
        get() { return [...cookies].map(([name, value]) => name + '=' + value).join('; '); },
        set(value) {
            writes.push(value);
            assert.match(value, /=; Max-Age=0; Expires=Thu, 01 Jan 1970/);
            cookies.delete(value.split('=')[0]);
        }
    });
    for (const name of ['body', 'head', 'createElement', 'querySelector', 'write']) {
        Object.defineProperty(document, name, { get() { assert.fail('must not render UI or load anything'); } });
    }
    const win = {
        document, location: { hostname: options.hostname || 'browserlab.io' },
        localStorage: storage({ [PREFERENCE]: 'old-allow', [LANDING]: 'local-unrelated', theme: 'dark' }),
        sessionStorage: storage({ [LANDING]: 'old-entry', [PREFERENCE]: 'session-unrelated', draft: 'keep' }),
        dataLayer: ['other-tag'],
        fetch() { assert.fail('must make no network requests'); },
        XMLHttpRequest() { assert.fail('must make no network requests'); },
        navigator: { sendBeacon() { assert.fail('must make no network requests'); } }
    };
    return { win, cookies, writes };
}

test('silently disables this stream, drops its existing queue, and removes only its scoped storage keys', () => {
    const b = browser();
    const queue = b.win.browserlabAnalyticsData = [['event', 'page_view']];
    cleanup(b.win);
    assert.equal(b.win['ga-disable-G-GF94WRMX1Y'], true);
    assert.equal(b.win.browserlabAnalyticsData, queue);
    assert.equal(queue.length, 0);
    assert.deepEqual(b.win.dataLayer, ['other-tag']);
    assert.deepEqual(b.win.localStorage.removed, [PREFERENCE]);
    assert.deepEqual(b.win.sessionStorage.removed, [LANDING]);
    assert.deepEqual([...b.win.localStorage.entries], [[LANDING, 'local-unrelated'], ['theme', 'dark']]);
    assert.deepEqual([...b.win.sessionStorage.entries], [[PREFERENCE, 'session-unrelated'], ['draft', 'keep']]);
});

test('does not create a data layer or change a non-array value', () => {
    const absent = browser(); cleanup(absent.win);
    assert.equal(Object.hasOwn(absent.win, 'browserlabAnalyticsData'), false);
    const nonArray = browser();
    const sentinel = nonArray.win.browserlabAnalyticsData = { unrelated: true };
    cleanup(nonArray.win);
    assert.equal(nonArray.win.browserlabAnalyticsData, sentinel);
    assert.deepEqual(sentinel, { unrelated: true });
});

test('expires only the retired stream analytics cookies, including both prefix variants', () => {
    const b = browser({ cookies: {
        [PREFIX + '_ga']: 'old',
        [PREFIX + '_ga_GF94WRMX1Y']: 'old-session',
        ['_' + PREFIX + '_ga']: 'old-alternate',
        ['_' + PREFIX + '_ga_GF94WRMX1Y']: 'old-alternate-session',
        [PREFIX + '_ga_VARIANT']: 'old-variant',
        _ga: 'other-stream', _ga_OTHER: 'other-stream-session',
        bl_site_OTHER_ga: 'other-prefixed-stream',
        [PREFIX + '_feature']: 'unrelated-feature',
        [PREFIX + 'EXTRA_ga']: 'similar-prefix',
        theme: 'dark'
    } });
    cleanup(b.win);
    assert.deepEqual([...b.cookies.keys()], ['_ga', '_ga_OTHER', 'bl_site_OTHER_ga', PREFIX + '_feature', PREFIX + 'EXTRA_ga', 'theme']);
    assert.equal(b.writes.every(value => /^_?bl_site_GF94WRMX1Y_ga(?:_[A-Za-z0-9_]+)?=;/.test(value)), true);
    assert.equal(b.writes.some(value => !value.includes('Domain=')), true);
    assert.equal(b.writes.some(value => value.includes('; Domain=browserlab.io')), true);
    assert.equal(b.writes.some(value => value.includes('; Domain=.browserlab.io')), true);
});

test('covers the www host and parent-domain cookie variants', () => {
    const b = browser({ hostname: 'www.browserlab.io' }); cleanup(b.win);
    const domains = new Set(b.writes.map(value => value.match(/; Domain=([^;]+)/)?.[1] || 'host-only'));
    assert.deepEqual(domains, new Set(['host-only', 'www.browserlab.io', '.www.browserlab.io', 'browserlab.io', '.browserlab.io']));
});

test('denied storage, queue access and cookies cannot interrupt the site', () => {
    const b = browser();
    for (const key of ['localStorage', 'sessionStorage', 'browserlabAnalyticsData']) {
        Object.defineProperty(b.win, key, { get() { throw new Error('access denied'); } });
    }
    Object.defineProperty(b.win, 'document', { get() { throw new Error('cookie access denied'); } });
    assert.doesNotThrow(() => cleanup(b.win));
    assert.equal(b.win['ga-disable-G-GF94WRMX1Y'], true);
});

test('unreadable cookies still receive only bounded known-cookie expirations', () => {
    const b = browser();
    Object.defineProperty(b.win, 'document', { value: {
        get cookie() { throw new Error('read denied'); },
        set cookie(value) { b.writes.push(value); }
    } });
    cleanup(b.win);
    assert.equal(new Set(b.writes.map(value => value.split('=')[0])).size, 4);
    assert.equal(b.writes.every(value => value.includes('Max-Age=0')), true);
});

test('browser loading runs cleanup immediately with no DOM or network calls', () => {
    const b = browser();
    vm.runInNewContext(readFileSync(require.resolve('../analytics-cleanup.v1.js'), 'utf8'), { window: b.win });
    assert.equal(b.win['ga-disable-G-GF94WRMX1Y'], true);
    assert.equal(b.win.localStorage.entries.has(PREFERENCE), false);
    assert.equal(Object.hasOwn(b.win, 'browserlabAnalyticsData'), false);
});

test('running cleanup again stays safe and preserves unrelated data', () => {
    const b = browser({ cookies: { _ga: 'keep', theme: 'keep' } });
    cleanup(b.win); cleanup(b.win);
    assert.deepEqual([...b.cookies.keys()], ['_ga', 'theme']);
    assert.equal(b.win.localStorage.entries.get('theme'), 'dark');
    assert.equal(b.win.sessionStorage.entries.get('draft'), 'keep');
});
