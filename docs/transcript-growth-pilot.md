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

No website GA4 measurement ID was present in the repository or supplied for this change. The store property must not be reused as a website property. This release adds no analytics SDK, cookies, visitor IDs, or custom website events. Website visit-to-click conversion rates and original inbound attribution are therefore not yet available. The timestamp cleaner handles text in the browser without sending or persisting it.

## Release checklist

- Review the draft PR and Vercel preview before merging. The production branch/deployment connection must be confirmed before release.
- Confirm the four clean routes and their `.html` redirects on the deployed host, then inspect the new URLs in Search Console and submit/check the updated sitemap. A sitemap does not guarantee indexing.
- Check a tagged store journey and confirm the campaign appears after the reporting delay. Do not count a QA install as organic growth; record the time/campaign if an install test is performed.
- Record the launch date and an immediately preceding 28-day baseline in the private acquisition report. Keep account analytics exports and business metrics outside this public repository. Different periods and changing traffic require caution.
- At week 2, check indexing and errors. At week 6, inspect nonbrand query impressions and clicks by new page. At week 12, compare attributed installs, total install trends, and effort spent. These are review intervals, not promises of search results.
- If a website analytics property is available later, add outbound `store_click` measurement and inbound landing-page/source reporting with appropriate data handling. Never send pasted transcript text or AI prompts as analytics parameters.

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
