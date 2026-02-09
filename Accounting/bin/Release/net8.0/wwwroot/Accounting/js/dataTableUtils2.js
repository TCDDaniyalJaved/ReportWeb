// DataTable Utilities - 
//Complete table management system with grouping, filtering, and pagination
// Last Modified: 11:31AM 1-31-2026

// GLOBAL STATE MANAGEMENT

let activeTables = new Map();               // Registry of active DataTable instances
export let groupBySelectionOrder = [];      // Ordered array of active grouping fields
let allLoadedData = [];                     // Current page data cache for client-side operations

// CONSTANTS & SVG ICONS

const FILTER_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,4H21V6H3V4M6,10H18V12H6V10M10,16H14V18H10V16Z"></path></svg>`;
const GROUP_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,13H9V19H3V13M3,5H9V11H3V5M11,5H21V11H11V5M11,13H21V19H11V13Z"></path></svg>`;

// COLUMN CONFIGURATION GENERATOR

/**
 * Generates DataTable column definitions from HTML table headers
 * Reads attributes from <th> elements to configure columns dynamically
 */
export function generateColumnsFromHeaders(tableSelector = '#masterTable') {
    const columns = [];

    $(`${tableSelector} thead th`).each(function () {
        const th = $(this);
        const datafield = th.attr('datafield');
        const header = th.attr('header') || th.text().trim();
        const width = th.attr('width');
        const align = th.attr('align');
        const active = th.attr('active') !== 'false';
        const isGroupTotal = th.attr('group-total') === 'true';
        const renderType = th.attr('render');
        const isAmount = th.attr('isamount') === 'true';
        const currency = th.attr('currency') || '';

        // Base column configuration
        //const colDef = {
        //    title: header,
        //    width: width || undefined,
        //    groupTotal: isGroupTotal,
        //};
        const colDef = {
            title: header,
            width: width ? width.toString() : undefined,
        };

        // Column visibility control
        if (!active) colDef.visible = false;

        // Text alignment configuration
        if (align) {
            const alignment = align === 'right' ? 'end' : align === 'center' ? 'center' : 'start';
            colDef.className = `text-${alignment}`;
        }

        // Data binding setup
        if (datafield) {
            colDef.data = datafield;
        } else {
            colDef.data = null;
            colDef.orderable = false;
        }

        // Custom renderers for action buttons
        if (renderType === 'edit') {
            colDef.render = (data, type, row) =>
                `<button class="btn btn-icon btn-sm edit-btn" title="Edit"
                    data-id="${row.id || ''}"
                    data-voucher="${row.voucher || ''}"
                    data-compprefix="${row.prefix || ''}">
                    <i class="bx bx-edit"></i>
                </button>`;
        }
        else if (renderType === 'deleteprint') {
            colDef.render = (data, type, row) => `
                <button class="btn btn-icon btn-sm delete-btn me-1" title="Delete" 
                    data-id="${row.id || ''}">
                    <i class="bx bx-trash"></i>
                </button>
                <button class="btn btn-icon btn-sm print-btn" title="Print"
                    data-id="${row.id || ''}" 
                    data-voucher="${row.voucher || ''}" 
                    data-compprefix="${row.prefix || ''}">
                    <i class="bx bx-printer"></i>
                </button>`;
        }
        else if (renderType === 'print') {
            colDef.render = (data, type, row) => `
                <button class="btn btn-icon btn-sm print-btn" title="Print"
                    data-id="${row.id || ''}" 
                    data-voucher="${row.voucher || ''}" 
                    data-compprefix="${row.prefix || ''}">
                    <i class="bx bx-printer"></i>
                </button>`;
        }
        else if (renderType === 'delete') {
            colDef.render = (data, type, row) => `
                <button class="btn btn-icon btn-sm delete-btn me-1" title="Delete" 
                    data-id="${row.id || ''}">
                    <i class="bx bx-trash"></i>
                </button>`;
        }
        else if (renderType === 'empty') {
            colDef.render = () => ``;
        }
        else if (renderType === 'checkbox') {
            // Checkbox column for bulk selection
            colDef.title = '<div class="text-center"><input type="checkbox" id="select-all" class="form-check-input"></div>';
            colDef.render = function (data, type, row) {
                if (type === 'display') {
                    return '<div class="text-center"><input type="checkbox" class="row-selector form-check-input" data-id="' + (row.id || '') + '"></div>';
                }
                return data;
            };
            colDef.orderable = false;
            colDef.searchable = false;
        }
        else if (renderType === 'status') {
            // Status badge renderer with conditional styling
            colDef.render = (data, type, row) => {
                const status = row.status || data;
                const badgeClass = status === 'Active' ? 'badge bg-success' :
                    status === 'Inactive' ? 'badge bg-danger' : 'badge bg-secondary';
                return `<span class="${badgeClass}">${status}</span>`;
            };
        }

        // Numeric amount formatting with currency symbol
        if (isAmount) {
            colDef.render = (data) =>
                data != null
                    ? `${currency}${Number(data).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`
                    : '';
            colDef.className = (colDef.className || '') + ' text-end';
        }

        // Date field auto-formatting
        if (datafield && (datafield.includes('date') || datafield.includes('Date'))) {
            colDef.render = (data) => {
                if (!data) return '';
                const date = new Date(data);
                return date.toLocaleDateString('en-IN');
            };
        }

        columns.push(colDef);
    });

    return columns;
}

