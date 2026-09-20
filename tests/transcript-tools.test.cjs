const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cleanTimestamps } = require('../transcript-tools.v1.js');

test('cleans standalone YouTube timestamp lines and preserves caption order', () => {
    assert.deepEqual(cleanTimestamps('0:00\nHello\n0:05\nWorld'), { text: 'Hello\nWorld', removed: 2 });
});
test('accepts inline, bracketed and parenthesized timestamps, including hours', () => {
    assert.deepEqual(cleanTimestamps('0:03 Intro\n[12:34] Detail\n(1:02:03) Ending'),
        { text: 'Intro\nDetail\nEnding', removed: 3 });
});
test('preserves times and numbers inside spoken text', () => {
    assert.deepEqual(cleanTimestamps('The meeting is at 12:30.\nThe ratio is 2:1.\n2026 was a year.'),
        { text: 'The meeting is at 12:30.\nThe ratio is 2:1.\n2026 was a year.', removed: 0 });
});
test('does not partially strip malformed times or attached words', () => {
    const text = '1:99 Invalid\n1:999:59 Invalid\n12:345 Invalid\n0:05seconds\n[0:10 unfinished';
    assert.deepEqual(cleanTimestamps(text), { text, removed: 0 });
});
test('preserves SRT/VTT time range lines', () => {
    const text = '1\n00:00:03,000 --> 00:00:05,000\nHello';
    assert.deepEqual(cleanTimestamps(text), { text, removed: 0 });
});
test('normalizes Windows line endings and retains Unicode text', () => {
    assert.deepEqual(cleanTimestamps('[0:03]\r\nこんにちは\r\n\r\n(0:06) مرحبا'),
        { text: 'こんにちは\nمرحبا', removed: 2 });
});
test('empty input and timestamp-only input produce empty output', () => {
    assert.deepEqual(cleanTimestamps(''), { text: '', removed: 0 });
    assert.deepEqual(cleanTimestamps('0:00\n[0:04]'), { text: '', removed: 2 });
});
test('treats HTML-looking transcript content as plain text', () => {
    assert.deepEqual(cleanTimestamps('0:00 <img src=x onerror=alert(1)>'),
        { text: '<img src=x onerror=alert(1)>', removed: 1 });
});
