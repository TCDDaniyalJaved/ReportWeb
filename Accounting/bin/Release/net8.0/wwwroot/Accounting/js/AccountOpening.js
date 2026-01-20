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

        if (!active) colDef.visible = false;
        if (width) colDef.width = width;
        if (align) colDef.className = `text-${align === 'right' ? 'end' : align}`;
        if (datafield && datafield !== '') colDef.data = datafield;
        else {
            colDef.data = null;
            colDef.orderable = false;
        }

        if (renderType === 'edit') {
            colDef.render = (data, type, row) =>
                `<button class="btn btn-icon btn-sm edit-btn" title="Edit" 
                 data-id="${row.id}" 
                 data-voucher="${row.voucher}" 
                 data-compprefix="${row.prefix}">
            <i class="bx bx-edit"></i>
        </button>`;
        }
        else if (renderType === 'actions') {
            colDef.render = (data, type, row) => `
                <button class="btn btn-icon btn-sm delete-btn me-1" title="Delete" data-id="${row.id}"><i class="bx bx-trash"></i></button>
                <button class="btn btn-icon btn-sm print-btn" title="Print" data-id="${row.id}"  data-voucher="${row.voucher}"  data-compprefix="${row.prefix}"><i class="bx bx-printer"></i></button>
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

function loadForm(mode, id = null, voucherNo = null, compprefix = null) {
    const url = mode === 'create' ? `${BASE_PATH}/Create` : `${BASE_PATH}/Edit/${id}`;
    const newPath = mode === 'create' ? `${BASE_PATH}/Create` : `${BASE_PATH}/Edit/${voucherNo}-${compprefix}`;

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

    $('#btnCreate')
        .removeClass('btn-outline-primary btn-sm shadow-none')
        .addClass('btn-primary');

    $('#universalSearch, #sharedLength, #customPagination, .input-group-text').show();

    if (stepper) stepper.to(1);

    // --- Destroy DataTable ---
    if ($.fn.DataTable.isDataTable('#masterTable')) {
        $('#masterTable').DataTable().clear().destroy();
    }

    // Clear tbody only (footer safe)
    $('#masterTable tbody').empty();

    // --- Re-initialize DataTable ---
    table = initializeDataTable({
        tableSelector: '#masterTable',
        ajaxUrl: `${BASE_PATH}/GetData`,
        idField: 'id',
        pageLength: 7,
        columns: generateColumnsFromHeaders(),
        showSearch: true,
        showLengthMenu: true,
        showCustomPagination: true,
        drawCallback: function () {
            handleRowActions();
            updateTotalRecords();
        }
    });

    handleRowActions();
    window.history.pushState({}, '', '/Accounting/AccountOpening/list');
}

function updateTotalRecords() {
    if (table) {
        let count = table.data().count(); // total rows count
        $('#totalRecords').text(count);
    }
}
function handleRowActions() {
    $(document).off('click', '#masterTable .edit-btn, #masterTable .delete-btn, #masterTable .print-btn');
    $(document).on('click', '#masterTable .edit-btn', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const voucher = $(this).data('voucher'); 
        const compprefix = $(this).data('compprefix');   
        if (id) loadForm('edit', id, voucher, compprefix);
    });
    $(document).on('click', '#masterTable .delete-btn', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const voucher = $(this).data('voucher');
        const compprefix = $(this).data('compprefix'); 
        if (id) deleteRecord(id, voucher, compprefix);
    });
    $(document).on('click', '#masterTable .print-btn', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        if (id) printRecord(id);
    });
}

function deleteRecord(id) {
    Swal.fire({
        title: 'Delete Record?',
        icon: 'warning',
        showCancelButton: false,
        showDenyButton: false,
        confirmButtonText: 'Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            const $row = $(`button[data-id="${id}"]`).closest('tr');
            $.post(`${BASE_PATH}/Delete`, { id: id })
                .done(res => {
                    if (res.success) {
                        showToast('Success', 'Deleted!', 'success');
                        if (table) table.row($row).remove().draw(false);
                    } else showToast('Error', res.message || 'Failed', 'error');
                })
                .fail(() => showToast('Error', 'Server Error', 'error'));
        }
    });
}

function printRecord(id, voucherNo = null, compprefix = null) {
    //const url = `${BASE_PATH}/Pdf/${voucherNo}/${compprefix}`;
    window.open(`${BASE_PATH}/Pdf/${id}`, '_blank');
}

$(document).ready(function () {
    initStepper();

    table = initializeDataTable({
        tableSelector: '#masterTable',
        ajaxUrl: `${BASE_PATH}/GetData`,
        idField: 'id',
        pageLength: 7,
        columns: generateColumnsFromHeaders(),
        drawCallback: function () {
            handleRowActions();
            updateTotalRecords();
        }
    });

    $('#btnCreate').on('click', () => loadForm('create'));
    $(document).on('click', '#gobacktolistbtn', goBackToList);
});