// HELPER FUNCTIONS

/** Returns current group-by fields in selection order */
function getGroupByFieldsInOrder() {
    return groupBySelectionOrder;
}

/** Fetches default page length from server or returns fallback value */
export async function fetchDefaultPageLength(endpoint, fallback = 25) {
    try {
        const res = await fetch(endpoint, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const value = Number(data?.value);

        return Number.isInteger(value) && value >= 5 ? value : fallback;
    } catch (err) {
        return fallback;
    }
}

// MAIN DATATABLE INITIALIZATION

/**
 * Initializes DataTable with server-side processing, custom pagination, and grouping
 */
export async function initializeDataTable(endpoint, tableSelector = '#masterTable', options = {}) {
    const {
        columns = generateColumnsFromHeaders(tableSelector),
        pageLength = 7,
        pageLengthEndpoint = null,
        callbacks = {}
    } = options;

    const $table = $(tableSelector);
    if (!$table.length) return null;

    // Destroy existing instance to prevent conflicts
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }

    allLoadedData = [];

    // Fetch server-configured page length if endpoint provided
    let defaultPageLength = pageLength;
    if (pageLengthEndpoint) {
        defaultPageLength = await fetchDefaultPageLength(pageLengthEndpoint);
    }

    $('#sharedLength').val(defaultPageLength);

    // Initialize DataTable with server-side processing
    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        serverSide: true,
        paging: false,
        dom: 't',
        pageLength: defaultPageLength,
        searching: false,
        ordering: true,
        info: false,
        ajax: {
            url: endpoint,
            type: 'POST',
            data: d => {
                const len = parseInt($('#sharedLength').val()) || defaultPageLength;
                const currentPage = parseInt($('#pageInfo').data('page')) || 1;

                // Build AJAX request payload
                d.customSearch = $('#universalSearch').val() || '';
                d.groupByFields = groupBySelectionOrder;
                d.start = (currentPage - 1) * len;
                d.length = len;

                // Append active filter badges
                $('.badge-tag[data-type="Filter"]').each(function () {
                    const key = $(this).data('key');
                    const val = $(this).data('value');

                    if (key && val) {
                        d[key] = d[key] ? [].concat(d[key], val) : [val];
                    }
                });

                return d;
            },
            dataSrc: json => {
                allLoadedData = json.data;
                updateCustomPagination(table);
                return allLoadedData;
            }
        },
        columns,

        // Handles group row insertion and totals calculation
        drawCallback: function () {
            $('#masterTable tbody tr.group-row').remove();
            $('#masterTable tbody tr').show();

            const groupFields = getGroupByFieldsInOrder();

            // Skip grouping if no fields selected
            if (!groupFields.length) {
                updateCustomPagination(table);
                callbacks.onDraw?.();
                return;
            }

            // Process and insert group headers
            const rowData = allLoadedData;
            const lastValues = [];
            const bodyRows = $('#masterTable tbody tr:not(.group-row)').toArray();

            bodyRows.forEach((node, idx) => {
                const data = rowData[idx];
                if (!data) return;

                // Check each grouping level for value changes
                groupFields.forEach((field, lvl) => {
                    const val = data[field] ?? '(Blank)';

                    if (lastValues[lvl] !== val) {
                        const groupVals = [...lastValues.slice(0, lvl), val];
                        const cnt = countRecordsInGroup(rowData, idx, groupFields, lvl, groupVals);
                        const totals = calculateGroupTotals(rowData, idx, groupFields, lvl, groupVals, columns);

                        $(node).before(createGroupHeaderRow(field, val, cnt, lvl, columns, totals));

                        lastValues[lvl] = val;

                        // Reset nested group tracking
                        for (let j = lvl + 1; j < groupFields.length; j++) {
                            lastValues[j] = undefined;
                        }
                    }
                });
            });

            setupGroupRowToggle();
            updateCustomPagination(table);
            callbacks.onDraw?.();
        }
    });

    // Page length change handler
    $('#sharedLength').off('change').on('change', function () {
        $('#pageInfo').data('page', 1);
        table.ajax.reload();
    });

    // Previous page navigation
    $('#prevPage').off('click').on('click', function () {
        let page = $('#pageInfo').data('page') || 1;
        if (page > 1) {
            $('#pageInfo').data('page', page - 1);
            table.ajax.reload();
        }
    });

    // Next page navigation
    $('#nextPage').off('click').on('click', function () {
        let page = $('#pageInfo').data('page') || 1;
        let total = $('#pageInfo').data('total') || 1;
        if (page < total) {
            $('#pageInfo').data('page', page + 1);
            table.ajax.reload();
        }
    });

    // Universal search with debouncing
    $('#universalSearch').off('keyup').on('keyup', () => {
        $('#pageInfo').data('page', 1);
        table.ajax.reload();
    });

    // Group-by selection toggle handler
    $(document).off('click', '#groupByList li[data-group]').on('click', '#groupByList li[data-group]', function () {
        const $li = $(this);
        const field = $li.data('group');
        const txt = $li.text().trim();

        $li.toggleClass('active');

        if ($li.hasClass('active')) {
            if (!groupBySelectionOrder.includes(field)) {
                groupBySelectionOrder.push(field);
            }
            addSearchBadge('Group', field, txt);
        } else {
            groupBySelectionOrder = groupBySelectionOrder.filter(f => f !== field);
            $(`.badge-tag[data-type="Group"][data-value="${field}"]`).remove();
        }

        table.ajax.reload();
    });

    // Filter selection toggle handler
    $(document).off('click', '[data-filter]').on('click', '[data-filter]', function () {
        const val = this.dataset.filter;
        const txt = this.textContent.trim();

        $(this).toggleClass('active');

        if ($(this).hasClass('active')) {
            addSearchBadge('Filter', val, txt);
        } else {
            $(`.badge-tag[data-type="Filter"][data-value="${val}"]`).remove();
        }

        table.ajax.reload();
    });

    activeTables.set(tableSelector, table);

    return table;
}

