class EbitNumber extends HTMLElement {
    connectedCallback() {
        setTimeout(() => {
            this.render();
            this.initInput();
            this.loadValue();
        }, 0);
    }

    render() {
        const dataPath = this.getAttribute('data') || '';
        const placeholder = this.getAttribute('placeholder') || '0.00';
        const value = this.getAttribute('value') || '';

        // Default classes
        let defaultClasses = 'form-control form-control-sm no-border-input number no-spinner';
        const customClasses = this.getAttribute('class');
        const classes = customClasses ? `${defaultClasses} ${customClasses}` : defaultClasses;

        // Add optional data-debit or data-credit attributes for calc.js
        const dataDebit = this.hasAttribute('data-debit') ? 'data-debit' : '';
        const dataCredit = this.hasAttribute('data-credit') ? 'data-credit' : '';

        this.innerHTML = `
            <input 
                type="text" 
                inputmode="decimal"
                name="${dataPath}"
                class="${classes}"
                placeholder="${placeholder}"
                value="${value}"
                ${dataDebit} ${dataCredit}
                style="text-align: right;"
            />
            <span class="text-danger validation-message"></span>
        `;
    }

    initInput() {
        const input = this.querySelector('input');
        input.style.appearance = 'textfield';
        input.addEventListener('wheel', (e) => e.preventDefault());
        input.addEventListener('blur', () => this.formatNumber(input));
        input.addEventListener('focus', () => this.unformatNumber(input));
        input.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^0-9.-]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
            const minusCount = (val.match(/-/g) || []).length;
            if (minusCount > 1 || (val.indexOf('-') > 0)) val = val.replace(/-/g, '');
            if (val.startsWith('-') && val.length > 1 && val[1] === '.') val = '-0.' + val.slice(2);
            e.target.value = val;

            // Trigger live update for totals
            if (window.updateAll) setTimeout(window.updateAll, 10);
        });
    }

    loadValue() {
        const input = this.querySelector('input');

        // Priority: value attribute > data attribute model value
        const valueAttr = this.getAttribute('value');
        if (valueAttr !== null && valueAttr !== '') {
            input.value = this.formatForDisplay(valueAttr);
            return;
        }

        const modelValue = this.getModelValue();
        if (modelValue != null) input.value = this.formatForDisplay(modelValue);
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

    formatNumber(input) {
        let val = input.value.trim();
        if (!val) return;
        val = val.replace(/,/g, '');
        const num = parseFloat(val);
        input.value = isNaN(num) ? '' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    unformatNumber(input) {
        let val = input.value.replace(/,/g, '');
        if (val !== '' && !isNaN(parseFloat(val))) input.value = val;
    }

    formatForDisplay(value) {
        const num = parseFloat(value);
        return isNaN(num) ? '' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    setValue(newValue) {
        const input = this.querySelector('input');
        input.value = this.formatForDisplay(newValue);
        this.setAttribute('value', newValue);

        if (window.updateAll) setTimeout(window.updateAll, 10);
    }

    getValue() {
        const input = this.querySelector('input');
        return parseFloat(input.value.replace(/,/g, '') || 0);
    }
}

// Register custom element
customElements.define('ebit-number', EbitNumber);
