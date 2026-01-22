class EbitText extends HTMLElement {
    connectedCallback() {
        setTimeout(() => {
            this.render();
            this.initInput();
            this.loadValue();
        }, 0);
    }

    render() {
        const dataPath = this.getAttribute('data') || '';
        const placeholder = this.getAttribute('placeholder') || '';
        const value = this.getAttribute('value') || '';
        const classes = this.getAttribute('class') || 'form-control form-control-sm no-border-input';

        this.innerHTML = `
            <input 
                type="text" 
                name="${dataPath}"
                class="${classes}"
                autocomplete="off"
                placeholder="${placeholder}"
                value="${value}"
                style="text-align: left;" 
            />
            <span class="text-danger validation-message"></span>
        `;
    }

    initInput() {
        const input = this.querySelector('input');

        // You can add additional event listeners here if needed, e.g., for validation
        input.addEventListener('focus', () => this.unformatText(input));
        input.addEventListener('blur', () => this.formatText(input));
    }

    loadValue() {
        const input = this.querySelector('input');

        // Priority: value attribute > data attribute model value
        const valueAttr = this.getAttribute('value');
        if (valueAttr !== null && valueAttr !== '') {
            input.value = valueAttr;
            return;
        }

        const modelValue = this.getModelValue();
        if (modelValue != null) {
            input.value = modelValue;
        }
    }

    getModelValue() {
        const dataPath = this.getAttribute('data');
        if (!dataPath || !window.viewModel) return null;

        try {
            return dataPath.split('.').reduce((obj, part) => {
                const match = part.match(/\[(\d+)\]/);
                if (match) {
                    const arr = obj[part.replace(match[0], '')];
                    return arr ? arr[parseInt(match[1])] : null;
                }
                return obj[part];
            }, window.viewModel);
        } catch (e) {
            return null;
        }
    }

    formatText(input) {
        let val = input.value.trim();
        if (!val) return;

        // Add any specific formatting if needed, for example, trimming spaces, etc.
        input.value = val;
    }

    unformatText(input) {
        let val = input.value.trim();
        if (val === '') return;
        input.value = val;
    }

    clearValue() {
        const input = this.querySelector('input');
        if (input) {
            input.value = ''; // Clear the input field
        }
    }

    // Optional: Add method to update value programmatically
    setValue(newValue) {
        const input = this.querySelector('input');
        input.value = newValue;
        this.setAttribute('value', newValue);
    }

    // Optional: Add method to get current value
    getValue() {
        const input = this.querySelector('input');
        return input.value;
    }
}

// Define the custom element
customElements.define('ebit-text', EbitText);