// GROUPING CALCULATION FUNCTIONS

/** Calculates group totals for columns marked with group-total attribute */
function calculateGroupTotals(rowDataArray, startIndex, groupByFields, level, currentGroupValues, columns) {
    const totals = {};

    columns.forEach(col => {
        if (col.groupTotal) totals[col.data] = 0;
    });

    for (let i = startIndex; i < rowDataArray.length; i++) {
        const row = rowDataArray[i];
        let stillInGroup = true;

        for (let l = 0; l <= level; l++) {
            const field = groupByFields[l];
            if (currentGroupValues[l] !== (row[field] ?? '(Blank)')) {
                stillInGroup = false;
                break;
            }
        }

        if (!stillInGroup) break;

        columns.forEach(col => {
            if (col.groupTotal) {
                totals[col.data] += Number(row[col.data] || 0);
            }
        });
    }

    return totals;
}

/** Counts records belonging to current group */
function countRecordsInGroup(rowDataArray, startIndex, groupByFields, level, currentGroupValues) {
    let count = 0;

    for (let i = startIndex; i < rowDataArray.length; i++) {
        const row = rowDataArray[i];
        let stillInGroup = true;

        for (let l = 0; l <= level; l++) {
            if (currentGroupValues[l] !== (row[groupByFields[l]] ?? '(Blank)')) {
                stillInGroup = false;
                break;
            }
        }

        if (!stillInGroup) break;
        count++;
    }

    return count;
}

/** Creates HTML row element for group header with totals */
function createGroupHeaderRow(field, value, count, level, columns, totals) {
    const displayValue = value || '(Blank)';

    // First column: toggle icon + group label + record count
    let tds = `<td colspan="1" style="padding-left:${level * 20}px;" class="text-nowrap">
        <span class="toggle-icon d-inline-block" style="width:20px;">
            <i class="bx bx-chevron-down"></i>
        </span>
        ${displayValue} <small class="text-muted">(${count})</small>
    </td>`;

    // Remaining columns: show totals where applicable
    columns.forEach((col, i) => {
        if (i === 0) return;

        if (col.groupTotal) {
            const formattedTotal = totals[col.data]?.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) || '';

            tds += `<td class="text-end fw-semibold">${formattedTotal}</td>`;
        } else {
            tds += '<td></td>';
        }
    });

    return $(`<tr class="group-row level-${level}">${tds}</tr>`);
}

// GROUP ROW TOGGLE FUNCTIONALITY

/** Sets up click handlers for collapsing/expanding group rows */
function setupGroupRowToggle() {
    $('#masterTable tbody')
        .off('click', 'tr.group-row')
        .on('click', 'tr.group-row', function () {
            const $row = $(this);
            const level = parseInt($row[0].className.match(/level-(\d+)/)?.[1] || 0);
            const willCollapse = !$row.hasClass('collapsed');

            $row.toggleClass('collapsed', willCollapse);
            $row.find('.toggle-icon i')
                .toggleClass('bx-chevron-down', !willCollapse)
                .toggleClass('bx-chevron-right', willCollapse);

            // Toggle visibility of child rows until next same/higher level group
            let $next = $row.next();
            while ($next.length) {
                const nextLevel = parseInt($next[0].className.match(/level-(\d+)/)?.[1] || 999);

                if (nextLevel <= level) break;

                if ($next.hasClass('group-row')) {
                    if (willCollapse) {
                        $next.hide().addClass('collapsed');
                        $next.find('.toggle-icon i')
                            .removeClass('bx-chevron-down')
                            .addClass('bx-chevron-right');
                    } else {
                        $next.show().removeClass('collapsed');
                        $next.find('.toggle-icon i')
                            .removeClass('bx-chevron-right')
                            .addClass('bx-chevron-down');
                    }
                } else {
                    $next.toggle(!willCollapse);
                }

                $next = $next.next();
            }
        });
}

