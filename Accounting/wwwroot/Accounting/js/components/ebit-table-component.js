// ------------------ EbitTable ------------------
class EbitTable extends HTMLElement {
    connectedCallback() {
        if (this.isConnected && !this._initialized) {
            this._initialized = true;

            // Create real <table> and REPLACE the custom element with it
            const table = document.createElement("table");

            // Transfer all attributes (class, style, id, etc.)
            Array.from(this.attributes).forEach(attr => {
                table.setAttribute(attr.name, attr.value);
            });

            // Move all child nodes into the real table
            while (this.firstChild) {
                table.appendChild(this.firstChild);
            }

            // Replace <ebit-table> with real <table> in DOM
            this.parentNode.replaceChild(table, this);
        }
    }
}
customElements.define("ebit-table", EbitTable);

// ------------------ EbitHead ------------------
class EbitHead extends HTMLElement {
    connectedCallback() {
        if (!this._initialized) {
            this._initialized = true;
            const thead = document.createElement("thead");
            this.replaceWith(thead); // Replace <ebit-head> with real <thead>

            // Transfer attributes and children
            Array.from(this.attributes).forEach(attr => {
                thead.setAttribute(attr.name, attr.value);
            });
            while (this.firstChild) {
                thead.appendChild(this.firstChild);
            }

            // Add text-align right style to the <thead>
            thead.style.textAlign = "right"; // This will apply the text alignment to the whole <thead>
        }
    }
}
customElements.define("ebit-head", EbitHead);


// ------------------ EbitBody ------------------
class EbitBody extends HTMLElement {
    connectedCallback() {
        if (!this._initialized) {
            this._initialized = true;
            const tbody = document.createElement("tbody");
            this.replaceWith(tbody);

            Array.from(this.attributes).forEach(attr => {
                tbody.setAttribute(attr.name, attr.value);
            });
            while (this.firstChild) {
                tbody.appendChild(this.firstChild);
            }
        }
    }
}
customElements.define("ebit-body", EbitBody);

// ------------------ EbitFooter ------------------
class EbitFooter extends HTMLElement {
    connectedCallback() {
        if (!this._initialized) {
            this._initialized = true;
            const tfoot = document.createElement("tfoot");
            this.replaceWith(tfoot);
            Array.from(this.attributes).forEach(attr => {
                tfoot.setAttribute(attr.name, attr.value);
            });
            while (this.firstChild) {
                tfoot.appendChild(this.firstChild);
            }
        }
    }
}
customElements.define("ebit-footer", EbitFooter);



// ------------------ EbitRow ------------------
class EbitRow extends HTMLElement {
    static get observedAttributes() { return ["selected", "disabled"]; }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        if (this._tr) return;

        const tr = document.createElement("tr");
        this._tr = tr;

        // Transfer classes and attributes
        if (this.className) tr.className = this.className;
        Array.from(this.attributes).forEach(attr => {
            if (!["class"].includes(attr.name)) {
                tr.setAttribute(attr.name, attr.value);
            }
        });

        // Move children
        while (this.firstChild) {
            tr.appendChild(this.firstChild);
        }

        // Apply state classes
        if (this.hasAttribute("selected")) tr.classList.add("table-primary");
        if (this.hasAttribute("disabled")) tr.classList.add("text-muted");

        this.replaceWith(tr);
    }
}
customElements.define("ebit-row", EbitRow);

// ------------------ EbitColumn ------------------
class EbitHeadcolumn extends HTMLElement {
    static get observedAttributes() {
        return ["align", "width", "sortable", "datafield", "header", "render", "active", "isamount","currency"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        if (this._th) return;

        const th = document.createElement("th");
        this._th = th;

        // Header text (priority: header attribute > innerHTML)
        const header = this.getAttribute("header");
        th.innerHTML = header ? header : this.innerHTML;

        if (this.className) th.className = this.className;

        // ---- Alignment ----
        const align = this.getAttribute("align");
        if (align === "center") th.classList.add("text-center");
        else if (align === "right") th.classList.add("text-end");
        else th.classList.add("text-start");

        // ---- Width ----
        const width = this.getAttribute("width");
        if (width) th.style.width = width;

        // ---- Active / Visible ----
        const active = this.getAttribute("active");
        if (active === "false") {
            th.setAttribute("data-active", "false"); // DataTables will check it
        }


        ["datafield", "render", "isamount", "currency"].forEach(attr => {
            if (this.hasAttribute(attr)) {
                th.setAttribute(attr, this.getAttribute(attr));
            }
        });

        // ---- DataTables helper attributes to pass along ----
        ["datafield", "render"].forEach(attr => {
            if (this.hasAttribute(attr)) {
                th.setAttribute(attr, this.getAttribute(attr));
            }
        });

        // ---- Sortable ----
        if (this.hasAttribute("sortable")) {
            th.style.cursor = "pointer";
            th.title = "Click to sort";
        }

        // ---- Transfer inline style ----
        if (this.hasAttribute("style")) {
            th.setAttribute("style", this.getAttribute("style"));
        }

        this.replaceWith(th);
    }
}
customElements.define("ebit-headcolumn", EbitHeadcolumn);



// ------------------ Ebit-bodycolumn ------------------
class EbitBodycolumn extends HTMLElement {
    static get observedAttributes() {
        return ["align", "colspan", "rowspan", "datafield", "width"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        if (this._td) return;

        const td = document.createElement("td");
        this._td = td;

        td.innerHTML = this.innerHTML;
        if (this.className) td.className = this.className;

        // ---- Alignment ----
        const align = this.getAttribute("align");
        if (align === "center") td.classList.add("text-center");
        else if (align === "right") td.classList.add("text-end");
        else td.classList.add("text-start");

        // ---- Width ----
        const width = this.getAttribute("width");
        if (width) td.style.width = width;

        // ---- Colspan / Rowspan ----
        ["colspan", "rowspan"].forEach(attr => {
            if (this.hasAttribute(attr)) {
                td.setAttribute(attr, this.getAttribute(attr));
            }
        });

        // ---- DataTables datafield support ----
        if (this.hasAttribute("datafield")) {
            td.setAttribute("datafield", this.getAttribute("datafield"));
        }

        this.replaceWith(td);
    }
}
customElements.define("ebit-bodycolumn", EbitBodycolumn);
