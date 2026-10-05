/* BrowserLab website measurement. Google is loaded only after an explicit choice. */
(function (root, factory) {
    'use strict';
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else if (root && root.document) {
        var mount = function () { api.createAnalytics(root).mount(); };
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mount, { once: true });
        else mount();
    }
}(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    // The browserlab.io website stream; Chrome Web Store streams are separate.
    var MEASUREMENT_ID = 'G-GF94WRMX1Y';
    var PREFERENCE_KEY = 'browserlab.analytics.preference.v1';
    var LANDING_KEY = 'browserlab.analytics.landing.v1';
    var DATA_LAYER = 'browserlabAnalyticsData';
    var SESSION_TIMEOUT = 30 * 60 * 1000;
    var HOSTS = ['browserlab.io', 'www.browserlab.io'];
    var PAGES = {
        '/': 'BrowserLab extensions',
        '/transcript-for-youtube': 'Copy YouTube Transcript',
        '/gemini-speed-booster': 'Gemini Speed Booster',
        '/bulk-delete-for-gemini': 'Gemini Bulk Delete',
        '/toolbox-for-gemini': 'Toolbox for Gemini',
        '/save-chat-for-gemini': 'Save Chat for Gemini',
        '/blog': 'BrowserLab guides',
        '/blog/copy-youtube-transcript-without-timestamps': 'Copy YouTube transcripts without timestamps',
        '/blog/youtube-transcript-for-chatgpt': 'YouTube transcripts for ChatGPT',
        '/blog/youtube-shorts-transcript': 'YouTube Shorts transcripts',
        '/blog/gemini-slow-long-chats': 'Gemini lag in long chats',
        '/blog/how-to-bulk-delete-gemini-chats': 'Bulk delete Gemini chats',
        '/blog/how-to-organize-gemini-chats': 'Organize Gemini chats',
        '/blog/how-to-export-gemini-chats-to-pdf': 'Export Gemini chats to PDF',
        '/blog/best-gemini-chrome-extensions-2026': 'Gemini Chrome extensions',
        '/blog/gemini-for-coding': 'Gemini for coding',
        '/blog/gemini-tips-and-tricks': 'Gemini tips and tricks',
        '/blog/gemini-vs-chatgpt-2026': 'Gemini and ChatGPT comparison',
        '/privacy': 'BrowserLab privacy',
        '/terms': 'BrowserLab terms'
    };
    var EXTENSIONS = {
        'mpfdnefhgmjlbkphfpkiicdaegfanbab': 'copy-youtube-transcript',
        'nhcnngifihnlimjkaogmgeomnbndekhf': 'gemini-speed-booster',
        'bdbdcppgiiidaolmadifdlceedoojpfh': 'gemini-bulk-delete',
        'cbdpdhfnjbkjphmminnkfbeekodlphlp': 'toolbox-for-gemini',
        'blndbnmpkgfoopgmcejnhdnepfejgipe': 'save-chat-for-gemini'
    };
    var STORE_CAMPAIGNS = [
        'cyt_pilot_product', 'cyt_pilot_clean-text', 'cyt_pilot_ai-workflow', 'cyt_pilot_shorts',
        'gsb_product', 'gsb_guide_long-chats', 'bulk_delete_product', 'bulk_delete_product_toolbox', 'bulk_delete_guide'
    ];
    var PLACEMENTS = ['hero', 'bottom', 'steps', 'sidebar', 'demo', 'quick-answer', 'upgrade', 'upgrade-current'];
    // Add a reviewed campaign here before publishing a new promotional link.
    // Arbitrary URL values, utm_term and utm_content never become website attribution.
    var SOURCES = ['reddit', 'google', 'bing', 'duckduckgo', 'youtube', 'linkedin', 'twitter', 'x', 'facebook', 'instagram', 'tiktok', 'producthunt', 'hackernews', 'huzzler', 'startuplist', 'newsletter'];
    var MEDIA = ['social', 'organic', 'referral', 'cpc', 'paid_social', 'email', 'newsletter'];
    var CAMPAIGNS = [
        'cyt_launch', 'cyt_reddit', 'copy_youtube_transcript', 'reddit_transcript',
        'gsb_launch', 'gsb_reddit', 'gemini_speed_booster', 'reddit_gemini',
        'bulk_delete_launch', 'bulk_delete_reddit', 'gemini_bulk_delete',
        'toolbox_launch', 'toolbox_reddit', 'gemini_toolbox', 'website_growth', 'transcript_growth'
    ];

    function fixedPath(pathname) {
        if (typeof pathname !== 'string') return null;
        var path = pathname.replace(/\/$/, '').replace(/\.html$/, '');
        if (!path || path === '/index') path = '/';
        if (path === '/blog/index') path = '/blog';
        return Object.prototype.hasOwnProperty.call(PAGES, path) ? path : null;
    }

    function allowedValue(value, values) {
        return typeof value === 'string' && values.indexOf(value) !== -1 ? value : '';
    }

    function cleanCampaign(params) {
        var campaign = {};
        var source = allowedValue(params.get('utm_source'), SOURCES);
        var medium = allowedValue(params.get('utm_medium'), MEDIA);
        var name = allowedValue(params.get('utm_campaign'), CAMPAIGNS);
        if (source) campaign.utm_source = source;
        if (medium) campaign.utm_medium = medium;
        if (name) campaign.utm_campaign = name;
        return campaign;
    }

    function cleanReferrer(raw) {
        if (!raw) return '';
        try {
            var url = new URL(raw);
            if (!/^https?:$/.test(url.protocol) || url.username || url.password || HOSTS.indexOf(url.hostname) !== -1) return '';
            // An origin identifies the source without sending paths, queries or private IDs.
            return url.origin + '/';
        } catch (_) { return ''; }
    }

    function pageLocation(path, campaign) {
        var url = new URL('https://browserlab.io' + path);
        ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
            if (campaign[key]) url.searchParams.set(key, campaign[key]);
        });
        return url.href;
    }

    function storeDetails(href) {
        try {
            var url = new URL(href);
            if (url.protocol !== 'https:' || url.hostname !== 'chromewebstore.google.com' || url.port || url.username || url.password) return null;
            var match = url.pathname.match(/^\/detail\/[^/]+\/([a-p]{32})\/?$/);
            if (!match || !Object.prototype.hasOwnProperty.call(EXTENSIONS, match[1])) return null;
            var slug = EXTENSIONS[match[1]];
            return {
                extension: slug,
                // Use our fixed slug and ID, never link text or an arbitrary path/query.
                link_url: 'https://chromewebstore.google.com/detail/' + slug + '/' + match[1],
                store_campaign: allowedValue(url.searchParams.get('utm_campaign'), STORE_CAMPAIGNS) || 'untagged',
                cta_placement: allowedValue(url.searchParams.get('utm_content'), PLACEMENTS) || 'unspecified'
            };
        } catch (_) { return null; }
    }

    function createAnalytics(win, options) {
        options = options || {};
        var id = options.measurementId || MEASUREMENT_ID;
        var doc = win.document;
        var now = options.now || function () { return Date.now(); };
        var path = fixedPath(win.location.pathname);
        var production = win.location.protocol === 'https:' && HOSTS.indexOf(win.location.hostname) !== -1 && !win.location.port;
        var configured = /^G-[A-Z0-9]{4,}$/.test(id);
        var eligible = production && configured && !!path;
        var gpc = !!(win.navigator && win.navigator.globalPrivacyControl === true);
        var prefix = 'bl_site_' + id.slice(2);
        var disabledKey = 'ga-disable-' + id;
        var allowed = false;
        var mounted = false;
        var tagInitialized = false;
        var tagLoaded = false;
        var pageViewed = false;
        var script = null;
        var panel, preferenceButton, description;

        function storageRead(type, key) {
            try { return win[type].getItem(key); } catch (_) { return null; }
        }
        function storageWrite(type, key, value) {
            try { win[type].setItem(key, value); return true; } catch (_) { return false; }
        }
        function storageRemove(type, key) {
            try { win[type].removeItem(key); } catch (_) { /* Storage can be unavailable. */ }
        }
        function readPreference() {
            try {
                var pref = JSON.parse(storageRead('localStorage', PREFERENCE_KEY));
                if (!pref || pref.version !== 1 || ['allowed', 'denied'].indexOf(pref.analytics) === -1) return null;
                // A newly enabled browser privacy signal overrides an earlier ordinary Allow.
                if (gpc && pref.analytics === 'allowed' && pref.gpcAcknowledged !== true) return null;
                return pref.analytics;
            } catch (_) { return null; }
        }
        function currentLanding() {
            var campaign = {};
            try { campaign = cleanCampaign(new URL(win.location.href).searchParams); } catch (_) { /* No campaign. */ }
            return { version: 1, landingPath: path, referrer: cleanReferrer(doc.referrer), campaign: campaign, lastSeen: now() };
        }
        function storedLanding() {
            try {
                var entry = JSON.parse(storageRead('sessionStorage', LANDING_KEY));
                if (!entry || entry.version !== 1 || !fixedPath(entry.landingPath) || !Number.isFinite(entry.lastSeen) || entry.lastSeen > now() || now() - entry.lastSeen > SESSION_TIMEOUT) return null;
                // Re-sanitize storage; never trust strings another script might have written.
                var campaign = cleanCampaign(new URLSearchParams(entry.campaign || {}));
                return { version: 1, landingPath: fixedPath(entry.landingPath), referrer: cleanReferrer(entry.referrer), campaign: campaign, lastSeen: now() };
            } catch (_) { return null; }
        }
        var preference = readPreference();
        // Before Allow this context stays in memory; no attribution is persisted.
        var landing = (preference === 'allowed' && storedLanding()) || currentLanding();

        function persistLanding() {
            landing.lastSeen = now();
            storageWrite('sessionStorage', LANDING_KEY, JSON.stringify(landing));
        }
        function gtag() {
            if (!win[DATA_LAYER]) win[DATA_LAYER] = [];
            win[DATA_LAYER].push(arguments);
        }
        function consent(analytics) {
            return { analytics_storage: analytics, ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
        }
        function pageFields() {
            return {
                send_to: id,
                page_path: path,
                page_title: PAGES[path],
                page_location: pageLocation(path, landing.campaign),
                page_referrer: landing.referrer,
                landing_page: landing.landingPath
            };
        }
        function sendEvent(name, fields) {
            if (!allowed || !eligible || win[disabledKey]) return;
            try {
                persistLanding();
                gtag('event', name, Object.assign(pageFields(), fields || {}));
            } catch (_) { /* Blocking analytics must never interrupt the page or a link. */ }
        }
        function start() {
            allowed = true;
            if (!eligible) return;
            win[disabledKey] = false;
            try {
                persistLanding();
                if (!tagInitialized) {
                    gtag('consent', 'default', consent('denied'));
                    gtag('js', new Date(now()));
                }
                gtag('consent', 'update', consent('granted'));
                gtag('config', id, Object.assign(pageFields(), {
                    send_page_view: false,
                    allow_google_signals: false,
                    allow_ad_personalization_signals: false,
                    cookie_prefix: prefix,
                    cookie_domain: 'none',
                    cookie_path: '/',
                    cookie_expires: 60 * 60 * 24 * 365,
                    cookie_flags: 'SameSite=Lax;Secure'
                }));
                if (!tagInitialized) {
                    script = doc.createElement('script');
                    script.async = true;
                    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id + '&l=' + DATA_LAYER;
                    // Do not disclose the real page URL (including its query) as an HTTP referrer.
                    script.referrerPolicy = 'no-referrer';
                    script.onload = function () { tagLoaded = true; };
                    script.onerror = function () { /* Ad blockers and connection failures are harmless. */ };
                    tagInitialized = true;
                    doc.head.appendChild(script);
                }
                if (!pageViewed) { pageViewed = true; sendEvent('page_view'); }
            } catch (_) { /* Google or storage failure must not affect core functionality. */ }
        }
        function clearCookies() {
            try {
                var names = doc.cookie.split(';').map(function (item) { return item.trim().split('=')[0]; }).filter(function (name) {
                    return name.indexOf(prefix + '_') === 0 || name.indexOf('_' + prefix + '_') === 0;
                });
                // Include expected names even when no visible cookie list is available.
                names.push(prefix + '_ga', prefix + '_ga_' + id.slice(2));
                var domains = ['', win.location.hostname, '.' + win.location.hostname, 'browserlab.io', '.browserlab.io'];
                names.forEach(function (name) {
                    if (!/^[A-Za-z0-9_]+$/.test(name)) return;
                    domains.forEach(function (domain) {
                        doc.cookie = name + '=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure' + (domain ? '; Domain=' + domain : '');
                    });
                });
            } catch (_) { /* Cookie access can be blocked. */ }
        }
        function stop() {
            allowed = false;
            // Google's documented disable switch blocks hits, including any tag-owned timers.
            win[disabledKey] = true;
            pageViewed = false;
            storageRemove('sessionStorage', LANDING_KEY);
            if (win[DATA_LAYER]) win[DATA_LAYER].length = 0;
            // No consent-update ping is sent after withdrawal. The stream is disabled locally.
            if (script && !tagLoaded) {
                script.remove();
                script = null;
                tagInitialized = false;
            }
            clearCookies();
            landing = currentLanding();
        }

        function updateUi() {
            if (!panel) return;
            panel.hidden = preference !== null;
            preferenceButton.hidden = preference === null;
            preferenceButton.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
            preferenceButton.setAttribute('aria-label', 'Analytics preferences, currently ' + (allowed ? 'on' : 'off'));
            description.textContent = gpc && preference === null
                ? 'Your browser’s privacy preference keeps analytics off. You can choose to allow Google Analytics to measure visits and extension store clicks. We never send transcript or form text. '
                : 'Allow Google Analytics to measure visits and extension store clicks? Analytics stay off until you choose. We never send transcript or form text. ';
        }
        function choose(value) {
            var hadFocus = panel && panel.contains(doc.activeElement);
            preference = value === 'allowed' ? 'allowed' : 'denied';
            var saved = storageWrite('localStorage', PREFERENCE_KEY, JSON.stringify({ version: 1, analytics: preference, gpcAcknowledged: gpc && preference === 'allowed' }));
            // If writes fail (for example storage is full), do not leave an old Allow behind.
            if (!saved && preference === 'denied') storageRemove('localStorage', PREFERENCE_KEY);
            if (preference === 'allowed') { if (!allowed) start(); }
            else stop();
            updateUi();
            if (hadFocus) preferenceButton.focus({ preventScroll: true });
        }
        function buildUi() {
            panel = doc.createElement('section');
            panel.className = 'bl-analytics-consent';
            panel.id = 'bl-analytics-consent';
            panel.setAttribute('aria-labelledby', 'bl-analytics-title');
            var inner = doc.createElement('div');
            inner.className = 'bl-analytics-consent-inner';
            var copy = doc.createElement('div');
            copy.className = 'bl-analytics-copy';
            var heading = doc.createElement('h2');
            heading.id = 'bl-analytics-title';
            heading.textContent = 'Help us improve BrowserLab';
            var paragraph = doc.createElement('p');
            description = doc.createElement('span');
            var privacy = doc.createElement('a');
            privacy.href = '/privacy#website-analytics';
            privacy.textContent = 'Privacy';
            paragraph.appendChild(description);
            paragraph.appendChild(privacy);
            copy.appendChild(heading);
            copy.appendChild(paragraph);
            var actions = doc.createElement('div');
            actions.className = 'bl-analytics-actions';
            var allowButton = doc.createElement('button');
            allowButton.type = 'button';
            allowButton.className = 'bl-analytics-button';
            allowButton.textContent = 'Allow analytics';
            allowButton.addEventListener('click', function () { choose('allowed'); });
            var denyButton = doc.createElement('button');
            denyButton.type = 'button';
            denyButton.className = 'bl-analytics-button';
            denyButton.textContent = 'No thanks';
            denyButton.addEventListener('click', function () { choose('denied'); });
            actions.appendChild(allowButton);
            actions.appendChild(denyButton);
            inner.appendChild(copy);
            inner.appendChild(actions);
            panel.appendChild(inner);
            var main = doc.querySelector('main');
            if (main && main.parentNode === doc.body) doc.body.insertBefore(panel, main);
            else doc.body.insertBefore(panel, doc.body.firstChild);
            var preferenceBar = doc.createElement('div');
            preferenceBar.className = 'bl-analytics-preferences';
            preferenceButton = doc.createElement('button');
            preferenceButton.type = 'button';
            preferenceButton.className = 'bl-analytics-preference-button';
            preferenceButton.textContent = 'Analytics preferences';
            preferenceButton.setAttribute('aria-controls', panel.id);
            preferenceButton.addEventListener('click', function () {
                // Reopening the controls does not itself change the existing choice.
                panel.hidden = false;
                preferenceButton.setAttribute('aria-expanded', 'true');
                allowButton.focus();
                panel.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            });
            preferenceBar.appendChild(preferenceButton);
            doc.body.appendChild(preferenceBar);
            updateUi();
        }
        function onStoreClick(event) {
            if (!allowed || !eligible) return;
            try {
                var target = event.target;
                if (target && target.nodeType !== 1) target = target.parentElement;
                var link = target && target.closest('a[href]');
                if (!link) return;
                var details = storeDetails(link.href);
                if (details) sendEvent('store_click', details);
            } catch (_) { /* The original link navigation remains untouched. */ }
        }
        function mount() {
            if (mounted || !doc.body) return;
            mounted = true;
            buildUi();
            // Merely loading this script, or rejecting analytics, makes no Google requests.
            if (preference === 'allowed') start();
            else win[disabledKey] = true;
            doc.addEventListener('click', onStoreClick);
            win.addEventListener('storage', function (event) {
                if (event.key !== PREFERENCE_KEY && event.key !== null) return;
                preference = readPreference();
                if (preference === 'allowed') { if (!allowed) start(); }
                else stop();
                updateUi();
            });
        }
        return { mount: mount, choose: choose, isAllowed: function () { return allowed; } };
    }

    return {
        createAnalytics: createAnalytics,
        fixedPath: fixedPath,
        cleanReferrer: cleanReferrer,
        cleanCampaign: cleanCampaign,
        storeDetails: storeDetails,
        preferenceKey: PREFERENCE_KEY,
        landingKey: LANDING_KEY,
        dataLayerName: DATA_LAYER
    };
}));
