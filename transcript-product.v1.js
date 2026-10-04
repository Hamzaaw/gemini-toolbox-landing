// Progressive enhancement: both original examples remain visible without JavaScript.
(() => {
    const controls = document.querySelector('.transcript-example-controls');
    if (!controls) return;

    const buttons = Array.from(controls.querySelectorAll('[data-example-format]'));
    const examples = {
        clean: document.getElementById('example-clean'),
        timestamps: document.getElementById('example-timestamps')
    };
    if (!examples.clean || !examples.timestamps) return;

    function showExample(format) {
        for (const [name, example] of Object.entries(examples)) {
            example.hidden = name !== format;
        }
        for (const button of buttons) {
            button.setAttribute('aria-pressed', String(button.dataset.exampleFormat === format));
        }
    }

    for (const button of buttons) {
        button.addEventListener('click', () => showExample(button.dataset.exampleFormat));
    }
    showExample('clean');
    controls.hidden = false;
})();
