// DataTable Utilities 4:43PM 1-30-2026

// Global State Management

let activeTables = new Map();               // Stores active DataTable instances
export let groupBySelectionOrder = [];      // Maintains ordered list of group-by fields
let allLoadedData = [];                     // Stores current page data for client-side operations

// Constants and SVG Icons

const FILTER_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,4H21V6H3V4M6,10H18V12H6V10M10,16H14V18H10V16Z"></path></svg>`;
const GROUP_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,13H9V19H3V13M3,5H9V11H3V5M11,5H21V11H11V5M11,13H21V19H11V13Z"></path></svg>`;

// Column Configuration Generator


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

        // Initialize column definition with base properties
        const colDef = {
            title: header,
            width: width || undefined,
            groupTotal: isGroupTotal,
        };

        // Set column visibility
        if (!active) colDef.visible = false;

        // Configure text alignment
        if (align) {
            const alignment = align === 'right' ? 'end' :
                align === 'center' ? 'center' : 'start';
            colDef.className = `text-${alignment}`;
        }

        // Configure data binding
        if (datafield) {
            colDef.data = datafield;
        } else {
            colDef.data = null;
            colDef.orderable = false;
        }

        // Custom Renderers - Action Buttons

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
        // Checkbox selection column
        else if (renderType === 'checkbox') {
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
        // Status badge renderer
        else if (renderType === 'status') {
            colDef.render = (data, type, row) => {
                const status = row.status || data;
                const badgeClass = status === 'Active' ? 'badge bg-success' :
                    status === 'Inactive' ? 'badge bg-danger' :
                        'badge bg-secondary';
                return `<span class="${badgeClass}">${status}</span>`;
            };
        }

        // Numeric Amount Formatting

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

        // Date Formatting

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

// Helper Functions

function getGroupByFieldsInOrder() {
    return groupBySelectionOrder;
}

async function fetchDefaultPageLength(endpoint) {
    try {
        const response = await $.ajax({
            url: endpoint,
            type: 'GET',
            dataType: 'json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response && response.value) {
            return response.value;
        }

        console.warn('No value in response, using default: 20');
        return 20;

    } catch (error) {
        console.error('Error fetching default page length from:', endpoint);
        console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            responseText: error.responseText,
            error: error
        });

        console.warn('Falling back to default page length: 20');
        return 20; // Fallback default
    }
}


// Main DataTable Initialization


