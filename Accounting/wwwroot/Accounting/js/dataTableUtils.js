// dataTableUtils.js
let activeTables = new Map();

// Generate columns from table headers - REUSABLE FUNCTION
export function generateColumnsFromHeaders(tableSelector = '#masterTable') {
    const columns = [];

    $(`${tableSelector} thead th`).each(function () {
        const th = $(this);
        const datafield = th.attr('datafield');
        const header = th.attr('header') || th.text().trim();
        const width = th.attr('width');
        const align = th.attr('align');
        const active = th.attr('active') !== 'false';
        const renderType = th.attr('render');

        const colDef = { title: header };

        if (!active) colDef.visible = false;
        if (width) colDef.width = width;

        // Alignment classes
        if (align) {
            const alignment = align === 'right' ? 'end' :
                align === 'center' ? 'center' : 'start';
            colDef.className = `text-${alignment}`;
        }

        if (datafield) {
            colDef.data = datafield;
        } else {
            colDef.data = null;
            colDef.orderable = false;
        }

        if (renderType === 'edit') {
            colDef.render = (data, type, row) =>
                `<button class="btn btn-icon btn-sm edit-btn" title="Edit"
                    data-id="${row.id || ''}"
                    data-voucher="${row.voucher || ''}"
                    data-compprefix="${row.prefix || ''}">
                    <i class="bx bx-edit"></i>
                </button>`;
        }

        // Action buttons column
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
            colDef.render = (data, type, row) => ``;
        }
        // Checkbox column
        else if (renderType === 'checkbox') {
            colDef.title = '<div class="text-center"><input type="checkbox" id="select-all" class="form-check-input"></div>';
            colDef.render = function (data, type, row, meta) {
                if (type === 'display') {
                    return '<div class="text-center"><input type="checkbox" class="row-selector form-check-input" data-id="' + (row.id || '') + '"></div>';
                }
                return data;
            };
            colDef.orderable = false;
            colDef.searchable = false;
        }

        // Status column with badges
        else if (renderType === 'status') {
            colDef.render = (data, type, row) => {
                const status = row.status || data;
                const badgeClass = status === 'Active' ? 'badge bg-success' :
                    status === 'Inactive' ? 'badge bg-danger' :
                        'badge bg-secondary';
                return `<span class="${badgeClass}">${status}</span>`;
            };
        }

        const isAmount = th.attr('isamount') === 'true';
        if (isAmount) {
            const currency = th.attr('currency') || '';
            colDef.render = (data) =>
                data != null
                    ? `${currency}${Number(data).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`
                    : '';
            colDef.className = (colDef.className || '') + ' text-end';
        }

        // Date formatting
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

// Main DataTable initialization function 
export function initializeDataTable(
    endpoint,
    tableSelector = '#masterTable',
    options = {}
) {
    const {
        columns = generateColumnsFromHeaders(tableSelector),
        pageLength = 7,
        callbacks = {}
    } = options;

    const $table = $(tableSelector);
    if (!$table.length) return null;

    // Reinitialize if exists
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }

    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        autoWidth: false,
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
            updateCustomPagination(table);
            callbacks.onDraw?.();
        }
    });

    // Search
    $('#universalSearch').off('keyup').on('keyup', function () {
        $('#pageInfo').data('page', 1);
        table.ajax.reload();
    });

    // Page length
    $('#sharedLength').off('change').on('change', function () {
        $('#pageInfo').data('page', 1);
        table.ajax.reload();
    });

    // Pagination buttons
    $('#prevPage').off('click').on('click', function () {
        let page = $('#pageInfo').data('page') || 1;
        if (page > 1) {
            $('#pageInfo').data('page', page - 1);
            table.ajax.reload();
        }
    });

    $('#nextPage').off('click').on('click', function () {
        let page = $('#pageInfo').data('page') || 1;
        let total = $('#pageInfo').data('total') || 1;
        if (page < total) {
            $('#pageInfo').data('page', page + 1);
            table.ajax.reload();
        }
    });

    $('#pageInfo').data('page', 1);
    return table;
}

// Initialize stepper
export function initStepper() {
    const el = document.querySelector('#wizardStepper');
    if (el) window.stepper = new Stepper(el, { linear: false });
    return window.stepper;
}

