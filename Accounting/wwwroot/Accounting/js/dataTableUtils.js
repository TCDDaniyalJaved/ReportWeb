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

        // Edit button column
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
         // Checkbox column
        //else if (renderType === 'checkbox') {
        //    colDef.render = () =>
        //        '<input type="checkbox" class="row-selector form-check-input">';
        //    colDef.orderable = false;
        //}

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

export function initCheckboxSelection(table, tableSelector = '#masterTable') {
    const $table = $(tableSelector);
    const $searchContainer = $('#universalSearch').closest('.input-group'); // Assuming search is in an input-group
    const $selectedBadge = $('<div class="badge bg-primary d-none" id="selected-badge" style="align-items: center; display: flex;">' +
        '<span id="selected-count"></span>' +
        '<button type="button" class="btn-close btn-close-white ms-2" id="deselect-all" aria-label="Deselect all" style="font-size: 0.8rem;"></button>' +
        '</div>');

    // Append badge to search container's parent or appropriate place
    $searchContainer.after($selectedBadge);

    // Function to update UI based on selection
    function updateSelectionUI() {
        const $checkboxes = $table.find('tbody .row-selector');
        const checked = $checkboxes.filter(':checked').length;

        if (checked > 0) {
            $('#selected-count').text(`${checked} record${checked > 1 ? 's' : ''} selected`);
            $searchContainer.addClass('d-none');
            $selectedBadge.removeClass('d-none');
        } else {
            $searchContainer.removeClass('d-none');
            $selectedBadge.addClass('d-none');
        }

        // Update header checkbox
        $('#select-all')
            .prop('checked', checked > 0 && checked === $checkboxes.length)
            .prop('indeterminate', checked > 0 && checked < $checkboxes.length);
    }

    // Select All
    $(document).on('change', '#select-all', function () {
        const isChecked = this.checked;
        $table.find('tbody .row-selector').prop('checked', isChecked);
        $table.find('tbody tr').toggleClass('table-active', isChecked);
        updateSelectionUI();
    });

    // Individual checkbox
    $(document).on('change', `${tableSelector} .row-selector`, function () {
        $(this).closest('tr').toggleClass('table-active', this.checked);
        updateSelectionUI();
    });

    // Deselect all button
    $(document).on('click', '#deselect-all', function () {
        clearAllSelections(tableSelector);
        updateSelectionUI();
    });

    // After draw
    table.on('draw', () => {
        updateSelectionUI();
    });
}

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