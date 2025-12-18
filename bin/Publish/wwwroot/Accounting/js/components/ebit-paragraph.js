class EbitParagraph extends HTMLElement {
    static get observedAttributes() {
        return ['class', 'style'];  // id observe karne ki zarurat nahi
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        // ORIGINAL outer text preserve karna zaroori hai
        const text = super.textContent.trim();

        const classAttr = this.getAttribute('class') || '';
        const styleAttr = this.getAttribute('style') || '';

        this.shadowRoot.innerHTML = `
            <style>
                p {
                    margin: 0;
                    padding: 0;
                }
            </style>
            <p class="${classAttr}" style="${styleAttr}">${text}</p>
        `;

        this._paragraph = this.shadowRoot.querySelector('p');
    }

    // Set text
    set textContent(value) {
        if (this._paragraph) {
            this._paragraph.textContent = value;
        }
    }

    // Get text
    get textContent() {
        return this._paragraph ? this._paragraph.textContent : '';
    }
}

customElements.define('ebit-paragraph', EbitParagraph);
