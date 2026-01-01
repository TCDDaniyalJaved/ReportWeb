let activeTables = new Map();

let groupBySelectionOrder = [];

// ==================== COLUMN GENERATION FROM HEADERS ====================
export function generateColumnsFromHeaders(tableSelector = '#masterTable') {
    const columns = [];

    $(`${tableSelector} thead th`).each(function () {
        const $th = $(this);
        const datafield = $th.attr('datafield');
        const header = $th.attr('header') || $th.text().trim();
        const width = $th.attr('width');
        const align = $th.attr('align');
        const isActive = $th.attr('active') !== 'false';

        const colDef = {
            title: header,
            visible: isActive,
            width: width || undefined,
        };

        // Alignment handling
        if (align) {
            const alignMap = { right: 'end', center: 'center', left: 'start' };
            const textAlign = alignMap[align.toLowerCase()] || 'start';
            colDef.className = `text-${textAlign}`;
        }

        // Data mapping
        if (datafield) {
            colDef.data = datafield;
        } else {
            colDef.data = null;
            colDef.orderable = false;
        }

        // Auto-format: Financial amounts
        const amountKeywords = ['debit', 'credit', 'amount', 'balance'];
        if (datafield && amountKeywords.some(k => datafield.toLowerCase().includes(k))) {
            colDef.render = $.fn.dataTable.render.number(',', '.', 2);
            colDef.className = (colDef.className || '') + ' text-end';
        }

        // Auto-format: Dates (Indian format)
        if (datafield && /date/i.test(datafield)) {
            colDef.render = (data) => {
                if (!data) return '';
                return new Date(data).toLocaleDateString('en-IN');
            };
        }

        columns.push(colDef);
    });

    return columns;
}

// ==================== GET GROUPING FIELDS IN USER'S SELECTION ORDER ====================
function getGroupByFieldsInOrder() {
    return groupBySelectionOrder;
}

// ==================== CREATE GROUP HEADER ROW ====================
function createGroupHeaderRow(field, value, count, level, totalColumns) {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    const displayValue = value || '(Blank)';
    const headerText = `${fieldName}: ${displayValue} ${count > 0 ? `(${count})` : ''}`;

    return $(`
        <tr class="group-row level-${level}">
            <td colspan="${totalColumns}">
                <span class="toggle-icon" style="display:inline-block; width:20px; text-align:center;">
                    <i class="bx bx-chevron-down"></i>
                </span>
                <span>${headerText}</span>
            </td>
        </tr>
    `);
}

