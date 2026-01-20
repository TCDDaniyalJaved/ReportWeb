class EbitSection extends HTMLElement {
    constructor() {
        super();
        //this.applyStyles();
    }

    static get observedAttributes() {
        return [
            'm', 'mx', 'my', 'mt', 'mb', 'ms', 'me',
            'p', 'px', 'py', 'pt', 'pb', 'ps', 'pe',
            'bg', 'text', 'rounded', 'shadow', 'border',
            'flex', 'justify', 'align', 'gap', 'wrap', 'direction'
        ];
    }

    attributeChangedCallback() {
        this.applyStyles();
    }

    applyStyles() {
        const el = this;
        const cls = [];

        // -------------------------
        // MARGIN ATTRIBUTES
        // -------------------------
        const marginList = ['m', 'mx', 'my', 'mt', 'mb', 'ms', 'me'];
        marginList.forEach(a => {
            if (el.hasAttribute(a)) {
                cls.push(`${a}-${el.getAttribute(a)}`);
            }
        });

        // -------------------------
        // PADDING ATTRIBUTES
        // -------------------------
        const paddingList = ['p', 'px', 'py', 'pt', 'pb', 'ps', 'pe'];
        paddingList.forEach(a => {
            if (el.hasAttribute(a)) {
                cls.push(`${a}-${el.getAttribute(a)}`);
            }
        });

        // -------------------------
        // COLORS
        // -------------------------
        if (el.hasAttribute('bg')) cls.push(`bg-${el.getAttribute('bg')}`);
        if (el.hasAttribute('text')) cls.push(`text-${el.getAttribute('text')}`);

        // -------------------------
        // BORDER
        // -------------------------
        if (el.hasAttribute('border')) {
            const v = el.getAttribute('border');
            cls.push(v === "" ? "border" : `border-${v}`);
        }

        // -------------------------
        // ROUNDED
        // -------------------------
        if (el.hasAttribute('rounded')) {
            const v = el.getAttribute('rounded');
            cls.push(v === "" ? "rounded" : `rounded-${v}`);
        }

        // -------------------------
        // SHADOW
        // -------------------------
        if (el.hasAttribute('shadow')) {
            const v = el.getAttribute('shadow');
            cls.push(v === "" ? "shadow" : `shadow-${v}`);
        }

        // -------------------------
        // FLEXBOX SUPPORT
        // -------------------------
        if (el.hasAttribute('flex')) cls.push("d-flex");
        if (el.hasAttribute('justify')) cls.push(`justify-content-${el.getAttribute('justify')}`);
        if (el.hasAttribute('align')) cls.push(`align-items-${el.getAttribute('align')}`);
        if (el.hasAttribute('gap')) cls.push(`gap-${el.getAttribute('gap')}`);
        if (el.hasAttribute('wrap')) cls.push(`flex-wrap`);
        if (el.hasAttribute('direction')) cls.push(`flex-${el.getAttribute('direction')}`);

        // -------------------------
        // REMOVE OLD GENERATED CLASSES
        // -------------------------
        const PREFIXES = [
            'm', 'mx', 'my', 'mt', 'mb', 'ms', 'me',
            'p', 'px', 'py', 'pt', 'pb', 'ps', 'pe',
            'bg', 'text', 'border', 'rounded', 'shadow',
            'd-flex', 'justify-content', 'align-items', 'gap', 'flex'
        ];

        el.classList.forEach(c => {
            for (let p of PREFIXES) {
                if (c.startsWith(p)) {
                    el.classList.remove(c);
                    break;
                }
            }
        });

        // -------------------------
        // APPLY NEW CLASSES
        // -------------------------
        if (cls.length > 0) el.classList.add(...cls);
    }
}

// REGISTER CUSTOM ELEMENT
if (!customElements.get('ebit-section')) {
    customElements.define('ebit-section', EbitSection);
}