// BADGE MANAGEMENT

/** Adds filter or group-by badge to search bar */
export function addSearchBadge(type, value, displayText, isLocked = false) {
    if ($(`.badge-tag[data-type="${type}"][data-value="${value}"]`).length) return;

    const icon = type === 'Group' ? GROUP_ICON :
        `<span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>`;
    const removeBtn = isLocked ? '' : '<span class="remove-btn ms-1" style="cursor:pointer;">×</span>';
    const lockedClass = isLocked ? 'opacity-75 cursor-not-allowed' : '';

    const $badge = $(`
        <span class="badge-tag d-inline-flex align-items-center ${lockedClass}"
              data-type="${type}" data-value="${value}" data-locked="${isLocked ? '1' : '0'}">
            ${icon}
            <span class="badge-text ms-1">${displayText}</span>
            ${removeBtn}
        </span>
    `);

    // Remove button click handler
    if (!isLocked) {
        $badge.find('.remove-btn').on('click', function (e) {
            e.stopPropagation();
            const $b = $(this).closest('.badge-tag');
            const t = $b.data('type');
            const v = $b.data('value');

            if (t === 'Group') {
                groupBySelectionOrder = groupBySelectionOrder.filter(f => f !== v);
                $(`#groupByList li[data-group="${v}"]`).removeClass('active');
            }

            $b.remove();
            activeTables.get('#masterTable')?.ajax.reload();
        });

        if (type === 'Filter') {
            $badge.find('.filter-icon').on('click', function (e) {
                e.stopPropagation();
                openFilterModal(value, $badge);
            });
        }
    }

    $('#universalSearch').before($badge);
}

// STEPPER INITIALIZATION

/** Initializes BS Stepper component */
export function initStepper() {
    const el = document.querySelector('#wizardStepper');
    if (el) window.stepper = new Stepper(el, { linear: false });
    return window.stepper;
}

// CHECKBOX SELECTION WITH BULK OPERATIONS

/**
 * Initializes checkbox-based row selection with bulk action support
 */
