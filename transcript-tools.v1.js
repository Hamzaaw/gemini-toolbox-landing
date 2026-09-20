(function () {
    'use strict';

    // Only remove timestamp prefixes/standalone lines, never times inside speech.
    // SRT/VTT time ranges are deliberately left intact; this tool accepts plain text.
    function cleanTimestamps(text) {
        const time = '(?:\\d{1,3}:[0-5]\\d:[0-5]\\d|\\d{1,3}:[0-5]\\d)';
        const prefix = new RegExp('^\\s*(?:\\[' + time + '\\]|\\(' + time + '\\)|' + time + ')(?:[\\t ]+|$)');
        let removed = 0;
        const lines = String(text).replace(/\r\n?/g, '\n').split('\n').map(line => {
            if (line.includes('-->')) return line;
            const match = line.match(prefix);
            if (!match) return line;
            removed += 1;
            return line.slice(match[0].length);
        });
        return { text: lines.filter(line => line.trim()).join('\n'), removed };
    }

    if (typeof module !== 'undefined' && module.exports) module.exports = { cleanTimestamps };
    if (typeof document === 'undefined') return;

    const input = document.querySelector('#transcript-input');
    const output = document.querySelector('#transcript-output');
    const status = document.querySelector('#cleaner-status');
    const copy = document.querySelector('#copy-cleaned');
    if (input && output && status && copy) {
        const update = () => {
            const result = cleanTimestamps(input.value);
            output.value = result.text;
            copy.disabled = !result.text.trim();
            status.textContent = !input.value.trim() ? 'Paste a transcript or try the example.' :
                result.removed ? `Removed ${result.removed} timestamp${result.removed === 1 ? '' : 's'}. Check the result before copying.` :
                'No leading timestamps found. Your words are unchanged; empty lines are removed.';
        };
        input.addEventListener('input', update);
        document.querySelector('#cleaner-example').addEventListener('click', () => {
            input.value = '0:00\nWelcome to this example.\n0:04\nFirst, choose the text you need.\n[0:09] Then copy it into your notes.\n(0:14) The meeting starts at 12:30 tomorrow.';
            update();
            input.focus();
        });
        copy.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(output.value);
                status.textContent = 'Cleaned transcript copied.';
            } catch {
                output.focus();
                output.select();
                status.textContent = 'Copy access is unavailable. The result is selected: press Ctrl+C or Command+C to copy.';
            }
        });
        update();
    }

    document.querySelectorAll('[data-copy-prompt]').forEach(button => {
        button.addEventListener('click', async () => {
            const prompt = document.getElementById(button.dataset.copyPrompt);
            const message = document.getElementById(button.getAttribute('aria-describedby'));
            try {
                await navigator.clipboard.writeText(prompt.textContent);
                message.textContent = 'Prompt copied. Paste it into your AI chat, then add your transcript.';
            } catch {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(prompt);
                selection.removeAllRanges();
                selection.addRange(range);
                message.textContent = 'Copy access is unavailable. The prompt is selected: press Ctrl+C or Command+C.';
            }
        });
    });
})();