export async function initializeDataTable(endpoint, tableSelector = '#masterTable', options = {}) {
    const {
        columns = generateColumnsFromHeaders(tableSelector),
        pageLength = 7,
        pageLengthEndpoint = null,
        callbacks = {}
    } = options;

    const $table = $(tableSelector);
    if (!$table.length) return null;

    // Destroy existing DataTable instance if present
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }

    // Reset state variables
    allLoadedData = [];

    // Fetch database-configured page length if endpoint provided
    let defaultPageLength = pageLength;
    if (pageLengthEndpoint) {
        defaultPageLength = await fetchDefaultPageLength(pageLengthEndpoint);
    }

    // Set the page length in the UI dropdown
    $('#sharedLength').val(defaultPageLength);

    // Initialize DataTable with server-side processing
    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        serverSide: true,
        paging: false,              // Custom pagination handled manually
        dom: 't',                   // Only table element (no built-in controls)
        pageLength: defaultPageLength,
        searching: false,           // Custom search implementation
        ordering: true,
        info: false,                // Custom info display
        ajax: {
            url: endpoint,
            type: 'POST',
            data: d => {
                // Retrieve page configuration from UI
                const len = parseInt($('#sharedLength').val()) || defaultPageLength;
                const currentPage = parseInt($('#pageInfo').data('page')) || 1;

                // Build request payload
                d.customSearch = $('#universalSearch').val() || '';
                d.groupByFields = groupBySelectionOrder;
                d.start = (currentPage - 1) * len;
                d.length = len;

                // Append active filter badges to request
                $('.badge-tag[data-type="Filter"]').each(function () {
                    const key = $(this).data('key');
                    const val = $(this).data('value');

                    console.log('Filter applied - Key:', key, 'Value:', val);
                    if (key && val) {
                        d[key] = d[key] ? [].concat(d[key], val) : [val];
                    }
                });

                //console.log('AJAX Request Payload:', d);
                return d;
            },
            dataSrc: json => {
                // Store loaded data for client-side operations
                allLoadedData = json.data;
                updateCustomPagination(table);
                return allLoadedData;
            }
        },
        columns,

        // Draw Callback - Handles Grouping Logic

        drawCallback: function () {
            // Remove existing group rows and show all data rows
            $('#masterTable tbody tr.group-row').remove();
            $('#masterTable tbody tr').show();

            const groupFields = getGroupByFieldsInOrder();

            // If no grouping is active, skip group row insertion
            if (!groupFields.length) {
                updateCustomPagination(table);
                callbacks.onDraw?.();
                return;
            }

            // Process and insert group header rows
            const rowData = allLoadedData;
            const lastValues = [];
            const bodyRows = $('#masterTable tbody tr:not(.group-row)').toArray();

            bodyRows.forEach((node, idx) => {
                const data = rowData[idx];
                if (!data) return;

                // Check each grouping level for value changes
                groupFields.forEach((field, lvl) => {
                    const val = data[field] ?? '(Blank)';

                    // Insert group header when value changes
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

    // Event Handlers - Pagination and Search Controls

    // Page length change handler
    $('#sharedLength').off('change').on('change', function () {
        $('#pageInfo').data('page', 1); // Reset to first page
        table.ajax.reload();
    });

    // Previous page button
    $('#prevPage').off('click').on('click', function () {
        let page = $('#pageInfo').data('page') || 1;
        if (page > 1) {
            $('#pageInfo').data('page', page - 1);
            table.ajax.reload();
        }
    });

    // Next page button
    $('#nextPage').off('click').on('click', function () {
        let page = $('#pageInfo').data('page') || 1;
        let total = $('#pageInfo').data('total') || 1;
        if (page < total) {
            $('#pageInfo').data('page', page + 1);
            table.ajax.reload();
        }
    });

    // Universal search handler
    $('#universalSearch').off('keyup').on('keyup', () => {
        $('#pageInfo').data('page', 1); // Reset to first page on search
        table.ajax.reload();
    });

    // Group-By Selection Handler

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

    // Filter Selection Handler

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

    // Store table instance in active tables registry
    activeTables.set(tableSelector, table);

    return table;
}

// Grouping Calculation Functions


function calculateGroupTotals(rowDataArray, startIndex, groupByFields, level, currentGroupValues, columns) {
    const totals = {};

    // Initialize totals for columns marked as group-total
    columns.forEach(col => {
        if (col.groupTotal) totals[col.data] = 0;
    });

    // Iterate through records in the current group
    for (let i = startIndex; i < rowDataArray.length; i++) {
        const row = rowDataArray[i];
        let stillInGroup = true;

        // Check if row belongs to current group
        for (let l = 0; l <= level; l++) {
            const field = groupByFields[l];
            if (currentGroupValues[l] !== (row[field] ?? '(Blank)')) {
                stillInGroup = false;
                break;
            }
        }

        if (!stillInGroup) break;

        // Accumulate totals
        columns.forEach(col => {
            if (col.groupTotal) {
                totals[col.data] += Number(row[col.data] || 0);
            }
        });
    }

    return totals;
}


function countRecordsInGroup(rowDataArray, startIndex, groupByFields, level, currentGroupValues) {
    let count = 0;

    for (let i = startIndex; i < rowDataArray.length; i++) {
        const row = rowDataArray[i];
        let stillInGroup = true;

        // Verify row membership in current group
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

function createGroupHeaderRow(field, value, count, level, columns, totals) {
    const displayValue = value || '(Blank)';

    // First column with toggle icon and group label
    let tds = `<td colspan="1" style="padding-left:${level * 20}px;" class="text-nowrap">
        <span class="toggle-icon d-inline-block" style="width:20px;">
            <i class="bx bx-chevron-down"></i>
        </span>
        ${displayValue} <small class="text-muted">(${count})</small>
    </td>`;

    // Subsequent columns with totals where applicable
    columns.forEach((col, i) => {
        if (i === 0) return; // Skip first column (already rendered)

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

// Group Row Toggle Functionality


function setupGroupRowToggle() {
    $('#masterTable tbody')
        .off('click', 'tr.group-row')
        .on('click', 'tr.group-row', function () {
            const $row = $(this);
            const level = parseInt($row[0].className.match(/level-(\d+)/)?.[1] || 0);
            const willCollapse = !$row.hasClass('collapsed');

            // Toggle collapsed state and icon
            $row.toggleClass('collapsed', willCollapse);
            $row.find('.toggle-icon i')
                .toggleClass('bx-chevron-down', !willCollapse)
                .toggleClass('bx-chevron-right', willCollapse);

            // Process all following rows until a same/higher level group is found
            let $next = $row.next();
            while ($next.length) {
                const nextLevel = parseInt($next[0].className.match(/level-(\d+)/)?.[1] || 999);

                // Stop at same or higher level group
                if (nextLevel <= level) break;

                if ($next.hasClass('group-row')) {
                    // Handle nested group rows
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
                    // Handle data rows
                    $next.toggle(!willCollapse);
                }

                $next = $next.next();
            }
        });
}


export function addSearchBadge(type, value, displayText, isLocked = false) {
    // Prevent duplicate badges
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

        // Filter icon click handler (if applicable)
        if (type === 'Filter') {
            $badge.find('.filter-icon').on('click', function (e) {
                e.stopPropagation();
                openFilterModal(value, $badge);
            });
        }
    }

    $('#universalSearch').before($badge);
}

// Stepper Initialization

export function initStepper() {
    const el = document.querySelector('#wizardStepper');
    if (el) window.stepper = new Stepper(el, { linear: false });
    return window.stepper;
}

// Checkbox Selection with Bulk Operations


export function initCheckboxSelection(table, tableSelector = '#masterTable', dropdownConfig = [], bulkDeleteEndpoint = null) {
    const selectedRowIds = new Set(); // Persistent storage of selected IDs
    const $table = $(tableSelector);
    const $searchContainer = $('#universalSearch').closest('.input-group');

    // Build Selection Control UI

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

    // Add bulk delete option if endpoint provided
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

    // Create control elements
    const $selectionControls = $(`
        <div class="d-flex align-items-center gap-2 ms-2">
            <!-- Settings Icon (dropdown trigger) -->
            <div class="position-relative">
                <i class="bx bx-cog text-muted" 
                   style="cursor:pointer; font-size:1.2rem;" 
                   id="selection-actions-toggle"
                   title="Selection Actions"></i>

                <!-- Dropdown Menu -->
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

            <!-- Selected count badge -->
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

    // Bulk Delete Function

  
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
                // Show loading indicator
                const loadingToast = Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the selected items',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Prepare request payload
                const data = {
                    ids: Array.from(selectedRowIds),
                    _token: $('meta[name="csrf-token"]').attr('content')
                };

                // Execute AJAX delete request
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

                            // Refresh table data
                            table.ajax.reload(null, false);
                            updateSelectionUI();
                        } else {
                            Swal.fire('Error!', response.message || 'Failed to delete items', 'error');
                        }
                    },
                    error: function (xhr, status, error) {
                        loadingToast.close();
                        Swal.fire('Error!', 'An error occurred while deleting items. Please try again.', 'error');
                        console.error('Bulk delete error:', error);
                    }
                });
            }
        });
    }

    // Selection Management Functions

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

    /**
     * Clears all selections
     */
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

    function updateSelectionUI() {
        const count = selectedRowIds.size;

        if (count > 0) {
            $('#selected-count').text(`${count} selected`);
            $('#selected-badge').removeClass('d-none');
            $searchContainer.addClass('d-none');

            // Enable selection-dependent actions
            $('#action-bulk-delete').prop('disabled', false);
        } else {
            $('#selected-badge').addClass('d-none');
            $searchContainer.removeClass('d-none');

            // Disable selection-dependent actions
            $('#action-bulk-delete').prop('disabled', true);
        }

        // Update header checkbox state
        const $visible = $table.find('tbody .row-selector');
        const checkedCount = $visible.filter(':checked').length;
        const totalVisible = $visible.length;

        $('#select-all')
            .prop('checked', totalVisible > 0 && checkedCount === totalVisible)
            .prop('indeterminate', checkedCount > 0 && checkedCount < totalVisible);
    }

  
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

    // Event Handlers

    // Header "Select All" checkbox (current page only)
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

    // Individual row checkbox
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

    // Settings icon - toggle dropdown
    $(document).on('click', '#selection-actions-toggle', function (e) {
        e.stopPropagation();
        $('#selection-actions-menu').toggleClass('show');
    });

    // Close dropdown when clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#selection-actions-toggle, #selection-actions-menu').length) {
            $('#selection-actions-menu').removeClass('show');
        }
    });

    // Select All button
    $(document).on('click', '#action-select-all', function (e) {
        e.preventDefault();
        selectAllCurrentPage();
        $('#selection-actions-menu').removeClass('show');
    });

    // Clear Selection button
    $(document).on('click', '#action-select-none', function (e) {
        e.preventDefault();
        selectNone();
        $('#selection-actions-menu').removeClass('show');
    });

    // Bulk Delete button
    if (bulkDeleteEndpoint) {
        $(document).on('click', '#action-bulk-delete', function (e) {
            e.preventDefault();
            performBulkDelete();
            $('#selection-actions-menu').removeClass('show');
        });
    }

    // Handle custom actions from config
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

    // Clear all (× button on badge)
    $(document).on('click', '#deselect-all', function (e) {
        e.preventDefault();
        selectedRowIds.clear();
        $table.find('.row-selector').prop('checked', false);
        $table.find('tr.table-active').removeClass('table-active');
        $('#select-all').prop({ checked: false, indeterminate: false });
        updateSelectionUI();
    });

    // Keyboard shortcut for bulk delete (Ctrl+Shift+D)
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

    // Expose public API
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

// Utility Functions


export function getSelectedIds(tableSelector = '#masterTable') {
    return $(`${tableSelector} .row-selector:checked`)
        .map((i, el) => $(el).data('id'))
        .get();
}

export function clearAllSelections(tableSelector = '#masterTable') {
    $(`${tableSelector} #select-all`).prop({ checked: false, indeterminate: false });
    $(`${tableSelector} .row-selector`).prop('checked', false);
    $(`${tableSelector} tr.table-active`).removeClass('table-active');
}

// Form Management Functions


export function loadForm(basePath, mode, id = null, voucherNo = null, compprefix = null) {
    const url = mode === 'create'
        ? `${basePath}/Create`
        : `${basePath}/Edit/${id}`;

    const newPath = mode === 'create'
        ? `${basePath}/Create`
        : `${basePath}/${voucherNo}-${compprefix}`;

    // Update browser URL without page reload
    window.history.pushState({ mode, id }, '', newPath);

    // Adjust UI for form view
    $('#personal-info').css('background-color', 'var(--bs-body-bg)');
    $('#btnCreate').removeClass('btn-primary').addClass('btn-outline-primary btn-sm shadow-none');
    $('#universalSearch, #sharedLength, #customPagination, .input-group-text').hide();

    // Load form via AJAX
    $.get(url).done(html => {
        $('#personal-info').html(html);
        if (window.stepper) window.stepper.to(2);
    });
}


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

export function handleCreateButton(basePath) {
    $('#btnCreate').off('click').on('click', () => loadForm(basePath, 'create'));
}

// Row Action Handlers

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

    // Delete button handler
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

// Responsive Handling

window.addEventListener('resize', function () {
    if ($.fn.DataTable.isDataTable('#masterTable')) {
        $('#masterTable').DataTable().columns.adjust().draw(false);
    }
});

// Pagination UI Update


function updateCustomPagination(table) {
    if (!table) return;

    const info = table.page.info ? table.page.info() : { recordsDisplay: 0, pages: 1, page: 0 };
    const len = parseInt($('#sharedLength').val()) || table.page.len();
    const totalRecords = info.recordsDisplay || 0;
    const totalPages = Math.ceil(totalRecords / len) || 1;
    const currentPage = $('#pageInfo').data('page') || 1;

    // Update page number display
    $('#pageInfo').text(`${currentPage} / ${totalPages}`);
    $('#pageInfo').data('total', totalPages);

    // Enable/disable navigation buttons
    $('#prevPage').prop('disabled', currentPage <= 1);
    $('#nextPage').prop('disabled', currentPage >= totalPages);

    // Show/hide pagination controls
    $('#customPagination').toggleClass('d-none', totalRecords === 0);
}

// Toast Notifications


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

// Cleanup Functions

export function destroyAllTables() {
    activeTables.forEach((table, selector) => {
        if ($.fn.DataTable.isDataTable(selector)) {
            table.destroy();
        }
    });
    activeTables.clear();
}