# Copy YouTube Transcript: first search acquisition pilot

## Pages and measurement

| Page | Store campaign |
|---|---|
| `/transcript-for-youtube` | `cyt_pilot_product` |
| `/blog/youtube-shorts-transcript` | `cyt_pilot_shorts` |
| `/blog/copy-youtube-transcript-without-timestamps` | `cyt_pilot_clean-text` |
| `/blog/youtube-transcript-for-chatgpt` | `cyt_pilot_ai-workflow` |

All install links use `utm_source=browserlab.io` and `utm_medium=referral`. They work with JavaScript disabled. `utm_content` distinguishes link placement, but page identification relies on the campaign field documented by Chrome. In the extension's Google Analytics property, inspect Session campaign and the `install` event. Allow 24–48 hours for finalized attribution. [Chrome documentation](https://developer.chrome.com/docs/webstore/google-analytics).

These tags measure store visits and installs attributed to a website page. They **do not establish that Google originally sent the visitor**, uniquely identify a person, establish retention, or prove an incremental install. Reddit can send someone to the same page. A tag can also survive sharing or further store navigation.

At the September 20 launch, no website GA4 measurement ID was present in the repository or supplied. That release added no analytics SDK, cookies, visitor IDs, or custom website events. The October 5 website measurement setup below supersedes that limitation. Store properties remain separate. The timestamp cleaner handles text in the browser without sending or persisting it.

## Release checklist

- Review the draft PR and Vercel preview before merging. The production branch/deployment connection must be confirmed before release.
- Confirm the four clean routes and their `.html` redirects on the deployed host, then inspect the new URLs in Search Console and submit/check the updated sitemap. A sitemap does not guarantee indexing.
- Check a tagged store journey and confirm the campaign appears after the reporting delay. Do not count a QA install as organic growth; record the time/campaign if an install test is performed.
- Record the launch date and an immediately preceding 28-day baseline in the private acquisition report. Keep account analytics exports and business metrics outside this public repository. Different periods and changing traffic require caution.
- At week 2, check indexing and errors. At week 6, inspect nonbrand query impressions and clicks by new page. At week 12, compare attributed installs, total install trends, and effort spent. These are review intervals, not promises of search results.
- Website measurement was added October 5 as documented below. Never send pasted transcript text or AI prompts as analytics parameters.

## Content evidence and maintenance

