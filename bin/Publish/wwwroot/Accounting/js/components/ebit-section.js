class EbitDiv extends HTMLElement {
    constructor() {
        super();
        this.applyStyles();
    }

    static get observedAttributes() {
        return [
            'mb', 'mt', 'ml', 'mr', 'ms', 'me', 'mx', 'my',
            'pb', 'pt', 'pl', 'pr', 'ps', 'pe', 'px', 'py', 'p',
            'bg', 'text', 'border', 'rounded', 'shadow', 'visible',
            'flex', 'justify', 'align', 'gap', 'wrap', 'direction'
        ];
    }

    attributeChangedCallback() {
        this.applyStyles();
    }

    applyStyles() {
        const el = this;
        const cls = [];

        // Margin
        ['mb', 'mt', 'ml', 'mr', 'ms', 'me', 'mx', 'my'].forEach(m => {
            if (el.hasAttribute(m)) cls.push(`${m}-${el.getAttribute(m)}`);
        });

        // Padding
        ['pb', 'pt', 'pl', 'pr', 'ps', 'pe', 'px', 'py'].forEach(p => {
            if (el.hasAttribute(p)) cls.push(`${p}-${el.getAttribute(p)}`);
        });
        if (el.hasAttribute('p')) cls.push(`p-${el.getAttribute('p')}`);

        // Background & Text
        if (el.hasAttribute('bg')) cls.push(`bg-${el.getAttribute('bg')}`);
        if (el.hasAttribute('text')) cls.push(`text-${el.getAttribute('text')}`);

        // Border
        if (el.hasAttribute('border')) {
            const val = el.getAttribute('border');
            if (val === '' || val === 'true') cls.push('border');
            else cls.push(`border-${val}`);
        }

        // Rounded
        if (el.hasAttribute('rounded')) {
            const val = el.getAttribute('rounded');
            cls.push(val === 'true' || val === '' ? 'rounded' : `rounded-${val}`);
        }

        // Shadow
        if (el.hasAttribute('shadow')) {
            const val = el.getAttribute('shadow');
            cls.push(val === 'true' || val === '' ? 'shadow-sm' : `shadow-${val}`);
        }

        // Flexbox
        if (el.hasAttribute('flex')) cls.push('d-flex');
        if (el.hasAttribute('justify')) cls.push(`justify-content-${el.getAttribute('justify')}`);
        if (el.hasAttribute('align')) cls.push(`align-items-${el.getAttribute('align')}`);
        if (el.hasAttribute('gap')) cls.push(`gap-${el.getAttribute('gap')}`);
        if (el.hasAttribute('wrap')) cls.push('flex-wrap');
        if (el.hasAttribute('direction')) cls.push(`flex-${el.getAttribute('direction')}`);

        // Visibility
        if (el.getAttribute('visible') === 'false') {
            el.style.display = 'none';
        } else {
            el.style.display = '';
        }

        // Remove previous ebit classes
        el.classList.forEach(c => {
            if (/^(mb|mt|ml|mr|ms|me|mx|my|pb|pt|pl|pr|ps|pe|px|py|p|bg|text|border|rounded|shadow|d-flex|justify|align|gap|flex)-/.test(c)) {
                el.classList.remove(c);
            }
        });

        // Add new ones
        if (cls.length > 0) el.classList.add(...cls);
    }

    // Helper
    getAttr(name, defaultValue = null) {
        return this.hasAttribute(name) ? this.getAttribute(name) : defaultValue;
    }
}

if (!customElements.get('ebit-div')) {
    customElements.define('ebit-div', EbitDiv);
}