// Generic Checkbox Selection Function with Bulk Actions
export function initCheckboxSelection(table, tableSelector = '#masterTable', dropdownConfig = [], bulkDeleteEndpoint = null) {
    // Persistent storage of selected IDs
    const selectedRowIds = new Set();

    const $table = $(tableSelector);

    // ── Create selection controls: Cog + Dropdown + Badge ───────────────────────
    const $searchContainer = $('#universalSearch').closest('.input-group');

    // Default actions
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

    // Add bulk delete if endpoint provided
    if (bulkDeleteEndpoint) {
        defaultDropdownConfig.push({
            id: 'action-bulk-delete',
            label: 'Delete Selected',
            icon: 'bx bx-trash',
            class: 'text-danger',
            requiresSelection: true
        });
    }

    // Use custom config if provided, otherwise use default
    const finalDropdownConfig = dropdownConfig.length > 0 ? dropdownConfig : defaultDropdownConfig;

    const $selectionControls = $(`
        <div class="d-flex align-items-center gap-2 ms-2">
            <!-- Cog Icon (dropdown trigger) -->
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

    // ── Bulk Delete Function ──────────────────────────────────────────────────
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
                // Show loading
                const loadingToast = Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the selected items',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Prepare data for API
                const data = {
                    ids: Array.from(selectedRowIds),
                    _token: $('meta[name="csrf-token"]').attr('content')
                };

                // AJAX call for bulk delete
                $.ajax({
                    url: bulkDeleteEndpoint,
                    method: 'POST',
                    data: data,
                    success: function (response) {
                        loadingToast.close();

                        if (response.success) {
                            // Clear selection
                            selectedRowIds.clear();

                            // Show success message
                            Swal.fire({
                                title: 'Deleted!',
                                text: response.message || `${selectedRowIds.size} item(s) deleted successfully.`,
                                icon: 'success',
                                timer: 2000,
                                showConfirmButton: false
                            });

                            // Refresh the table
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

    // ── Select All Function (Current Page Only) ──────────────────────────────
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

    // ── Select None Function ────────────────────────────────────────────────
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

    // ── UI Update Function ──────────────────────────────────────────────────
    function updateSelectionUI() {
        const count = selectedRowIds.size;

        if (count > 0) {
            $('#selected-count').text(`${count} selected`);
            $('#selected-badge').removeClass('d-none');
            $searchContainer.addClass('d-none');

            // Enable buttons that require selection
            $('#action-bulk-delete').prop('disabled', false);
        } else {
            $('#selected-badge').addClass('d-none');
            $searchContainer.removeClass('d-none');

            // Disable buttons that require selection
            $('#action-bulk-delete').prop('disabled', true);
        }

        // Header checkbox (select-all) state
        const $visible = $table.find('tbody .row-selector');
        const checkedCount = $visible.filter(':checked').length;
        const totalVisible = $visible.length;

        $('#select-all')
            .prop('checked', totalVisible > 0 && checkedCount === totalVisible)
            .prop('indeterminate', checkedCount > 0 && checkedCount < totalVisible);
    }

    // ── Restore selections after redraw ────────────────────────────────────────
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

    // ── Event Handlers ──────────────────────────────────────────────────────

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

    // Cog → Toggle dropdown
    $(document).on('click', '#selection-actions-toggle', function (e) {
        e.stopPropagation();
        $('#selection-actions-menu').toggleClass('show');
    });

    // Click outside → close dropdown
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#selection-actions-toggle, #selection-actions-menu').length) {
            $('#selection-actions-menu').removeClass('show');
        }
    });

    // Select All button in dropdown
    $(document).on('click', '#action-select-all', function (e) {
        e.preventDefault();
        selectAllCurrentPage();
        $('#selection-actions-menu').removeClass('show');
    });

    // Clear Selection button in dropdown
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

    // After draw & init
    table.on('draw', () => {
        restoreSelections();
        updateSelectionUI();
    });

    table.on('init', updateSelectionUI);

    // Public API
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

// Utility functions
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

//Load form for create/edit
export function loadForm(basePath, mode, id = null, voucherNo = null, compprefix = null) {
    const url = mode === 'create'
        ? `${basePath}/Create`
        : `${basePath}/Edit/${id}`;

    const newPath = mode === 'create'
        ? `${basePath}/Create`
        : `${basePath}/${voucherNo}-${compprefix}`;

    window.history.pushState({ mode, id }, '', newPath);

    $('.default-load-info').addClass('d-none');
    $('#personal-info').css('background-color', 'var(--bs-body-bg)');
    $('#btnCreate').removeClass('btn-primary').addClass('btn-outline-primary btn-sm shadow-none');
    $('#universalSearch, #sharedLength, #customPagination, .input-group-text').hide();

    $.get(url).done(html => {
        $('#personal-info').html(html);
        if (window.stepper) window.stepper.to(2);
    });
}

// Handle direct URL navigation
export function handleDirectUrl(basePath) {
    const parts = location.pathname.split('/').filter(p => p);
    const action = parts.pop();
    const maybeId = parts.pop();

    if (action === 'Create') loadForm(basePath, 'create');
    else if (action === 'Edit' && maybeId) loadForm(basePath, 'edit', maybeId);
}

// Return to list view
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

// Handle create button click
export function handleCreateButton(basePath) {
    $('#btnCreate').off('click').on('click', () => loadForm(basePath, 'create'));
}

// Handle row actions (edit, delete, print)
export function handleRowActions(basePath, callbacks = {}) {
    $(document).off('click', '#masterTable .edit-btn, #masterTable .delete-btn, #masterTable .print-btn');

    // Edit button
    $(document).on('click', '#masterTable .edit-btn', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const voucher = $(this).data('voucher');
        const compprefix = $(this).data('compprefix');
        if (id) loadForm(basePath, 'edit', id, voucher, compprefix);
    });

    // Delete button
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

    // Print button
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

window.addEventListener('resize', function () {
    if ($.fn.DataTable.isDataTable('#masterTable')) {
        $('#masterTable').DataTable().columns.adjust().draw(false);
    }
});

// Update custom pagination UI
function updateCustomPagination(table) {
    if (!table) return;

    const info = table.page.info ? table.page.info() : { recordsDisplay: 0, pages: 1, page: 0 };
    const len = parseInt($('#sharedLength').val()) || table.page.len();
    const totalRecords = info.recordsDisplay || 0;
    const totalPages = Math.ceil(totalRecords / len) || 1;
    const currentPage = $('#pageInfo').data('page') || 1;

    // Update page display
    $('#pageInfo').text(`${currentPage} / ${totalPages}`);
    $('#pageInfo').data('total', totalPages);

    // Enable/disable buttons
    $('#prevPage').prop('disabled', currentPage <= 1);
    $('#nextPage').prop('disabled', currentPage >= totalPages);

    // Toggle pagination visibility
    $('#customPagination').toggleClass('d-none', totalRecords === 0);
}

// Show toast notification
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

// Destroy all active tables
export function destroyAllTables() {
    activeTables.forEach((table, selector) => {
        if ($.fn.DataTable.isDataTable(selector)) {
            table.destroy();
        }
    });
    activeTables.clear();
}