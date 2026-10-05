const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
test('every production HTML page has exactly one deferred analytics module and stylesheet', () => {
  const pages = ['.', 'blog'].flatMap(dir => fs.readdirSync(path.join(root, dir))
    .filter(name => name.endsWith('.html')).map(name => path.join(root, dir, name)));
  assert.equal(pages.length, 21);
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const head = html.split('</head>')[0];
    assert.equal((html.match(/src="\/site-analytics\.v1\.js"/g) || []).length, 1, page);
    assert.match(head, /<script src="\/site-analytics\.v1\.js" defer><\/script>/, page);
    assert.equal((html.match(/href="\/site-analytics\.v1\.css"/g) || []).length, 1, page);
    assert.doesNotMatch(html, /gtag\(['"]config/, page);
  }
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const csp = config.headers.flatMap(rule => rule.headers)
    .find(header => header.key === 'Content-Security-Policy').value;
  const connect = csp.split(';').find(directive => directive.trim().startsWith('connect-src'));
  assert.ok(connect.includes('https://*.google-analytics.com'), 'regional GA collectors must be allowed');
});
