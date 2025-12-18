// ebit-propertytab.js + ebit-propertypage.js
class EbitPropertyTab extends HTMLElement {
    connectedCallback() {
        this.classList.add('nav', 'nav-tabs');
        if (this.hasAttribute('class')) {
            this.classList.add(...this.getAttribute('class').split(' '));
        }

        const children = this.querySelectorAll('ebit-propertypage');
        children.forEach((page, index) => {
            const isActive = page.hasAttribute('active') || index === 0;
            const target = page.getAttribute('target');
            const text = page.getAttribute('text') || 'Tab';

            const button = document.createElement('button');
            button.className = 'nav-link';
            button.classList.add('nav-link');
            if (isActive) button.classList.add('active');
            button.setAttribute('data-bs-toggle', 'tab');
            button.setAttribute('data-bs-target', '#' + target);
            button.setAttribute('role', 'tab');
            button.type = 'button';
            button.innerText = text;

            const wrapper = document.createElement('div');
            wrapper.className = 'nav-item';
            wrapper.role = 'presentation';
            wrapper.appendChild(button);

            this.appendChild(wrapper);
            page.remove(); // original <ebit-propertypage> hata do
        });
    }
}

class EbitPropertyPage extends HTMLElement { }

customElements.define('ebit-propertytab', EbitPropertyTab);
customElements.define('ebit-propertypage', EbitPropertyPage);