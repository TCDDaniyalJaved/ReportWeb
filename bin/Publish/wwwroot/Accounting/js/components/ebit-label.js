class EbitLabel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // Priority 1: 'text' attribute
        // Priority 2: innerHTML (for <ebit-label>Draft</ebit-label>)
        // Priority 3: empty
        const text = this.getAttribute('text') || this.innerHTML.trim() || '';
        const classAttr = this.getAttribute('class') || '';
        const id = this.getAttribute('id') || '';
        const data = this.getAttribute('data') || '';
        const dataFn = this.getAttribute('data-fn') || ''; // New attribute
        const forAttr = this.getAttribute('for') || ''; // Support for <label for="id">

        // Remove any inner content from light DOM to avoid duplication
        this.innerHTML = '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block; /* Ensures proper spacing when used in flow */
                }
                label {
                    display: inline-block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                .form-label {
                    margin-bottom: 0.5rem;
                }
                .h2 {
                    font-size: 1.5rem !important;
                    font-weight: bold !important;
                    margin: 0 0 1rem 0;
                }
                .h3 { font-size: 1.35rem; font-weight: bold; }
                .text-danger { color: #dc3545 !important; }
            </style>
            <label 
                id="${id}" 
                class="${classAttr}" 
                data-data="${data}"
                ${dataFn ? `data-fn="${dataFn}"` : ''}
                ${forAttr ? `for="${forAttr}"` : ''}
            >
                ${text}
            </label>
        `;
    }

    // Optional: Allow updating text dynamically
    static get observedAttributes() {
        return ['text', 'class', 'for', 'data-fn']; // Added 'data-fn'
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.connectedCallback(); // Re-render on attribute change
        }
    }
}

// Define only once
if (!customElements.get('ebit-label')) {
    customElements.define('ebit-label', EbitLabel);
}
