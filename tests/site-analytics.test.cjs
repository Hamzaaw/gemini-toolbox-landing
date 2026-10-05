const { test } = require('node:test');
const assert = require('node:assert/strict');
const analytics = require('../site-analytics.v1.js');

const ID = 'G-TEST1234';
const TIME = 1800000000000;
const CYT = 'mpfdnefhgmjlbkphfpkiicdaegfanbab';
const PREFIX = 'bl_site_TEST1234';

class Storage {
    constructor(values = {}, blocked = false) { this.values = new Map(Object.entries(values)); this.writes = []; this.blocked = blocked; }
    getItem(key) { if (this.blocked) throw new Error('blocked'); return this.values.get(key) || null; }
    setItem(key, value) { if (this.blocked) throw new Error('blocked'); this.writes.push({ key, value }); this.values.set(key, value); }
    removeItem(key) { if (this.blocked) throw new Error('blocked'); this.values.delete(key); }
}

class Element {
    constructor(tag, document) {
        this.tagName = tag.toUpperCase(); this.nodeType = 1; this.ownerDocument = document;
        this.children = []; this.attributes = {}; this.listeners = {}; this.parentNode = null; this.hidden = false;
    }
    get parentElement() { return this.parentNode; }
    get firstChild() { return this.children[0] || null; }
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
    insertBefore(child, sibling) {
        child.parentNode = this;
        const index = this.children.indexOf(sibling);
        if (index === -1) this.children.push(child); else this.children.splice(index, 0, child);
        return child;
    }
    remove() { if (this.parentNode) this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); this.parentNode = null; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    click() { for (const fn of this.listeners.click || []) fn({ target: this }); }
    focus(options) { this.focusOptions = options; this.ownerDocument.activeElement = this; }
    scrollIntoView() { this.scrolled = true; }
    contains(element) { return element === this || this.children.some(child => child.contains(element)); }
    closest(selector) {
        assert.equal(selector, 'a[href]');
        return this.tagName === 'A' && this.href ? this : this.parentNode?.closest(selector);
    }
}

function allElements(element) { return [element, ...element.children.flatMap(allElements)]; }
function browser(options = {}) {
    const location = new URL(options.url || 'https://browserlab.io/transcript-for-youtube');
    const document = { referrer: options.referrer || '', listeners: {}, cookieWrites: [], activeElement: null };
    // The test throws if the module ever tries to read an actual document title.
    Object.defineProperty(document, 'title', { get: () => { throw new Error('never read titles'); } });
    document.head = new Element('head', document);
    document.body = new Element('body', document);
    document.createElement = tag => new Element(tag, document);
    document.main = document.body.appendChild(new Element('main', document));
    document.footer = document.body.appendChild(new Element('footer', document));
    document.querySelector = selector => {
        assert.equal(selector, 'main');
        return document.main;
    };
    document.addEventListener = (name, fn) => { (document.listeners[name] ||= []).push(fn); };
    const cookies = new Map(Object.entries(options.cookies || {}));
    Object.defineProperty(document, 'cookie', {
        get: () => [...cookies].map(([name, value]) => name + '=' + value).join('; '),
        set: value => {
            document.cookieWrites.push(value);
            if (value.includes('Max-Age=0')) cookies.delete(value.split('=')[0]);
        }
    });
    const win = {
        document, location, navigator: { globalPrivacyControl: !!options.gpc }, listeners: {},
        localStorage: options.localStorage || new Storage(), sessionStorage: options.sessionStorage || new Storage(),
        addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    };
    const instance = analytics.createAnalytics(win, { measurementId: ID, now: () => options.now || TIME });
    instance.mount();
    const controls = allElements(document.body);
    return {
        win, document, cookies, instance,
        panel: controls.find(e => e.id === 'bl-analytics-consent'),
        allow: controls.find(e => e.textContent === 'Allow analytics'),
        deny: controls.find(e => e.textContent === 'No thanks'),
        preferences: controls.find(e => e.textContent === 'Analytics preferences'),
        commands: () => (win[analytics.dataLayerName] || []).map(args => Array.from(args)),
        events: () => (win[analytics.dataLayerName] || []).map(args => Array.from(args)).filter(args => args[0] === 'event'),
        storeClick(href) {
            const link = document.createElement('a'); link.href = href;
            const child = link.appendChild(document.createElement('span'));
            const event = { target: child, preventDefault: () => assert.fail('must preserve navigation'), stopPropagation: () => assert.fail('must preserve navigation') };
            for (const fn of document.listeners.click || []) fn(event);
        }
    };
}

