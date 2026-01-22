let activeTables = new Map();
let groupBySelectionOrder = [];

// -----------------------------
//  Generate columns from table header
// -----------------------------
export function generateColumnsFromHeaders(tableSelector = '#masterTable') {
    const columns = [];

    $(`${tableSelector} thead th`).each(function () {
        const $th = $(this);
        const datafield = $th.attr('datafield');
        const header = $th.attr('header') || $th.text().trim();
        const width = $th.attr('width');
        const align = $th.attr('align');
        const isActive = $th.attr('active') !== 'false';
        const isGroupTotal = $th.attr('group-total') === 'true';

        const colDef = {
            title: header,
            visible: isActive,
            width: width || undefined,
            groupTotal: isGroupTotal, // custom flag
        };

        if (align) {
            const alignMap = { right: 'end', center: 'center', left: 'start' };
            const textAlign = alignMap[align.toLowerCase()] || 'start';
            colDef.className = `text-${textAlign}`;
        }

        if (datafield) colDef.data = datafield;
        else {
            colDef.data = null;
            colDef.orderable = false;
        }

        const amountKeywords = ['debit', 'credit', 'amount', 'balance'];
        if (datafield && amountKeywords.some(k => datafield.toLowerCase().includes(k))) {
            colDef.render = $.fn.dataTable.render.number(',', '.', 2);
            colDef.className = (colDef.className || '') + ' text-end';
        }

        if (datafield && /date/i.test(datafield)) {
            colDef.render = (data) => (!data ? '' : new Date(data).toLocaleDateString('en-IN'));
        }

        columns.push(colDef);
    });

    return columns;
}
window.addEventListener('resize', function () {
    if ($.fn.DataTable.isDataTable('#masterTable')) {
        $('#masterTable').DataTable().columns.adjust().draw(false);
    }
});
// -----------------------------
//  Get active group-by fields
// -----------------------------
function getGroupByFieldsInOrder() {
    return groupBySelectionOrder;
}

// -----------------------------
//  Calculate totals for group
// -----------------------------
function calculateGroupTotals(rowDataArray, startIndex, groupByFields, level, currentGroupValues, columns) {
    const totals = {};
    for (const col of columns) {
        if (!col.groupTotal) continue;
        totals[col.data] = 0;
    }

    for (let i = startIndex; i < rowDataArray.length; i++) {
        const row = rowDataArray[i];
        let stillInGroup = true;
        for (let l = 0; l <= level; l++) {
            const field = groupByFields[l];
            const expected = currentGroupValues[l];
            const actual = row[field] ?? '(Blank)';
            if (expected !== actual) {
                stillInGroup = false;
                break;
            }
        }

        if (!stillInGroup) break;

        for (const col of columns) {
            if (!col.groupTotal) continue;
            totals[col.data] += Number(row[col.data] || 0);
        }
    }

    return totals;
}

// -----------------------------
//  Create group header row
// -----------------------------
function createGroupHeaderRow(field, value, count, level, totalColumns, totals, columns) {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    const displayValue = value || '(Blank)';

    let tds = '';

    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (i === 0) {
            // First column: show group name + count
            tds += `<td colspan="${1}" style="padding-left:${level * 20}px;" class="text-nowrap">
    <span class="toggle-icon d-inline-block" style="width:20px;">
        <i class="bx bx-chevron-down"></i>
    </span>
    ${displayValue} <small class="text-muted">(${count})</small>
</td>
`;
        } else if (col.groupTotal) {
            // Column marked group-total: show total
            tds += `<td class="text-end fw-semibold">
                        ${totals[col.data].toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>`;
        } else {
            // Empty column
            tds += `<td></td>`;
        }
    }

    return $(`<tr class="group-row level-${level}">${tds}</tr>`);
}


// -----------------------------
//  Count records in a group
// -----------------------------
function countRecordsInGroup(rowDataArray, startIndex, groupByFields, level, currentGroupValues) {
    let count = 0;
    for (let i = startIndex; i < rowDataArray.length; i++) {
        const rowData = rowDataArray[i];
        let stillInGroup = true;
        for (let l = 0; l <= level; l++) {
            const field = groupByFields[l];
            const expected = currentGroupValues[l];
            const actual = rowData[field] ?? '(Blank)';
            if (expected !== actual) {
                stillInGroup = false;
                break;
            }
        }
        if (!stillInGroup) break;
        count++;
    }
    return count;
}