// ==================== COUNT RECORDS IN CURRENT GROUP LEVEL ====================
function countRecordsInGroup(rowDataArray, startIndex, groupByFields, level, currentGroupValues) {
    let count = 0;
    for (let i = startIndex; i < rowDataArray.length; i++) {
        const rowData = rowDataArray[i];
        let stillInGroup = true;

        for (let l = 0; l <= level; l++) {
            const field = groupByFields[l];
            const expected = l === level ? currentGroupValues[level] : currentGroupValues[l];
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

// ==================== SETUP COLLAPSE/EXPAND FOR GROUP ROWS ====================
function setupGroupRowToggle() {
    $('#masterTable tbody').off('click', 'tr.group-row').on('click', 'tr.group-row', function () {
        const $groupRow = $(this);
        const levelMatch = this.className.match(/level-(\d+)/);
        if (!levelMatch) return;
        const level = parseInt(levelMatch[1]);

        const isCollapsed = $groupRow.hasClass('collapsed');
        const $icon = $groupRow.find('.toggle-icon i');

        // Toggle icon and class
        if (isCollapsed) {
            $icon.removeClass('bx-chevron-right').addClass('bx-chevron-down');
            $groupRow.removeClass('collapsed');
        } else {
            $icon.removeClass('bx-chevron-down').addClass('bx-chevron-right');
            $groupRow.addClass('collapsed');
        }

        // Traverse next rows and hide/show accordingly
        let $next = $groupRow.next();
        while ($next.length) {
            if ($next.hasClass('group-row')) {
                const nextLevelMatch = $next[0].className.match(/level-(\d+)/);
                if (!nextLevelMatch) break;
                const nextLevel = parseInt(nextLevelMatch[1]);

                if (nextLevel <= level) break;

                // Nested group rows: follow parent state
                if (isCollapsed) {
                    $next.show().removeClass('collapsed');
                    $next.find('.toggle-icon i').removeClass('bx-chevron-right').addClass('bx-chevron-down');
                } else {
                    $next.hide().addClass('collapsed');
                    $next.find('.toggle-icon i').removeClass('bx-chevron-down').addClass('bx-chevron-right');
                }
            } else {
                // Regular data rows
                $next.toggle(isCollapsed);
            }
            $next = $next.next();
        }
    });
}

// ==================== MAIN DATATABLE INITIALIZATION ====================
export function initializeDataTable(endpoint, tableSelector = '#masterTable', options = {}) {
    const {
        columns = generateColumnsFromHeaders(tableSelector),
        pageLength = 7,
        callbacks = {}
    } = options;

    const $table = $(tableSelector);
    if (!$table.length) return null;

    // Destroy existing instance
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }

    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        serverSide: true,
        paging: true,
        dom: 't', // Only table, no default controls
        pageLength,
        searching: false,
        ordering: true,
        info: false,
        ajax: {
            url: endpoint,
            type: 'POST',
            data: function (d) {
                const len = parseInt($('#sharedLength').val()) || pageLength;
                const currentPage = parseInt($('#pageInfo').data('page')) || 1;
                d.start = (currentPage - 1) * len;
                d.length = len;
                d.customSearch = $('#universalSearch').val() || '';
                const token = $('input[name="__RequestVerificationToken"]').val();
                if (token) d.__RequestVerificationToken = token;
            }
        },
        columns,
        drawCallback: function () {
            // Clean previous grouping
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

                        const groupRow = createGroupHeaderRow(field, value, count, level, totalColumns);
                        $(rowNode).before(groupRow);

                        lastGroupValues[level] = value;

                        // Reset deeper levels
                        for (let j = level + 1; j < groupByFields.length; j++) {
                            lastGroupValues[j] = undefined;
                        }
                    }
                });
            });

            setupGroupRowToggle();
            updateCustomPagination(table);
            callbacks.onDraw?.();
        }
    });

    // ==================== UNIVERSAL SEARCH ====================
    $('#universalSearch').off('keyup').on('keyup', function () {
        $('#pageInfo').data('page', 1);
        table.ajax.reload();
    });

    // ==================== GROUP BY SELECTION WITH ORDER TRACKING ====================
    $('#groupBySelect').off('change').on('change', function () {
        const currentlySelected = $(this).val() || [];

        // Remove deselected fields
        groupBySelectionOrder = groupBySelectionOrder.filter(field =>
            currentlySelected.includes(field)
        );

        // Add newly selected fields to the end (preserves selection order)
        const newlySelected = currentlySelected.filter(field =>
            !groupBySelectionOrder.includes(field)
        );
        groupBySelectionOrder.push(...newlySelected);

        $('#pageInfo').data('page', 1);
        table.ajax.reload();
    });

    // Initialize order on page load if pre-selected
    const preSelected = $('#groupBySelect').val();
    if (preSelected && preSelected.length > 0) {
        groupBySelectionOrder = [...preSelected]; // fallback to DOM order initially
    }

    activeTables.set(tableSelector, table);
    return table;
}

// ==================== STEPPER INITIALIZATION ====================
export function initStepper() {
    const el = document.querySelector('#wizardStepper');
    if (el) {
        window.stepper = new Stepper(el, { linear: false });
        return window.stepper;
    }
    return null;
}

// ==================== HELPER: UPDATE TOTAL RECORDS ====================
function updateCustomPagination(table) {
    $('#totalRecords').text(table.page.info().recordsDisplay || 0);
}