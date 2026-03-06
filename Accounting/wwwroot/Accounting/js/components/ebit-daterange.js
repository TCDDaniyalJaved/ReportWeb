/* --------------------------------------------------------------
   ebit-daterange.js – Reusable Flatpickr Range Picker Component
   -------------------------------------------------------------- */
class EbitdateRange extends HTMLElement {

    connectedCallback() {
        setTimeout(() => {
            this.render();
            this.initFlatpickr();
            this.attachValidation();
        }, 0);
    }

    // Render HTML
    render() {
        const dataPath = this.getAttribute('data') || '';
        const placeholder = this.getAttribute('placeholder') || 'Select Date Range';

        this.innerHTML = `
            <style>
                .flatpickr-today-button {
                    background: #FFFFFF !important;
                    color: #000000 !important;
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
                    background: #D3D3D3 !important;
                }
            </style>

            <input
                type="text"
                name="${dataPath}"
                class="form-control no-border-input"
                placeholder="${placeholder}"
                style="width: 100%;"
            />
            <input type="hidden" name="${dataPath}_from" id="hidden-${dataPath.replace(/\./g, '_')}_from" />
            <input type="hidden" name="${dataPath}_to" id="hidden-${dataPath.replace(/\./g, '_')}_to" />
            <span class="text-danger validation-message"></span>
        `;
    }

    initFlatpickr() {
        const $input = this.querySelector('input[type="text"]');
        const $hiddenFrom = this.querySelector('input[name$="_from"]');
        const $hiddenTo = this.querySelector('input[name$="_to"]');

        let config = {
            mode: "range",
            dateFormat: "Y-m-d",
            onChange: (selectedDates, dateStr) => {
                if (selectedDates.length === 2) {
                    $hiddenFrom.value = flatpickr.formatDate(selectedDates[0], "Y-m-d");
                    $hiddenTo.value = flatpickr.formatDate(selectedDates[1], "Y-m-d");
                }
                $input.value = dateStr;
                this.dispatchEvent(new Event('change', { bubbles: true }));
            },
            onClose: () => {
                $input.dispatchEvent(new Event('blur'));
            },
            onReady: (selectedDates, dateStr, instance) => {
                const btn = document.createElement("button");
                btn.innerText = "Today";
                btn.className = "flatpickr-today-button";
                btn.addEventListener("click", () => {
                    const today = new Date();
                    instance.setDate([today, today], true);
                    $hiddenFrom.value = instance.formatDate(today, "Y-m-d");
                    $hiddenTo.value = instance.formatDate(today, "Y-m-d");
                    $input.value = $hiddenFrom.value + " to " + $hiddenTo.value;
                    instance.close();
                });
                instance.calendarContainer.appendChild(btn);
            }
        };

        this.flatpickrInstance = flatpickr($input, config);
    }

    attachValidation() {
        const $input = this.querySelector('input[type="text"]');
        $input.addEventListener('blur', () => {
            if (!this.flatpickrInstance.selectedDates.length && this.hasAttribute('required')) {
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
        const $hiddenFrom = this.querySelector('input[name$="_from"]');
        const $hiddenTo = this.querySelector('input[name$="_to"]');

        $input.value = '';
        $hiddenFrom.value = '';
        $hiddenTo.value = '';
        if (this.flatpickrInstance) {
            this.flatpickrInstance.clear();
        }
        this.clearError();
    }
}

// Register custom element
customElements.define('ebit-daterange', EbitdateRange);