function pref(analyticsValue, gpcAcknowledged = false) {
    return JSON.stringify({ version: 1, analytics: analyticsValue, gpcAcknowledged });
}

test('canonical paths are fixed; unrecognized paths never enter page data', () => {
    assert.equal(analytics.fixedPath('/transcript-for-youtube.html'), '/transcript-for-youtube');
    assert.equal(analytics.fixedPath('/blog/index.html'), '/blog');
    assert.equal(analytics.fixedPath('/index.html'), '/');
    assert.equal(analytics.fixedPath('/privacy/'), '/privacy');
    assert.equal(analytics.fixedPath('/search/alice@example.com'), null);
    assert.equal(analytics.fixedPath('/blog/my-private-note'), null);
});

test('referral paths, queries, hashes and credentials are discarded', () => {
    assert.equal(analytics.cleanReferrer('https://www.reddit.com/r/SideProject/?q=private#email'), 'https://www.reddit.com/');
    assert.equal(analytics.cleanReferrer('https://google.com/search?q=secret'), 'https://google.com/');
    assert.equal(analytics.cleanReferrer('https://example.com/alice%40example.com?x=private'), 'https://example.com/');
    assert.equal(analytics.cleanReferrer('https://example.com/private/client-Alice/project-123'), 'https://example.com/');
    assert.equal(analytics.cleanReferrer('https://alice:password@example.com/'), '');
    assert.equal(analytics.cleanReferrer('https://browserlab.io/blog?utm_source=reddit'), '');
    assert.equal(analytics.cleanReferrer('javascript:alert(1)'), '');
});

test('incoming campaign attribution uses approved names only', () => {
    assert.deepEqual(analytics.cleanCampaign(new URLSearchParams('utm_source=reddit&utm_medium=social&utm_campaign=cyt_reddit&utm_term=secret&utm_content=email@example.com&q=private')), {
        utm_source: 'reddit', utm_medium: 'social', utm_campaign: 'cyt_reddit'
    });
    assert.deepEqual(analytics.cleanCampaign(new URLSearchParams('utm_source=alice@example.com&utm_medium=someone&utm_campaign=private_note')), {});
});

test('loading and declining perform no Google setup and persist no landing context', () => {
    const b = browser();
    assert.equal(b.document.head.children.length, 0);
    assert.equal(b.commands().length, 0);
    assert.equal(b.win.sessionStorage.writes.length, 0);
    assert.equal(b.panel.hidden, false);
    assert.equal(b.preferences.hidden, true);
    assert.equal(b.document.body.children[0], b.panel); // Flow before main, never an overlay.
    b.allow.focus(); b.deny.click();
    assert.equal(b.instance.isAllowed(), false);
    assert.equal(b.document.head.children.length, 0);
    assert.equal(b.commands().length, 0);
    assert.equal(b.win.sessionStorage.writes.length, 0);
    assert.equal(JSON.parse(b.win.localStorage.getItem(analytics.preferenceKey)).analytics, 'denied');
    assert.equal(b.panel.hidden, true);
    assert.equal(b.preferences.hidden, false);
    assert.equal(b.document.activeElement, b.preferences);
    assert.deepEqual(b.preferences.focusOptions, { preventScroll: true });
});

