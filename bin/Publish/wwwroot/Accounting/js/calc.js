// =======================
// Central Calculation Library
// =======================

// Sum of all values of a class
function sum(cls) {
    let total = 0;
    document.querySelectorAll("." + cls).forEach(el => {
        total += parseFloat(el.value || 0);
    });
    return total;
}

// Count of all non-empty numeric values of a class
function count(cls) {
    let cnt = 0;
    document.querySelectorAll("." + cls).forEach(el => {
        if (!isNaN(parseFloat(el.value))) cnt++;
    });
    return cnt;
}

// Minimum value of a class
function min(cls) {
    let values = Array.from(document.querySelectorAll("." + cls))
        .map(el => parseFloat(el.value || 0));
    return values.length ? Math.min(...values) : 0;
}

// Maximum value of a class
function max(cls) {
    let values = Array.from(document.querySelectorAll("." + cls))
        .map(el => parseFloat(el.value || 0));
    return values.length ? Math.max(...values) : 0;
}

// =======================
// Helper: evaluate formula in a row or table
// =======================
function calculateValue(cls, operation, rowElement) {
    alert('a');
    if (!operation) {
        // Get value from the same row
        if (rowElement) {
            let el = rowElement.querySelector("." + cls);
            return parseFloat(el?.value || 0);
        }
        // Fallback: return first value
        let el = document.querySelector("." + cls);
        return parseFloat(el?.value || 0);
    }
    // Aggregate operations (ignore row for these)
    switch (operation) {
        case 'sum': return sum(cls);
        case 'count': return count(cls);
        case 'min': return min(cls);
        case 'max': return max(cls);
        default: return 0;
    }
}

// =======================
// Update all inputs with data-fn
// =======================
function updateAll() {
    // Row calculations
    document.querySelectorAll("tbody tr").forEach(row => {
        row.querySelectorAll("[data-fn]").forEach(input => {
            let formula = input.getAttribute("data-fn");
            // Replace calculateValue(class,'op') pattern with row context
            formula = formula.replace(/calculateValue\((['"])(\w+)\1(?:,('|")(\w+)\3)?\)/g, (_, quote1, cls, quote2, op) => {
                return calculateValue(cls, op, row);
            });
            try {
                let result = eval(formula);
                input.value = isNaN(result) ? 0 : result.toFixed(2);
            } catch {
                input.value = 0;
            }
        });
    });

    // Footer totals
    document.querySelectorAll("tfoot [data-fn]").forEach(input => {
        let formula = input.getAttribute("data-fn");
        formula = formula.replace(/calculateValue\((['"])(\w+)\1(?:,('|")(\w+)\3)?\)/g, (_, quote1, cls, quote2, op) => {
            return calculateValue(cls, op);
        });
        try {
            let result = eval(formula);
            input.value = isNaN(result) ? 0 : result.toFixed(2);
        } catch {
            input.value = 0;
        }
    });
}

// =======================
// Event listener
// =======================
document.addEventListener("input", updateAll);
document.addEventListener("DOMContentLoaded", updateAll);