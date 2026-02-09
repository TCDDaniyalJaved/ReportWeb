class EbitSelect extends HTMLElement {
    connectedCallback() {
        setTimeout(() => {
            this.render();
            this.initSelect2();
            this.loadSelectedValue();
            this.setupValidation();
        }, 0);
    }

    render() {
        const forAttr = this.getAttribute('data');
        const placeholder = this.getAttribute('placeholder') || 'Choose One';
        const classes = this.getAttribute('class') || 'form-select select2';
        const disabledAttr = this.hasAttribute('disabled') ? 'disabled' : '';

        this.innerHTML = `
        <select
            name="${forAttr}"
            class="${classes}"
            style="width:100%"
            ${disabledAttr}> 
            <option value="" selected disabled hidden>
                ${placeholder}
            </option>
        </select>
        <span class="text-danger validation-message"></span>
    `;
    }

    generateDataUrl() {
        let url = this.getAttribute('data-url');

        if (url) {
            if (!url.startsWith('/') && !url.startsWith('http')) {
                return `/Dropdawn/${url}`;
            }
            return url;
        }

        const dataAttr = this.getAttribute('data');
        if (dataAttr) {
            const lastPart = dataAttr.split('.').pop();
            return `/Dropdawn/${lastPart.toLowerCase()}`;
        }

        return null;
    }

    getExtraParams() {
        const paramsAttr = this.getAttribute('data-params');
        if (!paramsAttr) return {};

        try {
            return JSON.parse(paramsAttr);
        } catch (e) {
            //console.error('Invalid JSON in data-params:', e);
            return {};
        }
    }

    initSelect2() {
        const select = this.querySelector('select');
        const url = this.generateDataUrl();
        const placeholder = this.getAttribute('placeholder');

        if (this.hasAttribute('disabled')) {
            $(select).select2({
                placeholder: placeholder,
                dropdownParent: $(this),
                disabled: true
            });
            return;
        }

        if (!url) {
            $(select).select2({
                placeholder: placeholder,
                dropdownParent: $(this)
            });
            return;
        }

        const extraParams = this.getExtraParams();
        //console.log('Extra Params:', extraParams);


        $(select).select2({
            placeholder: placeholder,
            dropdownParent: $(this),
            ajax: {
                url: url,
                dataType: 'json',
                delay: 250,
                data: (params) => {
                    const requestData = {
                        term: params.term || ''
                    };

                    // Add extra parameters to request
                    Object.keys(extraParams).forEach(key => {
                        requestData[key] = extraParams[key];
                    });

                    return requestData;
                },
                processResults: (data) => ({
                    results: data.map(item => ({
                        id: item.id.toString(),
                        text: item.name || item.text
                    }))
                }),
                cache: true
            }
        });

        $(select).on('change', () => {
            this.validate();
        });
    }

    async loadSelectedValue() {
        const selectedId = this.getAttribute('selected'); // selected value from Razor
        const select = this.querySelector('select');

        if (!selectedId) return; // nothing to select

        const url = this.generateDataUrl();
        const extraParams = this.getExtraParams();

        // If no URL (static single value), just add option directly
        if (!url) {
            const option = new Option(
                selectedId, // display value
                selectedId, // actual value
                true,       // default selected
                true        // trigger select
            );
            select.appendChild(option);
            $(select).val(selectedId).trigger('change');
            return;
        }

        try {
            // Build URL with extra params + selectedId
            const urlObj = new URL(url, window.location.origin);

            // Prefer using id param first
            urlObj.searchParams.set('id', selectedId);

            // Add extra parameters
            Object.keys(extraParams).forEach(key => {
                urlObj.searchParams.set(key, extraParams[key]);
            });

            const response = await fetch(urlObj.toString());
            const data = await response.json();

            let option;
            if (data) {
                // If server returns single object
                if (Array.isArray(data) && data.length > 0) {
                    const item = data[0];
                    option = new Option(item.text || item.name, item.id, true, true);
                } else if (data.id) {
                    option = new Option(data.text || data.name, data.id, true, true);
                }
            }

            // Fallback: if no data from server, just use selectedId
            if (!option) {
                option = new Option(selectedId, selectedId, true, true);
            }

            select.appendChild(option);
            $(select).val(selectedId).trigger('change');

        } catch (err) {
            // On error, fallback to selectedId
            const option = new Option(selectedId, selectedId, true, true);
            select.appendChild(option);
            $(select).val(selectedId).trigger('change');
        }
    }


    async loadSingleOption(selectedId, extraParams = {}) {
        const url = this.generateDataUrl();
        if (!url) return;

        const select = this.querySelector('select');

        try {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.set('term', selectedId);

            // Add extra parameters
            Object.keys(extraParams).forEach(key => {
                urlObj.searchParams.set(key, extraParams[key]);
            });

            const response = await fetch(urlObj.toString());
            const data = await response.json();

            if (data && data.length > 0) {
                const item = data[0];
                const option = new Option(item.text || item.name, item.id, true, true);
                $(select).append(option).trigger('change');
            } else {
                const option = new Option(selectedId, selectedId, true, true);
                $(select).append(option).trigger('change');
            }
        } catch (err) {
            const option = new Option(selectedId, selectedId, true, true);
            $(select).append(option).trigger('change');
        }
    }

    setupValidation() {
        const select = this.querySelector('select');
        const form = this.closest('form');
        if (!form) return;

        $.validator.unobtrusive.parse(form);
        const validator = $(form).data('validator');
        if (!validator) return;

        const name = select.name;
        const settings = validator.settings;

        const originalHighlight = settings.highlight;
        const originalUnhighlight = settings.unhighlight;

        settings.highlight = (element, errorClass, validClass) => {
            if (element.name === name) {
                this.classList.add('is-invalid');
                $(element).addClass('is-invalid');
            } else {
                originalHighlight.call(validator, element, errorClass, validClass);
            }
        };

        settings.unhighlight = (element, errorClass, validClass) => {
            if (element.name === name) {
                this.classList.remove('is-invalid');
                $(element).removeClass('is-invalid');
            } else {
                originalUnhighlight.call(validator, element, errorClass, validClass);
            }
        };

        settings.errorPlacement = (error, element) => {
            if (element.name === name) {
                const msgSpan = this.querySelector('.validation-message');
                msgSpan.textContent = error.text();
                msgSpan.style.display = 'block';
            } else {
                error.insertAfter(element);
            }
        };
    }

    validate() {
        const select = this.querySelector('select');
        const validator = $(this.closest('form')).data('validator');
        if (validator) validator.element(select);
    }
}

customElements.define('ebit-select', EbitSelect);