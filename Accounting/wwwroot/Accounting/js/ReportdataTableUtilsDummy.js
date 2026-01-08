//ReportdataTableUtilsDummy.js
let activeTables = new Map();
let groupBySelectionOrder = [];
let pageFilterConfig = {};

const FILTER_ICON = `
<svg viewBox="0 0 24 24" width="14" height="14" class="me-1">
    <path d="M3,4H21V6H3V4M6,10H18V12H6V10M10,16H14V18H10V16Z"></path>
</svg>`;

const GROUP_ICON = `
<svg viewBox="0 0 24 24" width="14" height="14" class="me-1">
    <path d="M3,13H9V19H3V13M3,5H9V11H3V5M11,5H21V11H11V5M11,13H21V19H11V13Z"></path>
</svg>`;
export function setPageFilterConfig(config) {
    pageFilterConfig = { ...config };
}
// Generate columns from table header
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
            groupTotal: isGroupTotal,
        };

        if (align) {
            const alignMap = { right: 'end', center: 'center', left: 'start' };
            const textAlign = alignMap[align.toLowerCase()] || 'start';
            colDef.className = `text-${textAlign}`;
        }

        if (datafield) {
            colDef.data = datafield;
        } else {
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

// Get active group-by fields
function getGroupByFieldsInOrder() {
    return groupBySelectionOrder;
}

// Calculate totals for group
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

// Create group header row
function createGroupHeaderRow(field, value, count, level, columns, totals) {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    const displayValue = value || '(Blank)';

    let tds = '';
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (i === 0) {
            tds += `<td colspan="1" style="padding-left:${level * 20}px;" class="text-nowrap">
                <span class="toggle-icon d-inline-block" style="width:20px;">
                    <i class="bx bx-chevron-down"></i>
                </span>
                ${displayValue} <small class="text-muted">(${count})</small>
            </td>`;
        } else if (col.groupTotal) {
            tds += `<td class="text-end fw-semibold">
                ${totals[col.data].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>`;
        } else {
            tds += `<td></td>`;
        }
    }
    return $(`<tr class="group-row level-${level}">${tds}</tr>`);
}

// Count records in group
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

