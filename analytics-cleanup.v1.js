/* Retire the old website analytics without prompts, tracking or new storage. */
(function (root, factory) {
    'use strict';
    var cleanup = factory();
    if (typeof module === 'object' && module.exports) module.exports = cleanup;
    else if (root) cleanup(root);
}(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    return function cleanupAnalytics(win) {
        try { win['ga-disable-G-GF94WRMX1Y'] = true; } catch (_) { /* A locked global must not break the page. */ }
        try {
            // Leave all other data layers alone; never create a replacement queue.
            if (Array.isArray(win.browserlabAnalyticsData)) win.browserlabAnalyticsData.length = 0;
        } catch (_) { /* The old queue can be unavailable. */ }
        try { win.localStorage.removeItem('browserlab.analytics.preference.v1'); } catch (_) { /* Storage can be denied. */ }
        try { win.sessionStorage.removeItem('browserlab.analytics.landing.v1'); } catch (_) { /* Storage can be denied. */ }

        var prefix = 'bl_site_GF94WRMX1Y';
        var names = [prefix + '_ga', prefix + '_ga_GF94WRMX1Y', '_' + prefix + '_ga', '_' + prefix + '_ga_GF94WRMX1Y'];
        try {
            win.document.cookie.split(';').forEach(function (item) {
                var name = item.trim().split('=')[0];
                if (/^_?bl_site_GF94WRMX1Y_ga(?:_[A-Za-z0-9_]+)?$/.test(name) && names.indexOf(name) === -1) names.push(name);
            });
        } catch (_) { /* Expected cookie names can still be expired when reading is denied. */ }
        var domains = [''];
        try {
            var hostname = win.location.hostname;
            if (hostname === 'browserlab.io' || hostname === 'www.browserlab.io') {
                domains.push(hostname, '.' + hostname);
                if (hostname !== 'browserlab.io') domains.push('browserlab.io', '.browserlab.io');
            }
        } catch (_) { /* A host-only expiration is sufficient as a fallback. */ }
        names.forEach(function (name) {
            domains.forEach(function (domain) {
                try {
                    win.document.cookie = name + '=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure' + (domain ? '; Domain=' + domain : '');
                } catch (_) { /* Cookie deletion can also be denied. */ }
            });
        });
    };
}));