test('Allow loads Google once with denied ads and emits a controlled clean page view', () => {
    const b = browser({
        url: 'https://browserlab.io/transcript-for-youtube?utm_source=reddit&utm_medium=social&utm_campaign=cyt_reddit&utm_term=private&email=alice%40example.com#secret',
        referrer: 'https://www.reddit.com/r/SideProject/?search=private#secret'
    });
    b.allow.click();
    const [script] = b.document.head.children;
    assert.equal(script.src, 'https://www.googletagmanager.com/gtag/js?id=' + ID + '&l=' + analytics.dataLayerName);
    assert.equal(script.referrerPolicy, 'no-referrer');
    const config = b.commands().find(args => args[0] === 'config')[2];
    assert.equal(config.send_page_view, false);
    assert.equal(config.allow_google_signals, false);
    assert.equal(config.allow_ad_personalization_signals, false);
    assert.equal(config.cookie_prefix, PREFIX);
    assert.equal(config.cookie_domain, 'none');
    for (const command of b.commands().filter(args => args[0] === 'consent')) {
        assert.equal(command[2].ad_storage, 'denied');
        assert.equal(command[2].ad_user_data, 'denied');
        assert.equal(command[2].ad_personalization, 'denied');
    }
    const event = b.events()[0];
    assert.equal(event[1], 'page_view');
    assert.equal(event[2].send_to, ID);
    assert.equal(event[2].page_path, '/transcript-for-youtube');
    assert.equal(event[2].page_title, 'Copy YouTube Transcript');
    assert.equal(event[2].page_location, 'https://browserlab.io/transcript-for-youtube?utm_source=reddit&utm_medium=social&utm_campaign=cyt_reddit');
    assert.equal(event[2].page_referrer, 'https://www.reddit.com/');
    assert.doesNotMatch(JSON.stringify(b.commands()), /private|secret|alice/);
    b.instance.choose('allowed');
    assert.equal(b.document.head.children.length, 1);
    assert.equal(b.events().filter(args => args[1] === 'page_view').length, 1);
    assert.equal(b.win.sessionStorage.writes.length > 0, true);
});