export function initCheckboxSelection(table, tableSelector = '#masterTable', dropdownConfig = [], bulkDeleteEndpoint = null) {
    const selectedRowIds = new Set();
    const $table = $(tableSelector);
    const $searchContainer = $('#universalSearch').closest('.input-group');

    // Default dropdown actions configuration
    const defaultDropdownConfig = [
        {
            id: 'action-select-all',
            label: 'Select All (this page)',
            icon: 'bx bx-check-square',
            class: ''
        },
        {
            id: 'action-select-none',
            label: 'Clear Selection',
            icon: 'bx bx-x-circle',
            class: '',
            requiresSelection: true
        }
    ];

    if (bulkDeleteEndpoint) {
        defaultDropdownConfig.push({
            id: 'action-bulk-delete',
            label: 'Delete Selected',
            icon: 'bx bx-trash',
            class: 'text-danger',
            requiresSelection: true
        });
    }

    const finalDropdownConfig = dropdownConfig.length > 0 ? dropdownConfig : defaultDropdownConfig;

    // Build selection control UI
    const $selectionControls = $(`
        <div class="d-flex align-items-center gap-2 ms-2">
            <div class="position-relative">
                <i class="bx bx-cog text-muted" 
                   style="cursor:pointer; font-size:1.2rem;" 
                   id="selection-actions-toggle"
                   title="Selection Actions"></i>

                <div class="dropdown-menu dropdown-menu-end shadow-sm p-1" 
                     id="selection-actions-menu" 
                     style="min-width: 200px; font-size:0.9rem; z-index: 1050;">
                    ${finalDropdownConfig.map(item => `
                        <button class="dropdown-item py-1 ${item.class || ''}" 
                                id="${item.id}">
                            <i class="${item.icon} me-2"></i>${item.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="badge bg-primary d-none" id="selected-badge" 
                 style="display:flex; align-items:center; font-size:0.85rem;">
                <span id="selected-count"></span>
                <button type="button" class="btn-close btn-close-white ms-2" 
                        id="deselect-all" style="font-size:0.7rem;" 
                        aria-label="Clear selection"></button>
            </div>
        </div>
    `);

    $searchContainer.after($selectionControls);

    /** Performs bulk delete operation with confirmation */
    function performBulkDelete() {
        if (selectedRowIds.size === 0) {
            Swal.fire({
                title: 'No Selection',
                text: 'Please select at least one item to delete.',
                icon: 'warning',
                timer: 2000
            });
            return;
        }

        Swal.fire({
            title: 'Confirm Bulk Delete',
            html: `Are you sure you want to delete <strong>${selectedRowIds.size}</strong> selected item(s)?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                const loadingToast = Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the selected items',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const data = {
                    ids: Array.from(selectedRowIds),
                    _token: $('meta[name="csrf-token"]').attr('content')
                };

                $.ajax({
                    url: bulkDeleteEndpoint,
                    method: 'POST',
                    data: data,
                    success: function (response) {
                        loadingToast.close();

                        if (response.success) {
                            selectedRowIds.clear();

                            Swal.fire({
                                title: 'Deleted!',
                                text: response.message || `${selectedRowIds.size} item(s) deleted successfully.`,
                                icon: 'success',
                                timer: 2000,
                                showConfirmButton: false
                            });

                            table.ajax.reload(null, false);
                            updateSelectionUI();
                        } else {
                            Swal.fire('Error!', response.message || 'Failed to delete items', 'error');
                        }
                    },
                    error: function (xhr, status, error) {
                        loadingToast.close();
                        Swal.fire('Error!', 'An error occurred while deleting items. Please try again.', 'error');
                    }
                });
            }
        });
    }

    /** Selects all rows on current page */
    function selectAllCurrentPage() {
        $table.find('tbody .row-selector').each(function () {
            const $cb = $(this);
            const id = String($cb.data('id') ?? '');

            if (id) {
                selectedRowIds.add(id);
                $cb.prop('checked', true);
                $cb.closest('tr').addClass('table-active');
            }
        });
        updateSelectionUI();
    }

    /** Clears all selections across all pages */
    function selectNone() {
        $table.find('tbody .row-selector').each(function () {
            const $cb = $(this);
            const id = String($cb.data('id') ?? '');

            if (id) {
                selectedRowIds.delete(id);
                $cb.prop('checked', false);
                $cb.closest('tr').removeClass('table-active');
            }
        });
        updateSelectionUI();
    }

    /** Updates UI elements based on current selection state */
    function updateSelectionUI() {
        const count = selectedRowIds.size;

        if (count > 0) {
            $('#selected-count').text(`${count} selected`);
            $('#selected-badge').removeClass('d-none');
            $searchContainer.addClass('d-none');
            $('#action-bulk-delete').prop('disabled', false);
        } else {
            $('#selected-badge').addClass('d-none');
            $searchContainer.removeClass('d-none');
            $('#action-bulk-delete').prop('disabled', true);
        }

        // Update header checkbox state (checked/indeterminate/unchecked)
        const $visible = $table.find('tbody .row-selector');
        const checkedCount = $visible.filter(':checked').length;
        const totalVisible = $visible.length;

        $('#select-all')
            .prop('checked', totalVisible > 0 && checkedCount === totalVisible)
            .prop('indeterminate', checkedCount > 0 && checkedCount < totalVisible);
    }

    /** Restores checkbox states after table redraw */
    function restoreSelections() {
        $table.find('tbody .row-selector').each(function () {
            const $cb = $(this);
            const id = String($cb.data('id') ?? '');

            if (id && selectedRowIds.has(id)) {
                $cb.prop('checked', true);
                $cb.closest('tr').addClass('table-active');
            } else {
                $cb.prop('checked', false);
                $cb.closest('tr').removeClass('table-active');
            }
        });
    }

    // Event: Header "Select All" checkbox
    $(document).on('change', '#select-all', function () {
        const isChecked = this.checked;

        $table.find('tbody .row-selector').each(function () {
            const $cb = $(this);
            const id = String($cb.data('id') ?? '');
            if (!id) return;

            if (isChecked) {
                selectedRowIds.add(id);
            } else {
                selectedRowIds.delete(id);
            }

            $cb.prop('checked', isChecked);
            $cb.closest('tr').toggleClass('table-active', isChecked);
        });

        updateSelectionUI();
    });

    // Event: Individual row checkbox
    $(document).on('change', `${tableSelector} .row-selector`, function () {
        const id = String($(this).data('id') ?? '');
        if (!id) return;

        if (this.checked) {
            selectedRowIds.add(id);
        } else {
            selectedRowIds.delete(id);
        }

        $(this).closest('tr').toggleClass('table-active', this.checked);
        updateSelectionUI();
    });

    // Event: Toggle dropdown menu
    $(document).on('click', '#selection-actions-toggle', function (e) {
        e.stopPropagation();
        $('#selection-actions-menu').toggleClass('show');
    });

    // Event: Close dropdown on outside click
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#selection-actions-toggle, #selection-actions-menu').length) {
            $('#selection-actions-menu').removeClass('show');
        }
    });

    // Event: Select all button
    $(document).on('click', '#action-select-all', function (e) {
        e.preventDefault();
        selectAllCurrentPage();
        $('#selection-actions-menu').removeClass('show');
    });

    // Event: Clear selection button
    $(document).on('click', '#action-select-none', function (e) {
        e.preventDefault();
        selectNone();
        $('#selection-actions-menu').removeClass('show');
    });

    // Event: Bulk delete button
    if (bulkDeleteEndpoint) {
        $(document).on('click', '#action-bulk-delete', function (e) {
            e.preventDefault();
            performBulkDelete();
            $('#selection-actions-menu').removeClass('show');
        });
    }

    // Event: Custom actions from config
    dropdownConfig.forEach(item => {
        if (item.id && item.action && typeof item.action === 'function') {
            $(document).on('click', `#${item.id}`, function (e) {
                e.preventDefault();
                item.action(table, $table, selectedRowIds);
                $('#selection-actions-menu').removeClass('show');
                updateSelectionUI();
            });
        }
    });

    // Event: Clear all badge button
    $(document).on('click', '#deselect-all', function (e) {
        e.preventDefault();
        selectedRowIds.clear();
        $table.find('.row-selector').prop('checked', false);
        $table.find('tr.table-active').removeClass('table-active');
        $('#select-all').prop({ checked: false, indeterminate: false });
        updateSelectionUI();
    });

    // Event: Keyboard shortcut for bulk delete (Ctrl+Shift+D)
    $(document).on('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            if (bulkDeleteEndpoint && selectedRowIds.size > 0) {
                performBulkDelete();
            }
        }
    });

    // Restore selections after table redraw
    table.on('draw', () => {
        restoreSelections();
        updateSelectionUI();
    });

    table.on('init', updateSelectionUI);

    // Expose public API methods
    table.getSelectedIds = () => [...selectedRowIds];
    table.clearSelection = () => {
        selectedRowIds.clear();
        updateSelectionUI();
    };
    if (bulkDeleteEndpoint) {
        table.bulkDelete = performBulkDelete;
    }

    return {
        getSelectedIds: () => [...selectedRowIds],
        clearSelection: () => {
            selectedRowIds.clear();
            updateSelectionUI();
        },
        updateUI: updateSelectionUI,
        selectAll: selectAllCurrentPage,
        selectNone: selectNone
    };
}