// Setup collapse/expand toggle
function setupGroupRowToggle() {
    $('#masterTable tbody')
        .off('click', 'tr.group-row')
        .on('click', 'tr.group-row', function () {
            const $groupRow = $(this);
            const levelMatch = this.className.match(/level-(\d+)/);
            if (!levelMatch) return;
            const level = parseInt(levelMatch[1]);
            const isCollapsed = $groupRow.hasClass('collapsed');
            const $icon = $groupRow.find('.toggle-icon i');

            $groupRow.toggleClass('collapsed', !isCollapsed);
            $icon.toggleClass('bx-chevron-down', isCollapsed)
                .toggleClass('bx-chevron-right', !isCollapsed);

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

// Add badge to search box (edit icon only for filters)
function addSearchBadge(type, value, displayText) {
    if ($(`.badge-tag[data-type="${type}"][data-value="${value}"]`).length) return;

    const icon =
        type === 'Group'
            ? GROUP_ICON
            : `<span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>`;

    const $badge = $(`
        <span class="badge-tag d-inline-flex align-items-center"
              data-type="${type}"
              data-value="${value}">
            ${icon}
            <span class="badge-text ms-1">${displayText}</span>
            <span class="remove-btn ms-1" style="cursor:pointer;">×</span>
        </span>
    `);

    //  Remove badge
    $badge.find('.remove-btn').on('click', function (e) {
        e.stopPropagation();
        $badge.remove();
        if (activeTables.has('#masterTable')) {
            activeTables.get('#masterTable').ajax.reload();
        }
    });

    //  Open modal ONLY when clicking filter icon
    if (type === 'Filter') {
        $badge.find('.filter-icon').on('click', function (e) {
            e.stopPropagation();
            openFilterModal(value, $badge);
        });
    }

    $('#universalSearch').before($badge);
}




function openFilterModal(filterType, $badge) {
    const config = pageFilterConfig[filterType];

    if (!config || !config.divId || !config.backendKey) {
        alert('Filter not configured properly: ' + filterType);
        return;
    }

    const $modal = $('#filterModal');

    // Set modal title
    $('#filterModalTitle').text(config.title || 'Select Option');

    // Hide all filter sections
    $modal.find('.filter-option').hide();

    // Show the selected filter section
    const $filterDiv = $(`#${config.divId}`);
    $filterDiv.show();

    // Pre-select current badge value if exists
    if ($badge && $badge.data('value')) {
        $filterDiv.find('select').val($badge.data('value'));
    } else {
        $filterDiv.find('select').val($filterDiv.find('option:first').val());
    }

    // Apply button logic
    $modal.find('#applyFilterBtn').off('click').on('click', function () {
        const $select = $filterDiv.find('select').first();
        const selectedValue = $select.val();
        const selectedText = $select.find('option:selected').text().trim() || 'Selected';

        const config = pageFilterConfig[filterType]; // e.g. MY_FILTERS['Companies']

        // If no selection or "0" (default), remove badge if exists
        if (!selectedValue || selectedValue === '0' || selectedValue === '') {
            if ($badge) {
                $badge.remove();
            }
        } else {
            if (!$badge) {
                // Create NEW badge
                const icon = `<span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>`;
                $badge = $(`
                <span class="badge-tag d-inline-flex align-items-center"
                      data-type="Filter"
                      data-key="${config.backendKey}"
                      data-value="${selectedValue}">
                    ${icon}
                    <span class="badge-text ms-1">${selectedText}</span>
                    <span class="remove-btn ms-1" style="cursor:pointer;">×</span>
                </span>
            `);

                // Attach remove handler
                $badge.find('.remove-btn').on('click', function (e) {
                    e.stopPropagation();
                    $badge.remove();
                    if (activeTables.has('#masterTable')) {
                        activeTables.get('#masterTable').ajax.reload();
                    }
                });

                // Re-attach filter icon click to reopen modal
                $badge.find('.filter-icon').on('click', function (e) {
                    e.stopPropagation();
                    openFilterModal(filterType, $badge);
                });

                // Insert before search input
                $('#universalSearch').before($badge);
            } else {
                // UPDATE existing badge
                $badge.data('value', selectedValue);
                $badge.data('key', config.backendKey);        // safety
                $badge.attr('data-key', config.backendKey);    // DOM update
                $badge.find('.badge-text').text(selectedText);
            }
        }

        // Close modal
        bootstrap.Modal.getInstance($modal[0]).hide();

        // Reload table to apply new filters
        if (activeTables.has('#masterTable')) {
            activeTables.get('#masterTable').ajax.reload();
        }
    });

    // Show the modal
    new bootstrap.Modal($modal[0]).show();
}




// Initialize DataTable
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

                // === DYNAMIC FILTERS FROM BADGES ===
                const filterBadges = $('.badge-tag[data-type="Filter"]');
                filterBadges.each(function () {
                    const $badge = $(this);
                    const backendKey = $badge.data('key');     
                    const value = $badge.data('value');         

                    if (backendKey && value) {
                        if (d[backendKey]) {
                            if (Array.isArray(d[backendKey])) {
                                d[backendKey].push(value);
                            } else {
                                d[backendKey] = [d[backendKey], value];
                            }
                        } else {
                            d[backendKey] = [value];  
                        }
                    }
                });

                console.log('AJAX payload:', d);
                return d;
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
            const lastGroupValues = [];

            rows.toArray().forEach((rowNode, index) => {
                const rowData = rowDataArray[index];
                if (!rowData) return;

                groupByFields.forEach((field, level) => {
                    const value = rowData[field] ?? '(Blank)';
                    if (lastGroupValues[level] !== value) {
                        const currentGroupValues = [...(lastGroupValues.slice(0, level) || []), value];
                        const count = countRecordsInGroup(rowDataArray, index, groupByFields, level, currentGroupValues);
                        const totals = calculateGroupTotals(rowDataArray, index, groupByFields, level, currentGroupValues, columns);
                        const groupRow = createGroupHeaderRow(field, value, count, level, columns, totals);
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

    // Group By Click Handler
    $(document).off('click', '#groupByList li[data-group]').on('click', '#groupByList li[data-group]', function () {
        const $item = $(this);
        const field = $item.data('group');
        const displayText = $item.text().trim();

        $item.toggleClass('active');

        if ($item.hasClass('active')) {
            if (!groupBySelectionOrder.includes(field)) {
                groupBySelectionOrder.push(field);
            }
            addSearchBadge('Group', field, displayText);
        } else {
            groupBySelectionOrder = groupBySelectionOrder.filter(f => f !== field);
            $(`.badge-tag[data-type="Group"][data-value="${field}"]`).remove();
        }

        table.ajax.reload();
    });

    // Filter Click Handler (from dropdown)
    $(document).off('click', '[data-filter]').on('click', '[data-filter]', function () {
        const filterValue = this.dataset.filter;
        const displayText = this.textContent.trim();

        $(this).toggleClass('active');

        if ($(this).hasClass('active')) {
            addSearchBadge('Filter', filterValue, displayText);
        } else {
            $(`.badge-tag[data-type="Filter"][data-value="${filterValue}"]`).remove();
        }

        table.ajax.reload();
    });

    activeTables.set(tableSelector, table);
    return table;
}

// Stepper init
export function initStepper() {
    const el = document.querySelector('#wizardStepper');
    if (el) {
        window.stepper = new Stepper(el, { linear: false });
        return window.stepper;
    }
    return null;
}

// Update pagination
function updateCustomPagination(table) {
    $('#totalRecords').text(table.page.info().recordsDisplay || 0);
}