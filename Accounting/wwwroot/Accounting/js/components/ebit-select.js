//working ebit-select.js
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

    // Helper method to generate URL from data attribute
    generateDataUrl() {
        let url = this.getAttribute('data-url');

        // Agar data-url explicitly diya gaya hai
        if (url) {
            // Agar relative path hai (slash se start nahi hota), toh base path add karo
            if (!url.startsWith('/') && !url.startsWith('http')) {
                return `/Dropdawn/${url}`; // "/Dropdawn/UserWiseAccount"
            }
            // Agar absolute path ya full URL hai, toh use as it is
            return url;
        }

        // Agar data-url nahi hai, toh automatically generate karo
        const dataAttr = this.getAttribute('data');
        if (dataAttr) {
            const lastPart = dataAttr.split('.').pop();
            return `/Dropdawn/${lastPart.toLowerCase()}`;
        }

        return null;
    }

    initSelect2() {
        const select = this.querySelector('select');
        const url = this.generateDataUrl();
        const placeholder = this.getAttribute('placeholder');

        // Agar select disabled hai, toh select2 initialize mat karo
        if (this.hasAttribute('disabled')) {
            $(select).select2({
                placeholder: placeholder,
                dropdownParent: $(this),
                disabled: true // Yahan bhi disabled karo
            });
            return; // Function yahan se return ho jaye
        }

        // Normal process jab disabled nahi hai
        if (!url) {
            return;
        }

        $(select).select2({
            placeholder: placeholder,
            dropdownParent: $(this),
            ajax: {
                url: url,
                dataType: 'json',
                delay: 250,
                data: (params) => ({ term: params.term || '' }),
                processResults: (data) => ({
                    results: data.map(item => ({
                        id: item.id.toString(),
                        text: item.name
                    }))
                }),
                cache: true
            }
        });

        // Validation ke liye change event
        $(select).on('change', () => {
            this.validate();
        });
    }

    async loadSelectedValue() {
        const selectedId = this.getAttribute('selected');
        if (!selectedId) return;

        const url = this.generateDataUrl(); // Updated: use generated URL

        // Agar URL nahi hai, toh kuch na karo
        if (!url) {
            return;
        }

        const select = this.querySelector('select');


        try {
            // Try different parameter formats based on your API
            const response = await fetch(`${url}?term=${selectedId}`);
            const data = await response.json();


            if (data && data.length > 0) {
                // Find the item that matches our selectedId
                const item = data.find(opt => opt.id.toString() === selectedId.toString());

                if (item) {
                    const option = new Option(item.text || item.name, item.id, true, true);
                    $(select).append(option).trigger('change');
                } else {
                    this.loadSingleOption(selectedId);
                }
            } else {
                this.loadSingleOption(selectedId);
            }
        } catch (err) {
            this.loadSingleOption(selectedId);
        }
    }

    // Fallback method to load single option
    async loadSingleOption(selectedId) {
        const url = this.generateDataUrl(); // Updated: use generated URL

        if (!url) {
            return;
        }

        const select = this.querySelector('select');

        try {
            // Try to get the specific item by ID
            const response = await fetch(`${url}?id=${selectedId}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const item = data[0];
                const option = new Option(item.text || item.name, item.id, true, true);
                $(select).append(option).trigger('change');
            } else {
                // Last resort: create option with just the ID
                const option = new Option(selectedId, selectedId, true, true);
                $(select).append(option).trigger('change');
            }
        } catch (err) {
            // Final fallback
            const option = new Option(selectedId, selectedId, true, true);
            $(select).append(option).trigger('change');
        }
    }

    setupValidation() {
        const select = this.querySelector('select');
        const form = this.closest('form');
        if (!form) return;

        // parse form for unobtrusive validation (dynamic rows)
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