// UTILITY FUNCTIONS

/** Returns array of selected row IDs */
export function getSelectedIds(tableSelector = '#masterTable') {
    return $(`${tableSelector} .row-selector:checked`)
        .map((i, el) => $(el).data('id'))
        .get();
}

/** Clears all row selections and resets UI state */
export function clearAllSelections(tableSelector = '#masterTable') {
    $(`${tableSelector} #select-all`).prop({ checked: false, indeterminate: false });
    $(`${tableSelector} .row-selector`).prop('checked', false);
    $(`${tableSelector} tr.table-active`).removeClass('table-active');
}

// FORM MANAGEMENT FUNCTIONS

/** Loads create/edit form via AJAX and updates UI state */
export function loadForm(basePath, mode, id = null, voucherNo = null, compprefix = null) {
    const url = mode === 'create'
        ? `${basePath}/Create`
        : `${basePath}/Edit/${id}`;

    const newPath = mode === 'create'
        ? `${basePath}/Create`
        : `${basePath}/${voucherNo}-${compprefix}`;

    window.history.pushState({ mode, id }, '', newPath);
    //searchContainer
    // Adjust UI for form view
    $('#searchContainer').addClass('d-none');
    $('.bx bx-cog text-muted').addClass('d-none');
    $('#selection-actions-toggle').addClass('d-none');
    $('.default-load-info').addClass('d-none');
    $('#personal-info').css('background-color', 'var(--bs-body-bg)');
    $('#btnCreate').removeClass('btn-primary').addClass('btn-outline-primary btn-sm shadow-none');
    $('#universalSearch, #sharedLength, #customPagination, .input-group-text').hide();

    $.get(url).done(html => {
        $('#personal-info').html(html);
        if (window.stepper) window.stepper.to(2);
    });
}

/** Handles direct URL navigation for create/edit modes */
export function handleDirectUrl(basePath) {
    const parts = location.pathname.split('/').filter(p => p);
    const action = parts.pop();
    const maybeId = parts.pop();

    if (action === 'Create') {
        loadForm(basePath, 'create');
    } else if (action === 'Edit' && maybeId) {
        loadForm(basePath, 'edit', maybeId);
    }
}

/** Returns to list view and resets form state */
export function goBackToList(table, basePath) {
    $('#personal-info').empty();
    $('#btnCreate').removeClass('btn-outline-primary btn-sm shadow-none').addClass('btn-primary');
    $('#universalSearch, #sharedLength, #customPagination, .input-group-text').show();

    if (window.stepper) window.stepper.to(1);

    if ($.fn.DataTable.isDataTable('#masterTable')) {
        table.clear().destroy();
    }

    $('#masterTable tbody').empty();

    window.history.pushState({}, '', `${basePath}/list`);
    location.reload();
}

/** Attaches click handler to create button */
export function handleCreateButton(basePath) {
    $('#btnCreate').off('click').on('click', () => loadForm(basePath, 'create'));
}

// ROW ACTION HANDLERS

