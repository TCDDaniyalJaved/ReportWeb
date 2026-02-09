/* ============================================================
   UNIVERSAL CALCULATION & AUTO-UPDATE UTILITY
   - No domain keywords
   - No formatting assumptions
   - Works with static + dynamic DOM
   ============================================================ */

/* ---------- Get numeric value from element ---------- */
function getNumericValue(el) {
    if (!el) return 0;

    // Prefer input value if present
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input');

    if (input) {
        const raw = (input.value || '').replace(/,/g, '');
        const num = parseFloat(raw);
        return Number.isFinite(num) ? num : 0;
    }

    // Fallback to text
    const text = (el.textContent || '').replace(/,/g, '');
    const num = parseFloat(text);
    return Number.isFinite(num) ? num : 0;
}

/* ---------- Calculate values from selectors ---------- */
function calculateValue(selectors, operation = 'sum') {
    const values = [];
    const selected = document.querySelectorAll(selectors);

    selected.forEach(el => {
        // Avoid double counting nested structures
        if (el.dataset.__counted) return;
        el.dataset.__counted = '1';

        values.push(getNumericValue(el));
    });

    // Cleanup markers
    selected.forEach(el => delete el.dataset.__counted);

    if (!values.length) return 0;

    switch (operation.toLowerCase()) {
        case 'sum':
            return values.reduce((a, b) => a + b, 0);

        case 'avg':
            return values.reduce((a, b) => a + b, 0) / values.length;

        case 'count':
            return values.filter(v => Number.isFinite(v) && v !== 0).length;

        case 'max':
            return Math.max(...values);

        case 'min':
            return Math.min(...values);

        default:
            return 0;
    }
}

/* ---------- Safe formula evaluation ---------- */
function safeEval(formula) {
    const scope = { calculateValue };
    return Function(
        ...Object.keys(scope),
        `"use strict"; return (${formula});`
    )(...Object.values(scope));
}

/* ---------- Update single element ---------- */
function updateElement(el, value) {
    if (!el) return;

    const text = Number.isFinite(value)
        ? value.toFixed(2)
        : '0.00';

    if (typeof el.setText === 'function') {
        el.setText(text);
    } else {
        el.textContent = text;
    }
}

/* ---------- Update all elements with data-fn ---------- */
function updateAll() {
    document.querySelectorAll('[data-fn]').forEach(el => {
        const formula = el.getAttribute('data-fn');
        if (!formula) return;

        try {
            const result = safeEval(formula);
            updateElement(el, result);
        } catch (err) {
            console.error('Formula error:', formula, err);
            updateElement(el, 0);
        }
    });
}

/* ---------- Initialize existing values (async-safe) ---------- */
function initializeValues(tries = 0) {
    const inputs = document.querySelectorAll('input');

    if (!inputs.length && tries < 20) {
        setTimeout(() => initializeValues(tries + 1), 100);
        return;
    }

    inputs.forEach(input => {
        if (input.value) {
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    setTimeout(updateAll, 100);
}

/* ---------- Live update on input ---------- */
document.addEventListener('input', e => {
    if (e.target.tagName === 'INPUT') {
        setTimeout(updateAll, 50);
    }
});

/* ---------- Observe dynamic DOM changes ---------- */
let observerTimer;
const observer = new MutationObserver(() => {
    clearTimeout(observerTimer);
    observerTimer = setTimeout(updateAll, 100);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/* ---------- Initial load ---------- */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeValues, 300);
});

/* ---------- Expose API ---------- */
window.calculateValue = calculateValue;
window.updateAll = updateAll;
