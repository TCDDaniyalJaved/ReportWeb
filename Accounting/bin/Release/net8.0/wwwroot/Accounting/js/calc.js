// Get numeric value from element - FIXED
function getNumericValue(el) {
    if (!el) return 0;
    // Sirf input element se value lo
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input');
    if (input) {
        const val = input.value.replace(/,/g, '');
        return parseFloat(val) || 0;
    }
    return parseFloat(el.value || el.textContent || 0);
}
// calculateValue: selectors + operation - FIXED
function calculateValue(selectors, operation = 'sum') {
    let values = [];
    // Sirf top-level elements select karo (nested elements avoid karo)
    selectors.split(',').forEach(sel => {
        sel = sel.trim();
        document.querySelectorAll(sel).forEach(el => {
            // Sirf parent elements count karo
            if (el.closest('[data-debit]') || el.closest('[data-credit]')) {
                // Nested input element hai to skip karo
                if (el.tagName === 'INPUT') return;
            }
            values.push(getNumericValue(el));
        });
    });
    if (values.length === 0) return 0;
    switch (operation.toLowerCase()) {
        case 'sum':
            return values.reduce((a, b) => a + b, 0);
        case 'avg':
            return values.reduce((a, b) => a + b, 0) / values.length;
        case 'count':
            return values.filter(v => v !== 0 && !isNaN(v)).length;
        case 'max':
            return Math.max(...values);
        case 'min':
            return Math.min(...values);
        default:
            return 0;
    }
}
// Update element - FIXED
function updateElement(el, value) {
    if (!el) return;
    const text = value.toFixed(2) + ' Rs.';
    if (el.tagName === 'EBIT-LABEL' && typeof el.setText === 'function') {
        el.setText(text);
    } else {
        el.textContent = text;
    }
}
// Update all elements with data-fn - FIXED
function updateAll() {
    document.querySelectorAll('[data-fn]').forEach(el => {
        const formula = el.getAttribute('data-fn');
        if (!formula) return;
        try {
            // Formula evaluate karo
            const result = eval(formula);
            updateElement(el, result);
        } catch (err) {
            console.error('Error evaluating formula:', formula, err);
            updateElement(el, 0);
        }
    });
}
// Initial values ke liye fix with polling
function initializeValues(tries = 0) {
    const inputs = document.querySelectorAll('[data-debit] input, [data-credit] input');
    if (inputs.length === 0 && tries < 20) {
        // Components abhi ready nahi hain, retry after 100ms
        setTimeout(() => initializeValues(tries + 1), 100);
        return;
    }
    // Pehle saari existing values load karo
    inputs.forEach(input => {
        if (input.value) {
            // Trigger input event taki calculation ho
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    // Phir calculation karo
    setTimeout(updateAll, 100);
}
// Live update on input
document.addEventListener('input', e => {
    // Agar input field change hua hai
    if (e.target.tagName === 'INPUT') {
        // 50ms ka delay taki value properly update ho jaye
        setTimeout(updateAll, 50);
    }
});
// MutationObserver for dynamic rows
const observer = new MutationObserver(() => {
    setTimeout(updateAll, 100);
});
document.querySelectorAll('ebit-table, table').forEach(tbl => {
    observer.observe(tbl, { childList: true, subtree: true });
});
// Initial calculation - FIXED
document.addEventListener('DOMContentLoaded', () => {
    // Thoda delay karo taki saari elements load ho jayein
    setTimeout(initializeValues, 500);
});
// Expose globally
window.updateAll = updateAll;
window.calculateValue = calculateValue;