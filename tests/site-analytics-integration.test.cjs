const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
test('every page cleans up old analytics without loading its prompt or Google tag', () => {
  const pages = ['.', 'blog'].flatMap(dir => fs.readdirSync(path.join(root, dir))
    .filter(name => name.endsWith('.html')).map(name => path.join(root, dir, name)));
  assert.equal(pages.length, 21);
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const head = html.split('</head>')[0];
    assert.equal((html.match(/src="\/analytics-cleanup\.v1\.js"/g) || []).length, 1, page);
    assert.match(head, /<script src="\/analytics-cleanup\.v1\.js" defer><\/script>/, page);
    assert.doesNotMatch(html, /site-analytics\.v1|googletagmanager\.com|google-analytics\.com|bl-analytics-consent|Analytics preferences|Allow analytics/, page);
    assert.doesNotMatch(html, /gtag\(['"]config/, page);
  }
  assert.equal(fs.existsSync(path.join(root, 'site-analytics.v1.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'site-analytics.v1.css')), false);
});

test('security policy no longer permits Google analytics scripts or collectors', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const csp = config.headers.flatMap(rule => rule.headers)
    .find(header => header.key === 'Content-Security-Policy').value;
  assert.doesNotMatch(csp, /googletagmanager\.com|google-analytics\.com|\*\.google\.com/);
});
