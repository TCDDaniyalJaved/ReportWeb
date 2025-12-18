// dataTableUtils.js
let activeTables = new Map(); // Track all initialized tables

export function initializeDataTable(config) {
    const {
        tableSelector,
        ajaxUrl,
        columns: userColumns,
        idField = 'id',
        pageLength = 10,
        enableCheckboxes = false,
        enableEditButton = true,
        enableDeleteButton = true,
        enablePrintButton = true,
        enablePdfButton = false,

        // NEW CONFIG OPTIONS
        showSearch = true,
        showLengthMenu = true,
        showCustomPagination = true,
        searchPlaceholder = "Search...",
        lengthMenuOptions = [7, 10, 25, 50, 100, -1],
        lengthMenuLabels = ["7", "10", "25", "50", "100", "All"],
        drawCallback = null
    } = config;

    const $table = $(tableSelector);
    if (!$table.length) return null;

    // Destroy if already exists
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }

    // === Build Columns ===
    const columns = [...userColumns];

    if (enableCheckboxes) {
        columns.unshift({
            data: null, orderable: false, className: 'text-center', width: '38px',
            render: (data, type, row) => `<input type="checkbox" class="form-check-input dt-checkbox" data-id="${row[idField] || ''}">`
        });
    }

    // === Create Table ===
    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        processing: false,
        serverSide: true,
        paging: true,
        pageLength,
        lengthChange: false,
        searching: false,
        info: false,
        order: [[enableCheckboxes ? 1 : 0, 'desc']],
        ajax: {
            url: ajaxUrl,
            type: 'POST',
            data: function (d) {
                d.customSearch = $('#universalSearch')?.val() || '';
                const token = $('input[name="__RequestVerificationToken"]').val();
                if (token) d.__RequestVerificationToken = token;
            }
        },
        columns,
        drawCallback: function (settings) {
            updateCustomPagination(table);
            if (typeof drawCallback === 'function') drawCallback(settings);
        },
        initComplete: function () {
            const wrapperId = `${tableSelector}_wrapper`;
            const $wrapper = $(`#${wrapperId.replace('#', '')}`);

            // Hide default controls
            $(`${wrapperId} .dataTables_filter, ${wrapperId} .dataTables_length, ${wrapperId} .dataTables_info, ${wrapperId} .dataTables_paginate`).addClass('d-none');

            // Inject Controls Only Once
            injectSearchBox($wrapper, showSearch, searchPlaceholder);
            injectLengthMenu($wrapper, showLengthMenu, table, lengthMenuOptions, lengthMenuLabels);
            injectCustomPagination($wrapper, showCustomPagination, table);

            // Store reference
            activeTables.set(tableSelector, table);
        }
    });

    $(window).on('resize', function () {
        table.columns.adjust().draw(false);
    });
}

// === Inject Universal Search ===
function injectSearchBox($wrapper, show, placeholder) {
    if (!show) return;
    if ($('#universalSearch').length) return;

    const searchHtml = `
        <div class="input-group" style="max-width: 500px; margin: 0 auto 1rem;">
            <span class="input-group-text bg-white"><i class="bx bx-search"></i></span>
            <input type="search" id="universalSearch" class="form-control" placeholder="${placeholder}">
        </div>`;

    $wrapper.find('.dataTables_top').first().prepend(searchHtml);

    let timeout;
    $(document).off('keyup', '#universalSearch').on('keyup', '#universalSearch', function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            $('.dataTable').each(function () {
                if ($.fn.DataTable.isDataTable(this)) {
                    $(this).DataTable().ajax.reload(null, false);
                }
            });
        }, 400);
    });
}

// === Inject Length Menu ===
function injectLengthMenu($wrapper, show, table, options, labels) {
    if (!show || $('#sharedLength').length) return;

    let optionsHtml = '';
    options.forEach((val, i) => {
        const label = labels[i] || val;
        const selected = (val === table.page.len()) ? 'selected' : '';
        optionsHtml += `<option value="${val}" ${selected}>${label}</option>`;
    });

    const $length = $(`<select id="sharedLength" class="form-select form-select-sm w-auto">${optionsHtml}</select>`);
    $wrapper.find('.dataTables_top').first().append($length);

    $length.on('change', function () {
        const len = this.value === '-1' ? 1000000 : +this.value;
        table.page.len(len).draw();
    });
}

// === Inject Custom Pagination ===
function injectCustomPagination($wrapper, show, table) {
    if (!show || $('#customPagination').length) return;

    const $pag = $(`
        <div id="customPagination" class="d-flex align-items-center gap-2 mt-3 justify-content-center">
            <button class="btn btn-sm btn-outline-primary" id="prevPageBtn"><i class="bx bx-chevron-left"></i></button>
            <span id="pageInfo" class="fw-bold text-primary">1 / 1</span>
            <button class="btn btn-sm btn-outline-primary" id="nextPageBtn"><i class="bx bx-chevron-right"></i></button>
        </div>
    `);

    $wrapper.find('.dataTables_bottom').first().html($pag);

    $(document).off('click', '#prevPageBtn').on('click', '#prevPageBtn', () => table.page('previous').draw('page'));
    $(document).off('click', '#nextPageBtn').on('click', '#nextPageBtn', () => table.page('next').draw('page'));
}

function updateCustomPagination(table) {
    const info = table.page.info();
    const current = info.page + 1;
    const total = info.pages || 1;

    $('#pageInfo').text(`${current} / ${total}`);
    $('#prevPageBtn').prop('disabled', current === 1);
    $('#nextPageBtn').prop('disabled', current === total || total <= 1);
    $('#customPagination').toggleClass('d-none', info.recordsTotal === 0);
}

// Global Toast Helper (reusable)
window.showToast = function (title = '', text = 'Saved!', icon = 'success') {
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
};