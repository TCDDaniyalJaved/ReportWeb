// AccountOpening.js
import { initializeDataTable } from './dataTableUtils.js';

const BASE_PATH = '/Accounting/AccountOpening';
let table = null;
let stepper = null;

function generateColumnsFromHeaders() {
    const columns = [];

    $('#masterTable thead th').each(function () {
        const th = $(this);
        const datafield = th.attr('datafield');
        const header = th.attr('header') || th.text().trim();
        const width = th.attr('width');
        const align = th.attr('align');
        const active = th.attr('active') !== 'false'; // default true
        const renderType = th.attr('render');

        const colDef = { title: header };

        // Hidden column?
        if (!active) colDef.visible = false;

        // Width & Alignment
        if (width) colDef.width = width;
        if (align) colDef.className = `text-${align === 'right' ? 'end' : align}`;

        // Data field
        if (datafield && datafield !== '') {
            colDef.data = datafield;
        } else {
            colDef.data = null;
            colDef.orderable = false;
        }

        // Special Render Functions
        if (renderType === 'edit') {
            colDef.render = () => `<button class="btn btn-icon btn-sm edit-btn" title="Edit"><i class="bx bx-edit"></i></button>`;
        }
        else if (renderType === 'actions') {
            colDef.render = () => `
                <button class="btn btn-icon btn-sm delete-btn me-1" title="Delete"><i class="bx bx-trash"></i></button>
                <button class="btn btn-icon btn-sm print-btn" title="Print"><i class="bx bx-printer"></i></button>
            `;
        }

        if (datafield === 'debit' || datafield === 'credit') {
            colDef.render = $.fn.dataTable.render.number(',', '.', 2);
            colDef.className = 'text-end';
        }

        columns.push(colDef);
    });

    return columns;
}




function initStepper() {
    const el = document.querySelector('#wizardStepper');
    if (el) stepper = new Stepper(el, { linear: false });
    window.stepper = stepper;
}

function loadForm(mode, id = null) {
    const url = mode === 'create' ? `${BASE_PATH}/Create` : `${BASE_PATH}/Edit/${id}`;
    const newPath = mode === 'create' ? `${BASE_PATH}/Create` : `${BASE_PATH}/Edit/${id}`;
    window.history.pushState({ mode, id }, '', newPath);

    $('#personal-info').css('background-color', 'var(--bs-body-bg)');
    $('#btnCreate').removeClass('btn-primary').addClass('btn-outline-primary btn-sm shadow-none');
    $('#universalSearch, #sharedLength, #customPagination, .input-group-text').hide();

    $.get(url).done(html => {
        $('#personal-info').html(html);
        if (stepper) stepper.to(2);
    });
}

function goBackToList() {
    $('#personal-info').empty();
    $('#btnCreate').removeClass('btn-outline-primary btn-sm shadow-none').addClass('btn-primary');
    $('#universalSearch, #sharedLength, #customPagination, .input-group-text').show();
    if (stepper) stepper.to(1);

    // Reinitialize table with fresh columns from HTML
    if (table) table.clear().destroy();
    table = initializeDataTable({
        tableSelector: '#masterTable',
        ajaxUrl: `${BASE_PATH}/GetData`,
        idField: 'id',
        pageLength: 7,
        columns: generateColumnsFromHeaders(),
        showSearch: true,
        showLengthMenu: true,
        showCustomPagination: true
    });

    handleRowActions(); // Re-bind events
}

function handleRowActions() {
    $('#masterTable tbody').off('click').on('click', '.edit-btn', function () {
        const data = table.row($(this).closest('tr')).data();
        if (data?.id) loadForm('edit', data.id);
    });

    $('#masterTable tbody').on('click', '.delete-btn', function () {
        const data = table.row($(this).closest('tr')).data();
        if (data?.id) deleteRecord(data.id);
    });

    $('#masterTable tbody').off('click').on('click', '.print-btn', function () {
        const data = table.row($(this).closest('tr')).data();
        if (data?.id) printRecord(data.id);
    });
}

function deleteRecord(id) {
    Swal.fire({
        title: 'Delete?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        customClass: {
            confirmButton: 'btn btn-danger btn-sm',
            cancelButton: 'btn btn-primary btn-sm'
        }
    }).then(result => {
        if (result.isConfirmed) {
            $.post(`${BASE_PATH}/Delete`, { id }).done(res => {
                if (res.success) {
                    showToast('Success', res.message || 'Deleted!', 'success');
                    table.ajax.reload(null, false);
                }
            });
        }
    });
}

function printRecord(id) {
    window.open(`${BASE_PATH}/PrintPdfofhtml/${id}`, '_blank');
}


function showToast(title = '', message = 'Saved!', icon = 'success') {
    Swal.fire({ toast: true, position: 'top-end', icon, title: message, showConfirmButton: false, timer: 3000, timerProgressBar: true });
}

$(document).ready(function () {
    initStepper();

    table = initializeDataTable({
        tableSelector: '#masterTable',
        ajaxUrl: `${BASE_PATH}/GetData`,
        idField: 'id',
        pageLength: 7,
        fixedHeader: false,
        fixedColumns: false,
        columns: generateColumnsFromHeaders(),
        showSearch: true,
        showLengthMenu: true,
        showCustomPagination: true
    });

    handleRowActions();

    $('#btnCreate').on('click', () => loadForm('create'));
    $(document).on('click', '#gobacktolistbtn', goBackToList);
});