/** Sets up event handlers for edit, delete, and print buttons */
export function handleRowActions(basePath, callbacks = {}) {
    $(document).off('click', '#masterTable .edit-btn, #masterTable .delete-btn, #masterTable .print-btn');

    // Edit button handler
    $(document).on('click', '#masterTable .edit-btn', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const voucher = $(this).data('voucher');
        const compprefix = $(this).data('compprefix');

        if (id) loadForm(basePath, 'edit', id, voucher, compprefix);
    });

    // Delete button handler with confirmation
    $(document).on('click', '#masterTable .delete-btn', function () {
        const id = $(this).data('id');

        if (id) {
            Swal.fire({
                title: 'Delete Record?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel'
            }).then(result => {
                if (result.isConfirmed) {
                    const $row = $(this).closest('tr');

                    $.post(`${basePath}/Delete`, { id })
                        .done(res => {
                            if (res.success) {
                                showToast('Success', 'Deleted!', 'success');
                                if (callbacks.onDelete) callbacks.onDelete(id, $row);
                            } else {
                                showToast('Error', res.message || 'Failed', 'error');
                            }
                        })
                        .fail(() => showToast('Error', 'Server Error', 'error'));
                }
            });
        }
    });

    // Print button handler
    $(document).on('click', '#masterTable .print-btn', function () {
        const id = $(this).data('id');

        if (id) {
            if (callbacks.onPrint) {
                callbacks.onPrint(id);
            } else {
                window.open(`${basePath}/Pdf/${id}`, '_blank');
            }
        }
    });
}


// ROW CLICK = EDIT (exportable, page-controlled)
export function enableRowClickEdit({
    tableSelector = '#masterTable',
    basePath,
    exclude = 'button, a, input, label, .row-selector, .delete-btn, .print-btn'
}) {
    if (!basePath) {
        console.warn('enableRowClickEdit: basePath is required');
        return;
    }

    $(document)
        .off('click.rowEdit', `${tableSelector} tbody tr`)
        .on('click.rowEdit', `${tableSelector} tbody tr`, function (e) {

            // Ignore action / interactive elements
            if ($(e.target).closest(exclude).length) return;

            // Ignore group rows
            if ($(this).hasClass('group-row')) return;

            const table = $(tableSelector).DataTable();
            const rowData = table.row(this).data();

            if (!rowData || !rowData.id) return;

            loadForm(
                basePath,
                'edit',
                rowData.id,
                rowData.voucher,
                rowData.prefix
            );
        });
}


// RESPONSIVE HANDLING

/** Adjusts DataTable columns on window resize */
window.addEventListener('resize', function () {
    if ($.fn.DataTable.isDataTable('#masterTable')) {
        $('#masterTable').DataTable().columns.adjust().draw(false);
    }
});

// PAGINATION UI UPDATE

/** Updates custom pagination controls based on table state */
function updateCustomPagination(table) {
    if (!table) return;

    const info = table.page.info ? table.page.info() : { recordsDisplay: 0, pages: 1, page: 0 };
    const len = parseInt($('#sharedLength').val()) || table.page.len();
    const totalRecords = info.recordsDisplay || 0;
    const totalPages = Math.ceil(totalRecords / len) || 1;
    const currentPage = $('#pageInfo').data('page') || 1;

    $('#pageInfo').text(`${currentPage} / ${totalPages}`);
    $('#pageInfo').data('total', totalPages);

    $('#prevPage').prop('disabled', currentPage <= 1);
    $('#nextPage').prop('disabled', currentPage >= totalPages);

    $('#customPagination').toggleClass('d-none', totalRecords === 0);
}

// FAVORITE VIEW MANAGEMENT

/** Applies saved favorite view (filters, grouping, locked state) */
export function applyFavorite(view) {
    let filters = {};
    let groups = [];

    try {
        filters = JSON.parse(view.filters || '{}');
    } catch (e) {
        // Silent fail for invalid JSON
    }

    try {
        groups = JSON.parse(view.groupBy || '[]');
    } catch (e) {
        // Silent fail for invalid JSON
    }

    // Reset UI state
    $('.badge-tag').remove();
    groupBySelectionOrder.length = 0;
    $('#groupByList li').removeClass('active');
    const isLocked = !!view.IsLocked;

    // Restore filter badges
    Object.keys(filters).forEach(key => {
        (filters[key] || []).forEach(savedValue => {
            const displayText = savedValue;

            const $badge = $(`
                <span class="badge-tag d-inline-flex align-items-center ${isLocked ? 'opacity-75 cursor-not-allowed' : ''}"
                      data-type="Filter"
                      data-value="${savedValue}"
                      data-key="${key}">
                    <span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>
                    <span class="badge-text ms-1">${savedValue}</span>
                    ${isLocked ? '' : '<span class="remove-btn ms-1" style="cursor:pointer;">×</span>'}
                </span>
            `);

            $('#universalSearch').before($badge);
        });
    });

    // Restore group-by selections
    groups.forEach(g => {
        if (!groupBySelectionOrder.includes(g)) {
            groupBySelectionOrder.push(g);
            $('#groupByList li[data-group="' + g + '"]').addClass('active');
            addSearchBadge('Group', g, g.charAt(0).toUpperCase() + g.slice(1), isLocked);
        }
    });

    resetToFirstPage();
}

// TOAST NOTIFICATIONS

/** Displays toast notification using SweetAlert2 */
export function showToast(title = '', text = 'Saved!', icon = 'success') {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon,
        title: text,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}

// DEFAULT PAGE LENGTH MANAGEMENT

