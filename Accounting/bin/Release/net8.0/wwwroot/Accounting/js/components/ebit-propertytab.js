class EbitPropertyTab extends HTMLElement {
    connectedCallback() {
        // Set role="tablist" on the custom element
        this.setAttribute("role", "tablist");

        // Get property pages
        const pages = this.querySelectorAll("ebit-propertypage");

        // Create nav bar for tabs
        const nav = document.createElement("ul");
        nav.className = "nav nav-tabs";

        // Create tab-content wrapper
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "tab-content";

        // Insert elements BEFORE replacing original content
        this.parentNode.insertBefore(nav, this);
        this.parentNode.insertBefore(contentWrapper, this.nextSibling);

        pages.forEach((page, index) => {
            const target = page.getAttribute("target");
            const text = page.getAttribute("text");
            const isActive = page.hasAttribute("active") || index === 0;

            // --------- CREATE TAB BUTTON ---------
            const li = document.createElement("li");
            li.className = "nav-item";

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "nav-link";
            if (isActive) btn.classList.add("active");
            btn.setAttribute("data-bs-toggle", "tab");
            btn.setAttribute("data-bs-target", "#" + target);
            btn.textContent = text;

            li.appendChild(btn);
            nav.appendChild(li);

            // --------- CREATE TAB CONTENT PANEL ---------
            const pane = document.createElement("div");
            pane.className = "tab-pane fade";
            if (isActive) pane.classList.add("show", "active");
            pane.id = target;

            // Move original content into pane
            while (page.firstChild) {
                pane.appendChild(page.firstChild);
            }

            contentWrapper.appendChild(pane);
        });

        // Remove old placeholder element
        this.remove();
    }
}

customElements.define("ebit-propertytab", EbitPropertyTab);
customElements.define("ebit-propertypage", EbitPropertyPage);
