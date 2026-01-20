/* --------------------------------------------------------------
   ebit-datetime.js – Reusable Flatpickr Web Component
   -------------------------------------------------------------- */
class EbitDateTime extends HTMLElement {

    connectedCallback() {
        setTimeout(() => {
            this.render();
            this.initFlatpickr();
            this.loadValue();
            this.attachValidation();
        }, 0);
    }

    // RENDER HTML + INTERNAL CSS
    render() {
        const dataPath = this.getAttribute('data') || '';
        const datatype = this.getAttribute('datatype') || 'Date';
        const placeholder = this.getAttribute('placeholder') || this.getPlaceholder(datatype);

        this.innerHTML = `
            <style>
                /* Today Button Style (inside Flatpickr) */
                .flatpickr-today-button {
                    background: #FFFFFF  !important;
                    color: #000000  !important;
                    border: none;
                    padding: 6px 12px;
                    font-size: 14px;
                    border-radius: 4px;
                    width: calc(100% - 16px);
                    margin: 8px;
                    cursor: pointer;
                    text-align: center;
                }
                .flatpickr-today-button:hover {
                    background: #D3D3D3  !important;
                }
            </style>

            <input
                type="text"
                name="${dataPath}"
                class="form-control no-border-input"
                placeholder="${placeholder}"
                style="width: 100%;"
            />
            <input type="hidden" name="${dataPath}" id="hidden-${dataPath.replace(/\./g, '_')}" />
            <span class="text-danger validation-message"></span>
        `;
    }

    getPlaceholder(type) {
        switch (type) {
            case 'Date': return 'MM-DD-YYYY';
            case 'DateTime': return 'MM-DD-YYYY HH:MM';
            case 'Time': return 'HH:MM';
            default: return 'Select...';
        }
    }

    initFlatpickr() {
        const $input = this.querySelector('input[type="text"]');
        const $hidden = this.querySelector('input[type="hidden"]');
        const datatype = this.getAttribute('datatype') || 'Date';

        let config = {
            dateFormat: this.getDateFormat(datatype),
            enableTime: datatype.includes('Time') || datatype === 'DateTime',
            noCalendar: datatype === 'Time',
            time_24hr: true,

            onChange: (selectedDates, dateStr) => {
                $hidden.value = dateStr;
                $input.value = this.formatDisplay(dateStr, datatype);
                this.dispatchEvent(new Event('change', { bubbles: true }));
            },

            onClose: () => {
                $(this).find('input').trigger('blur');
            },

            onReady: (selectedDates, dateStr, instance) => {
                // Create Today Button
                const btn = document.createElement("button");
                btn.innerText = "Today";
                btn.className = "flatpickr-today-button";

                btn.addEventListener("click", () => {
                    const today = new Date();

                    instance.setDate(today, true);   // Update UI
                    $hidden.value = instance.formatDate(today, config.dateFormat);
                    $input.value = this.formatDisplay($hidden.value, datatype);

                    instance.close();
                });

                // Add button inside calendar panel
                instance.calendarContainer.appendChild(btn);
            }
        };

        // Set default date
        const modelValue = this.getModelValue();
        if (modelValue) {
            config.defaultDate = modelValue;
        } else if (datatype === "Date" || datatype === "DateTime") {
            config.defaultDate = new Date();
        }

        this.flatpickrInstance = flatpickr($input, config);

        if ($input.value) {
            $hidden.value = $input.value;
        }
    }

    getDateFormat(type) {
        switch (type) {
            case 'Date': return 'Y-m-d';
            case 'DateTime': return 'Y-m-d H:i';
            case 'Time': return 'H:i';
            default: return 'Y-m-d';
        }
    }

    formatDisplay(value, type) {
        if (!value) return '';
        if (type === 'Date') return value;
        if (type === 'Time') return value;
        return value; // DateTime
    }

    loadValue() {
        const $input = this.querySelector('input[type="text"]');
        const $hidden = this.querySelector('input[type="hidden"]');
        const modelValue = this.getModelValue();

        if (modelValue) {
            const formatted = this.formatForFlatpickr(modelValue);
            $input.value = formatted;
            $hidden.value = modelValue;
            if (this.flatpickrInstance) {
                this.flatpickrInstance.setDate(modelValue, false);
            }
        }
    }

    formatForFlatpickr(value) {
        return value.replace('T', ' ').split('.')[0];
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
        } catch {
            return null;
        }
    }

    attachValidation() {
        const $input = this.querySelector('input[type="text"]');

        $input.addEventListener('blur', () => {
            const val = $input.value;
            if (!val && this.hasAttribute('required')) {
                this.showError('This field is required.');
            } else {
                this.clearError();
            }
        });
    }

    showError(message) {
        const $span = this.querySelector('.validation-message');
        if ($span) $span.textContent = message;
        this.querySelector('input[type="text"]').classList.add('input-validation-error');
    }

    clearError() {
        const $span = this.querySelector('.validation-message');
        if ($span) $span.textContent = '';
        this.querySelector('input[type="text"]').classList.remove('input-validation-error');
    }

    reset() {
        const $input = this.querySelector('input[type="text"]');
        const $hidden = this.querySelector('input[type="hidden"]');

        $input.value = '';
        $hidden.value = '';
        if (this.flatpickrInstance) {
            this.flatpickrInstance.clear();
        }
        this.clearError();
    }
}

// Register custom element
customElements.define('ebit-datetime', EbitDateTime);