/** Loads and displays default page length from server */
export async function loadAndDisplayDefaultPageLength(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        const defaultLoad = Number(data.value) || 20;
        const viewId = Number(data.id) || 0;

        const textEl = document.getElementById('defaultLoadText');
        const inputEl = document.getElementById('defaultLoadInput');

        if (textEl) {
            textEl.textContent = `${defaultLoad} records`;
            textEl.dataset.viewId = viewId;
        }
        if (inputEl) inputEl.value = defaultLoad;

        return { defaultLoad, viewId };
    } catch (err) {
        const fallback = 20;
        const textEl = document.getElementById('defaultLoadText');
        if (textEl) {
            textEl.textContent = `${fallback} records (fallback)`;
            textEl.dataset.viewId = '0';
        }
        return { defaultLoad: fallback, viewId: 0 };
    }
}

/** Initializes inline editor for default page length setting */
export function initDefaultPageLengthEditor({
    reportKey,
    viewName = 'DefaultView',
    isDefault = true,
    groupBySelectionOrder = [],
    saveEndpoint = '/Accounting/Report/SaveReportView',
    minValue = 5,
    maxValue = 500,
    textSelector = '#defaultLoadText',
    inputSelector = '#defaultLoadInput',
    editBlockSelector = '#editDefaultLoad',
    changeBtnSelector = '#changeDefaultBtn',
    hintSelector = '#defaultLoadHint',
} = {}) {
    if (!reportKey) {
        return;
    }

    const textEl = document.querySelector(textSelector);
    const inputEl = document.querySelector(inputSelector);
    const editBlock = document.querySelector(editBlockSelector);
    const changeBtn = document.querySelector(changeBtnSelector);
    const hintEl = document.querySelector(hintSelector);

    if (!textEl || !inputEl || !editBlock || !changeBtn || !hintEl) {
        return;
    }

    let originalValue = null;

    /** Switches to edit mode for page length */
    function enterEditMode() {
        originalValue = inputEl.value;
        document.querySelectorAll(`${textSelector}, ${changeBtnSelector}`).forEach(el => el.classList.add('d-none'));
        editBlock.classList.remove('d-none');
        hintEl.classList.remove('text-danger');
        hintEl.textContent = `Enter number between ${minValue} and ${maxValue}`;
        inputEl.focus();
        inputEl.select();
    }

    /** Exits edit mode, optionally restoring original value */
    function exitEditMode(restore = false) {
        if (restore && originalValue !== null) inputEl.value = originalValue;
        editBlock.classList.add('d-none');
        document.querySelectorAll(`${textSelector}, ${changeBtnSelector}`).forEach(el => el.classList.remove('d-none'));
        hintEl.classList.remove('text-danger');
    }

    changeBtn.addEventListener('click', enterEditMode);
    textEl.addEventListener('click', enterEditMode);

    // Handle Enter/Escape keys in edit mode
    inputEl.addEventListener('keydown', async (e) => {
        if (e.key === 'Escape') {
            exitEditMode(true);
            return;
        }
        if (e.key !== 'Enter') return;

        const raw = inputEl.value.trim();
        const newValue = Number(raw);

        // Validate input
        if (!raw || Number.isNaN(newValue) || !Number.isInteger(newValue) ||
            newValue < minValue || newValue > maxValue) {
            hintEl.textContent = `Please enter integer ${minValue}–${maxValue}`;
            hintEl.classList.add('text-danger');
            return;
        }

        try {
            const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
            const currentViewId = Number(textEl.dataset.viewId) || 0;

            const payload = {
                Id: currentViewId > 0 ? currentViewId : undefined,
                ViewName: viewName,
                ReportKey: reportKey,
                PageLenght: newValue,
                Filters: '{}',
                GroupBy: JSON.stringify(groupBySelectionOrder),
                IsDefault: isDefault
            };

            const response = await fetch(saveEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text().catch(() => '');
                throw new Error(`Save failed: ${response.status} - ${errText}`);
            }

            const result = await response.json();

            textEl.textContent = `${newValue} records`;

            if (result?.success && result?.id > 0) {
                textEl.dataset.viewId = result.id;
            }

            exitEditMode();

            Swal.fire({
                title: 'Reload Required',
                text: 'Page length updated. Reload page to apply?',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Reload Now',
                cancelButtonText: 'Later'
            }).then(r => {
                if (r.isConfirmed) window.location.reload();
            });
        } catch (err) {
            hintEl.textContent = 'Failed to save. Try again.';
            hintEl.classList.add('text-danger');
        }
    });

    // Cancel edit on outside click
    document.addEventListener('click', e => {
        if (!editBlock.contains(e.target) && !changeBtn.contains(e.target) && !textEl.contains(e.target)) {
            if (!editBlock.classList.contains('d-none')) exitEditMode(true);
        }
    });
}

// CLEANUP FUNCTIONS

/** Destroys all active DataTable instances */
export function destroyAllTables() {
    activeTables.forEach((table, selector) => {
        if ($.fn.DataTable.isDataTable(selector)) {
            table.destroy();
        }
    });
    activeTables.clear();
}

/** Reloads active table and resets to first page */
export function resetToFirstPage() {
    activeTables.get('#masterTable')?.ajax.reload();
}