test('known nested store links produce safe events without changing navigation', () => {
    const b = browser(); b.allow.click();
    b.storeClick('https://chromewebstore.google.com/detail/anything/' + CYT + '?utm_campaign=cyt_pilot_product&utm_content=hero&authuser=0&q=private#email');
    const event = b.events()[1];
    assert.equal(event[1], 'store_click');
    assert.equal(event[2].extension, 'copy-youtube-transcript');
    assert.equal(event[2].store_campaign, 'cyt_pilot_product');
    assert.equal(event[2].cta_placement, 'hero');
    assert.equal(event[2].link_url, 'https://chromewebstore.google.com/detail/copy-youtube-transcript/' + CYT);
    assert.doesNotMatch(JSON.stringify(event), /private|authuser|#email/);
    b.storeClick('https://chromewebstore.google.com/detail/copy-youtube-transcript/' + CYT + '?utm_campaign=alice%40example.com&utm_content=private');
    assert.equal(b.events()[2][2].store_campaign, 'untagged');
    assert.equal(b.events()[2][2].cta_placement, 'unspecified');
    for (const href of [
        'https://chromewebstore.google.com/detail/unknown/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'https://chromewebstore.google.com.evil.test/detail/example/' + CYT,
        'http://chromewebstore.google.com/detail/example/' + CYT,
        'javascript:alert(1)'
    ]) b.storeClick(href);
    assert.equal(b.events().length, 3);
});

test('store tracking never reads transcript or form contents', () => {
    const b = browser(); b.allow.click();
    for (const tag of ['textarea', 'input']) {
        const input = b.document.createElement(tag);
        Object.defineProperty(input, 'value', { get: () => assert.fail('must not read visitor text') });
        for (const fn of b.document.listeners.click) fn({ target: input });
    }
    assert.equal(b.events().length, 1);
});

test('allowed internal navigation preserves first-entry attribution and the current page path', () => {
    const first = browser({ url: 'https://browserlab.io/blog/youtube-shorts-transcript?utm_source=reddit&utm_medium=social&utm_campaign=cyt_reddit', referrer: 'https://www.reddit.com/r/SideProject/' });
    first.allow.click();
    const second = browser({
        url: 'https://browserlab.io/transcript-for-youtube?email=private#secret',
        referrer: 'https://browserlab.io/blog/youtube-shorts-transcript?query=private',
        localStorage: first.win.localStorage, sessionStorage: first.win.sessionStorage
    });
    const fields = second.events()[0][2];
    assert.equal(fields.landing_page, '/blog/youtube-shorts-transcript');
    assert.equal(fields.page_path, '/transcript-for-youtube');
    assert.equal(fields.page_referrer, 'https://www.reddit.com/');
    assert.equal(fields.page_location, 'https://browserlab.io/transcript-for-youtube?utm_source=reddit&utm_medium=social&utm_campaign=cyt_reddit');
});

test('expired sessions and tampered landing data do not become attribution', () => {
    const localStorage = new Storage({ [analytics.preferenceKey]: pref('allowed') });
    const sessionStorage = new Storage({ [analytics.landingKey]: JSON.stringify({ version: 1, landingPath: '/transcript-for-youtube', referrer: 'https://reddit.com/?q=private', campaign: { utm_source: 'reddit' }, lastSeen: TIME - 31 * 60 * 1000 }) });
    const b = browser({ localStorage, sessionStorage, referrer: 'https://google.com/search?q=private' });
    assert.equal(b.events()[0][2].page_referrer, 'https://google.com/');
    assert.equal(b.events()[0][2].page_location, 'https://browserlab.io/transcript-for-youtube');
    const bad = browser({ localStorage, sessionStorage: new Storage({ [analytics.landingKey]: JSON.stringify({ version: 1, landingPath: '/private/alice@example.com', referrer: 'https://evil.test/?secret=1', campaign: { utm_source: 'private' }, lastSeen: TIME }) }) });
    assert.equal(bad.events()[0][2].landing_page, '/transcript-for-youtube');
    assert.doesNotMatch(JSON.stringify(bad.events()), /alice|private|secret/);
});

test('a browser privacy signal defaults off; only an explicit acknowledged Allow enables it', () => {
    const b = browser({ gpc: true, localStorage: new Storage({ [analytics.preferenceKey]: pref('allowed') }) });
    assert.equal(b.document.head.children.length, 0);
    assert.equal(b.panel.hidden, false);
    assert.match(allElements(b.panel).find(e => e.tagName === 'SPAN').textContent, /browser’s privacy preference/);
    b.allow.click();
    assert.equal(b.document.head.children.length, 1);
    assert.equal(JSON.parse(b.win.localStorage.getItem(analytics.preferenceKey)).gpcAcknowledged, true);
    const second = browser({ gpc: true, localStorage: b.win.localStorage, sessionStorage: b.win.sessionStorage });
    assert.equal(second.events().length, 1);
});

test('unavailable storage falls back to an explicit choice in this page only', () => {
    const b = browser({ localStorage: new Storage({}, true), sessionStorage: new Storage({}, true) });
    assert.equal(b.events().length, 0);
    assert.doesNotThrow(() => b.allow.click());
    assert.equal(b.events().length, 1);
    assert.doesNotThrow(() => b.deny.click());
    assert.equal(b.instance.isAllowed(), false);
    assert.equal(b.events().length, 0);
    const second = browser({ localStorage: b.win.localStorage, sessionStorage: b.win.sessionStorage });
    assert.equal(second.events().length, 0);
});

test('a failed preference write cannot leave an older Allow active on the next page', () => {
    const localStorage = new Storage({ [analytics.preferenceKey]: pref('allowed') });
    localStorage.setItem = () => { throw new Error('storage full'); };
    const b = browser({ localStorage });
    assert.equal(b.events().length, 1);
    b.deny.click();
    assert.equal(localStorage.getItem(analytics.preferenceKey), null);
    const second = browser({ localStorage });
    assert.equal(second.events().length, 0);
});

test('withdrawal stops events, clears only this stream cookies, and keeps preferences accessible', () => {
    const b = browser({ cookies: { [PREFIX + '_ga']: 'owned', [PREFIX + '_ga_TEST1234']: 'owned-session', _ga: 'other-stream', _ga_OTHER: 'other-session', other_cookie: 'keep' } });
    b.allow.click();
    b.document.head.children[0].onload();
    b.preferences.click();
    assert.equal(b.panel.hidden, false);
    assert.equal(b.preferences.attributes['aria-expanded'], 'true');
    assert.equal(b.document.activeElement, b.allow);
    b.deny.click();
    assert.equal(b.win['ga-disable-' + ID], true);
    assert.equal(b.instance.isAllowed(), false);
    b.storeClick('https://chromewebstore.google.com/detail/copy-youtube-transcript/' + CYT);
    assert.equal(b.events().length, 0);
    assert.equal(b.win.sessionStorage.getItem(analytics.landingKey), null);
    assert.deepEqual([...b.cookies.keys()], ['_ga', '_ga_OTHER', 'other_cookie']);
    assert.equal(b.document.cookieWrites.some(value => value.includes('Domain=browserlab.io')), true);
    assert.equal(b.document.cookieWrites.every(value => value.startsWith(PREFIX)), true);
    assert.equal(b.preferences.hidden, false);
    assert.equal(b.preferences.attributes['aria-label'], 'Analytics preferences, currently off');
    assert.equal(b.preferences.attributes['aria-expanded'], 'false');
    assert.equal(JSON.parse(b.win.localStorage.getItem(analytics.preferenceKey)).analytics, 'denied');
});

test('withdrawal before Google loads discards pending events and removes the script', () => {
    const b = browser(); b.allow.click();
    assert.equal(b.document.head.children.length, 1);
    b.deny.click();
    assert.equal(b.document.head.children.length, 0);
    assert.equal(b.commands().length, 0);
    b.allow.click();
    assert.equal(b.document.head.children.length, 1);
    assert.equal(b.events().length, 1);
});

test('localhost, preview hosts, HTTP and unknown page routes cannot load analytics', () => {
    for (const url of [
        'http://localhost:8791/transcript-for-youtube',
        'https://browserlab-preview.vercel.app/transcript-for-youtube',
        'http://browserlab.io/transcript-for-youtube',
        'https://browserlab.io:8443/transcript-for-youtube',
        'https://browserlab.io/private/alice@example.com'
    ]) {
        const b = browser({ url }); b.allow.click();
        b.storeClick('https://chromewebstore.google.com/detail/copy-youtube-transcript/' + CYT);
        assert.equal(b.document.head.children.length, 0, url);
        assert.equal(b.commands().length, 0, url);
        assert.equal(b.win.sessionStorage.writes.length, 0, url);
    }
    const www = browser({ url: 'https://www.browserlab.io/transcript-for-youtube' });
    www.allow.click(); assert.equal(www.events().length, 1);
});

test('Google script errors leave the page, preferences and link handling functional', () => {
    const b = browser(); b.allow.click();
    assert.doesNotThrow(() => b.document.head.children[0].onerror());
    assert.doesNotThrow(() => b.storeClick('https://chromewebstore.google.com/detail/copy-youtube-transcript/' + CYT));
    assert.doesNotThrow(() => b.deny.click());
    assert.equal(b.preferences.hidden, false);
});

test('a withdrawal in another tab disables this page immediately', () => {
    const b = browser(); b.allow.click();
    b.win.localStorage.setItem(analytics.preferenceKey, pref('denied'));
    for (const fn of b.win.listeners.storage) fn({ key: analytics.preferenceKey });
    b.storeClick('https://chromewebstore.google.com/detail/copy-youtube-transcript/' + CYT);
    assert.equal(b.win['ga-disable-' + ID], true);
    assert.equal(b.instance.isAllowed(), false);
    assert.equal(b.events().length, 0);
});

test('clearing local storage in another tab invalidates consent immediately', () => {
    const b = browser(); b.allow.click();
    b.win.localStorage.removeItem(analytics.preferenceKey);
    for (const fn of b.win.listeners.storage) fn({ key: null });
    b.storeClick('https://chromewebstore.google.com/detail/copy-youtube-transcript/' + CYT);
    assert.equal(b.win['ga-disable-' + ID], true);
    assert.equal(b.instance.isAllowed(), false);
    assert.equal(b.events().length, 0);
    assert.equal(b.panel.hidden, false);
});
