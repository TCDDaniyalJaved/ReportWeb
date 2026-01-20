
// Get numeric value from element
function getNumericValue(el) {
    if (!el) return 0;
    if (el.tagName === 'EBIT-NUMBER') return parseFloat(el.value || 0);
    if (el.tagName === 'INPUT' && el.closest('ebit-number')) return parseFloat(el.value.replace(/,/g, '') || 0);
    return parseFloat(el.value || 0);
}

// calculateValue: selectors + operation
function calculateValue(selectors, operation = 'sum') {
    let values = [];
    selectors.split(',').forEach(sel => {
        sel = sel.trim();
        document.querySelectorAll(sel).forEach(el => values.push(getNumericValue(el)));
    });
    if (values.length === 0) return 0;
    switch (operation.toLowerCase()) {
        case 'sum': return values.reduce((a, b) => a + b, 0);
        case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
        case 'count': return values.filter(v => v !== 0 && !isNaN(v)).length;
        case 'max': return Math.max(...values);
        case 'min': return Math.min(...values);
        default: return 0;
    }
}

// Update ebit-label or normal element
function updateElement(el, value) {
    if (!el) return;
    const text = value.toFixed(2) + ' Rs.';
    if (typeof el.setText === 'function') el.setText(text);
    else el.textContent = text;
}

// Update all elements with data-fn
function updateAll() {
    document.querySelectorAll('[data-fn]').forEach(el => {
        const formula = el.getAttribute('data-fn');
        if (!formula) return;
        try {
            const result = eval(formula); // allows expressions
            updateElement(el, result);
        } catch (err) {
            console.error('Error evaluating formula:', formula, err);
            updateElement(el, 0);
        }
    });
}

// Live update on input
document.addEventListener('input', e => {
    if (e.target.closest('ebit-number') || e.target.tagName === 'INPUT') setTimeout(updateAll, 10);
});

// MutationObserver for dynamic rows
const observer = new MutationObserver(updateAll);
document.querySelectorAll('ebit-table, table').forEach(tbl => {
    observer.observe(tbl, { childList: true, subtree: true });
});

// Initial calculation
document.addEventListener('DOMContentLoaded', updateAll);

// Expose globally
window.updateAll = updateAll;
window.calculateValue = calculateValue;