- Chrome Web Store snapshot checked September 20, 2026: 40,000 users, 4.6 rating, 149 ratings, version 1.6.0. Visible proof and SoftwareApplication schema use the same values. Refresh both together. [Listing](https://chromewebstore.google.com/detail/copy-youtube-transcript/mpfdnefhgmjlbkphfpkiicdaegfanbab).
- Free/Pro feature descriptions were checked against local v1.6.0 `pro-features.js`, formatting code and popup labels. They avoid promising audio transcription when captions are absent.
- Existing product screenshots are reused, with captions noting that layouts can vary by version. They have not been presented as newly captured UI.
- YouTube's [transcript help](https://support.google.com/youtube/answer/15930243?hl=en) supports the manual transcript instructions. No fixed AI model input limits are advertised.
- New content has Article and BreadcrumbList data, canonical URLs, internal links and sitemap entries. Existing `llms.txt` facts are corrected for consistency; this is not a claim that the file improves Google rankings.
- Transcript pages link to this extension's workflows rather than promoting Gemini products.

## Local verification

Run `python3 scripts/preview.py` and open `http://127.0.0.1:8787/transcript-for-youtube`. The preview supports the repository's explicit clean-URL rewrites, path redirects and security headers. It is not a full Vercel emulator.

Run `node --test tests/*.test.cjs` for the timestamp cleaner and service-worker regression checks. The cleaner supports plain transcript timestamps, not subtitle-file conversion. A spoken time at the beginning of a line can look like a timestamp; the UI asks users to review output. Clipboard-denied environments receive selection/manual-copy fallback instructions.

New CSS/JS assets use `.v1` filenames because the site serves assets with immutable caching. Bump the asset filename when changing an already deployed version. HTML navigation in the service worker uses network-first with offline fallback so returning visitors can receive updated content.

## Gemini Speed Booster addition

The homepage also links to `/gemini-speed-booster`. Its two store links use `utm_campaign=gsb_product`, with `utm_content=hero` or `bottom` and the same source/medium convention above. Reporting requires the Speed Booster extension's own connected store analytics property; the Copy YouTube Transcript property will not report these installs.

Copy was checked against the [Speed Booster store listing](https://chromewebstore.google.com/detail/gemini-speed-booster/nhcnngifihnlimjkaogmgeomnbndekhf) on September 20, 2026 (version 0.3.3). It describes browser rendering improvements, not faster AI generation. The supplied logo is used unchanged. No unverified speed benchmarks or review statistics are displayed. Include this clean route and its `.html` redirect in deployment checks.

The linked troubleshooting guide at `/blog/gemini-slow-long-chats` uses `gsb_guide_long-chats` with `steps`, `demo` and `bottom` placements. It separates interface lag from generation delays, includes an informal same-conversation comparison, and cites official Chrome performance and Memory Saver documentation. No measured speed improvement is claimed. Include its clean route, `.html` redirect and sitemap entry in release checks.

## Gemini guide control walkthrough (October 1, 2026)

The guide now includes `images/gemini-speed-booster-controls.v1.png`, an unchanged copy of the existing light popup preview. The original release-asset renderer uses the extension popup HTML with a mocked Chrome status response (246 total messages, 182 optimized). The visible caption explicitly identifies these as example counts, not a performance benchmark. The screenshot contains no customer conversation.

Control labels and behavior were checked against the local v0.3.3 release source: the main toggle enables optimization; Show full chat restores rendering for the session; Rescan this chat clears that restoration state and reapplies optimization. The new install button retains the existing page campaign with `utm_content=demo`. The page title, canonical URL and search description are unchanged. This is an illustrated walkthrough, not a recorded before/after performance test.

## Product and cleanup guide refresh (October 4, 2026)

The Copy YouTube Transcript product page now shows an original sample in clean-text and timestamped formats beside the primary install button. Both samples are present in the HTML; the small `transcript-product.v1.js` enhancement switches the visible format when JavaScript is available. The product title, canonical URL and `cyt_pilot_product` campaign remain unchanged. A direct link from the hero and homepage leads to the existing timestamp cleaner. No transcript input, visitor identifier or additional analytics SDK is collected.

The homepage description now covers YouTube and Gemini and links directly to transcript copying and the free cleaner. These internal links do not use campaign parameters, so they do not overwrite inbound attribution.

The bulk-delete guide now distinguishes selected-chat deletion through the extension from all-activity or date-range deletion through Google's native controls. Its title and description reflect both tasks. Exact speed comparisons and unsupported unlimited/free claims were removed. The Article modification date, visible update date, blog card and sitemap agree. The existing canonical is preserved; the `.html` URL redirects to it with query parameters retained. Visible store links use `utm_source=browserlab.io`, `utm_medium=referral`, and `utm_campaign=bulk_delete_guide`, with a placement-specific `utm_content`. These installs belong to the Bulk Delete extension's own store analytics property.

Sources checked October 4: [Google's personal-account Gemini Apps Activity guidance](https://support.google.com/gemini/answer/13278892?hl=en) and the [Gemini Bulk Delete listing](https://chromewebstore.google.com/detail/gemini-bulk-delete/bdbdcppgiiidaolmadifdlceedoojpfh). The listing describes multi-select, Select All with auto-scroll, and Delete Selected; it lists in-app purchases. No free quota, performance benchmark or guarantee is inferred from it.

Keep the October 4 search and campaign baseline in the private acquisition records outside this repository. Compare later complete reporting windows for the transcript page, cleaner and bulk-delete guide. Record this release as several coordinated changes, not an isolated A/B test. The Gemini lag guide and its October 1 walkthrough are unchanged. More impressions and installs are the objectives, not guaranteed outcomes.

## Bulk Delete product attribution (October 5, 2026)

The four store links on `/bulk-delete-for-gemini` now use the same `browserlab.io` source and `referral` medium as the guide:

| Destination | Store campaign | Placements (`utm_content`) |
|---|---|---|
| Gemini Bulk Delete | `bulk_delete_product` | `hero`, `upgrade-current` |
| Toolbox for Gemini | `bulk_delete_product_toolbox` | `upgrade`, `bottom` |

Read each campaign in its destination extension's own store analytics property. The guide's direct store links retain `bulk_delete_guide`. Product campaigns identify the page with the store link; they do not establish an earlier guide visit. The website setup below measures consenting visitors' landing pages and store clicks separately from actual store installations.

## Website source and click measurement (October 5, 2026)

The main website uses its own GA4 web stream (`G-GF94WRMX1Y`) in the BrowserLab website property. It is independent of all Chrome Web Store and other BrowserLab website properties. New website data starts with this release; prior inbound website sources cannot be reconstructed from it.

`site-analytics.v1.js` is included once on every HTML document. Google is loaded only after the visitor allows analytics, and only on the production website. Declining, an ad blocker, offline use, or a failed script must not change page functionality. A visitor can change their choice through Analytics preferences. Advertising consent remains denied, Google advertising signals are disabled, and the stream's enhanced measurement is off.

| Website event | Purpose | Controlled fields |
|---|---|---|
| `page_view` | Count measured visits by source and page | Fixed page path/title, sanitized page location/referrer, first landing page |
| `store_click` | Count clicks to a known extension listing | Extension slug, clean store URL, approved store campaign and placement, page fields |

These clicks are **not installs**. Use website acquisition/landing-page reports for original traffic and click behavior, and each destination's store reports for the `install` event. The two properties cannot identify the same person or join the complete journey. Consenting visitors are a measured subset of website traffic; do not treat a missing event as proof of no visit or install.

The module uses reviewed source, medium, and campaign values, drops all other URL query/hash values, and never reads pasted transcripts, form fields, prompts or clipboard contents. First-page context stays in memory until consent; then a sanitized record is kept in session storage with a 30-minute inactivity limit. The preference uses local storage. Revoking consent stops measurement and removes the session record and this stream's prefixed cookies.

For a Reddit link to the transcript page, use `https://browserlab.io/transcript-for-youtube?utm_source=reddit&utm_medium=social&utm_campaign=cyt_reddit`. Reviewed launch campaigns also include `gsb_reddit`, `bulk_delete_reddit`, and `toolbox_reddit`. Review and add any new campaign value to the module before using it; arbitrary UTM values are intentionally discarded. Preserve all outgoing store campaign tags.

Validate consent before/after Allow, withdrawal, source sanitization, cleaner behavior and mobile layout before release. Use the documented no-advertising [Google CSP origins](https://developers.google.com/tag-platform/security/guides/csp) and [consent configuration](https://developers.google.com/tag-platform/security/guides/consent). Keep account exports and QA timestamps in the private growth records.