// -----------------------------
//  Setup collapse/expand toggle
// -----------------------------
function setupGroupRowToggle() {
    $('#masterTable tbody').off('click', 'tr.group-row').on('click', 'tr.group-row', function () {
        const $groupRow = $(this);
        const levelMatch = this.className.match(/level-(\d+)/);
        if (!levelMatch) return;
        const level = parseInt(levelMatch[1]);
        const isCollapsed = $groupRow.hasClass('collapsed');
        const $icon = $groupRow.find('.toggle-icon i');

        if (isCollapsed) {
            $icon.removeClass('bx-chevron-right').addClass('bx-chevron-down');
            $groupRow.removeClass('collapsed');
        } else {
            $icon.removeClass('bx-chevron-down').addClass('bx-chevron-right');
            $groupRow.addClass('collapsed');
        }

        let $next = $groupRow.next();
        while ($next.length) {
            if ($next.hasClass('group-row')) {
                const nextLevelMatch = $next[0].className.match(/level-(\d+)/);
                if (!nextLevelMatch) break;
                const nextLevel = parseInt(nextLevelMatch[1]);
                if (nextLevel <= level) break;

                if (isCollapsed) {
                    $next.show().removeClass('collapsed');
                    $next.find('.toggle-icon i').removeClass('bx-chevron-right').addClass('bx-chevron-down');
                } else {
                    $next.hide().addClass('collapsed');
                    $next.find('.toggle-icon i').removeClass('bx-chevron-down').addClass('bx-chevron-right');
                }
            } else {
                $next.toggle(isCollapsed);
            }
            $next = $next.next();
        }
    });
}

// -----------------------------
//  Initialize DataTable
// -----------------------------
export function initializeDataTable(endpoint, tableSelector = '#masterTable', options = {}) {
    const {
        columns = generateColumnsFromHeaders(tableSelector),
        pageLength = 7,
        callbacks = {}
    } = options;

    const $table = $(tableSelector);
    if (!$table.length) return null;

    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }

    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        serverSide: true,
        paging: true,
        dom: 't',
        pageLength,
        searching: false,
        ordering: true,
        info: false,
        ajax: {
            url: endpoint,
            type: 'POST',
            data: function (d) {
                d.customSearch = $('#universalSearch').val() || '';
                d.groupByFields = groupBySelectionOrder || [];
            }
        },
        columns,
        drawCallback: function () {
            $('#masterTable tbody tr.group-row').remove();
            $('#masterTable tbody tr').show();

            const groupByFields = getGroupByFieldsInOrder();
            if (groupByFields.length === 0) {
                updateCustomPagination(table);
                callbacks.onDraw?.();
                return;
            }

            const rows = table.rows({ page: 'current' }).nodes();
            const rowDataArray = rows.toArray().map(node => table.row(node).data());
            const totalColumns = table.columns().count();
            const lastGroupValues = [];

            rows.toArray().forEach((rowNode, index) => {
                const rowData = rowDataArray[index];
                if (!rowData) return;

                groupByFields.forEach((field, level) => {
                    const value = rowData[field] ?? '(Blank)';
                    if (lastGroupValues[level] !== value) {
                        const currentGroupValues = [...lastGroupValues.slice(0, level), value];
                        const count = countRecordsInGroup(rowDataArray, index, groupByFields, level, currentGroupValues);

                        //  Calculate totals only for group-total columns
                        const totals = calculateGroupTotals(rowDataArray, index, groupByFields, level, currentGroupValues, columns);

                        const groupRow = createGroupHeaderRow(field, value, count, level, totalColumns, totals, columns);
                        $(rowNode).before(groupRow);
                        lastGroupValues[level] = value;

                        for (let j = level + 1; j < groupByFields.length; j++) lastGroupValues[j] = undefined;
                    }
                });
            });

            setupGroupRowToggle();
            updateCustomPagination(table);
            callbacks.onDraw?.();
        }
    });

    // Universal search
    $('#universalSearch').off('keyup').on('keyup', function () {
        $('#pageInfo').data('page', 1);
        table.ajax.reload();
    });

    // Group By click
    $('#groupByList li[data-group]').off('click').on('click', function () {
        const field = $(this).data('group');
        $(this).toggleClass('active');

        if ($(this).hasClass('active')) {
            if (!groupBySelectionOrder.includes(field)) groupBySelectionOrder.push(field);
        } else {
            groupBySelectionOrder = groupBySelectionOrder.filter(f => f !== field);
        }

        table.ajax.reload();
    });

    activeTables.set(tableSelector, table);
    return table;
}

// -----------------------------
//  Stepper init
// -----------------------------
export function initStepper() {
    const el = document.querySelector('#wizardStepper');
    if (el) {
        window.stepper = new Stepper(el, { linear: false });
        return window.stepper;
    }
    return null;
}

// -----------------------------
//  Update pagination
// -----------------------------
function updateCustomPagination(table) {
    $('#totalRecords').text(table.page.info().recordsDisplay || 0);
}