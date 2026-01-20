/*=====================================================================
 CashReceipt.js 
=====================================================================*/

import { initializeDataTable } from './dataTableUtils.js';

let table = null;
let stepper = null;
const BASE_PATH = '/Accounting/CashReceipt';

// CONFIG
const PAGE_CONFIG = {
    tableSelector: '#masterTable',
    ajaxUrl: `${BASE_PATH}/GetData`,
    idField: 'id',
    pageLength: 7,
    enableCheckboxes: false,
    enableEditButton: true,
    enableDeleteButton: true,
    enablePrintButton: false,
    enablePdfButton: false,
    columns: [
        {
            data: null,
            width: '7%',
            render: function (data, type, row) {
                return '';
            }
        },
        { data: 'invoiceId', visible: false },
        { data: 'issuedDate', name: 'IssuedDate', width: '15%' },
        { data: 'invoiceNumber', name: 'InvoiceNumber', width: '25%' },
        { data: 'clientname', name: 'Clientname', width: '10%' },
        { data: 'clientname', name: 'Clientname', width: '15%', className: 'text-end' },
        { data: 'total', name: 'Total', width: '15%', className: 'text-end' },

    ]
};

$(document).ready(function () {
    //$('.content-wrapper').css('background-color', '#ffffff'); 
    initStepper();
    handleDirectUrl();
    initDataTable();
    initSearchAndLength();
    initCustomPagination();
    initTotalRecordsRow();
    initCreateButton();
    initBackButton();
    initGlobalActions();
});

// STEPPER
function initStepper() {
    const el = document.querySelector('#wizardStepper');
    if (el) {
        stepper = new Stepper(el, { linear: false });
        window.stepper = stepper;
    }
}

// DATATABLE
function initDataTable() {
    table = initializeDataTable(PAGE_CONFIG);

    $('#masterTable tbody').on('dblclick', 'tr', function () {
        const data = table.row(this).data();
        if (data?.id) showEdit(data.id);
    });
}

// SEARCH + LENGTH MENU
function initSearchAndLength() {
    let searchTimeout;
    $('#universalSearch').off('keyup').on('keyup', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            table.ajax.reload(() => {
                updatePaginationVisibility(); // Show pagination only after search
            }, false);
        }, 300);
    });

    // Length Menu
    const $len = $('#sharedLength');
    if (!$len.length) {
        $('#searchdev').after(`
            <select id="sharedLength" class="form-select form-select-sm w-auto ms-2">
                <option value="7" selected>7</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="-1">All</option>
            </select>
        `);
    }

    $(document).off('change', '#sharedLength').on('change', '#sharedLength', function () {
        const len = this.value === '-1' ? 1_000_000 : +this.value;
        table.page.len(len).draw();
    });
}

// CUSTOM PAGINATION: < 2 / 10 >
function initCustomPagination() {
    const $container = $(table.table().container());
    let $pagination = $('#customPagination');

    if (!$pagination.length) {
        $('#searchArea').append(`
    <div id="customPaginationss" class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-primary" id="prevPage"><</button>
        <span id="pageInfo" class="fw-medium">1 / 1</span>
        <button class="btn btn-sm btn-outline-primary" id="nextPage">></button>
    </div>
`);
        $pagination = $('#customPagination');
    }

    $(document).off('click', '#prevPage').on('click', '#prevPage', () => table.page('previous').draw('page'));
    $(document).off('click', '#nextPage').on('click', '#nextPage', () => table.page('next').draw('page'));

    table.on('draw', () => {
        updatePagination();
        updatePaginationVisibility();
    });
}

function updatePagination() {
    const info = table.page.info();
    const current = info.page + 1;
    const total = info.pages || 1;

    $('#pageInfo').text(`${current} / ${total}`);
    $('#prevPage').prop('disabled', current === 1);
    $('#nextPage').prop('disabled', current === total || total === 1);
}

function updatePaginationVisibility() {
    const info = table.page.info();
    const hasRecords = info.recordsTotal > 0;
    const showPagination = hasRecords; // Hamesha dikhao agar data hai

    $('#customPagination').toggleClass('d-none', !showPagination);

    // Agar sirf 1 page hai → buttons disable kar do
    if (hasRecords && info.pages === 1) {
        $('#prevPage, #nextPage').prop('disabled', true);
    }
}

// TOTAL RECORDS ROW BELOW DATE COLUMN
function initTotalRecordsRow() {
    const $table = $(table.table().node());

    // Add footer row
    let $footer = $table.find('tfoot');
    if (!$footer.length) {
        $table.append('<tfoot style="border-bottom:none"><tr id="totalRecordsRow" style="background-color:#F5F5F9; border-bottom:none" ></tr></tfoot>');
        $footer = $table.find('tfoot');
    }

    const $row = $('#totalRecordsRow');
    const totalCols = table.columns().nodes().length;

    // Build cells: empty + "Total Records: X" under Date column (index 1)
    let cells = '';
    for (let i = 0; i < totalCols; i++) {
        if (i === 1) {
            cells += `<td class="text-start fw-bold text" id="totalRecordsCell">Total Records: 0</td>`;
        } else {
            cells += `<td></td>`;
        }
    }
    $row.html(cells);

    // Update on every draw
    table.on('draw', () => {
        const total = table.page.info().recordsTotal;
        $('#totalRecordsCell').text(`Total Records: ${total}`);
    });

    // Initial update
    $('#totalRecordsCell').text(`Total Records: ${table.page.info().recordsTotal}`);
}

// CREATE BUTTON
function initCreateButton() {
    $('#btnCreate').off('click').on('click', () => {
        $('#personal-info').css('background-color', 'var(--bs-body-bg)');
        $('#customPagination').css('display', 'none');
        $('#customPagination').addClass('d-none');
        $('#btnCreate').addClass('btn btn-primary btn-outline-primary btn-sm shadow-none');
        loadForm('create');
    });
}

function loadForm(mode, id = null) {
    //resetFormCompletely();
    $('#btnCreate').addClass('btn btn-primary btn-outline-primary btn-sm shadow-none');
    $('#personal-info').css('background-color', 'var(--bs-body-bg)');
    $('#universalSearch').hide();
    $('.input-group-text, #clearSearch').hide();

    const url = mode === 'create' ? `${BASE_PATH}/Create` : `${BASE_PATH}/Edit/${id}`;
    updateUrl(mode, id);

    $.get(url).done(html => {
        $('#personal-info').html(html);
        toggleView(false);
        if (stepper) stepper.to(2);

        // Load the CashReceipt_detail.js script dynamically
        //loadScript('/js/CashReceipt_detail.js', function () {
        //    // Once the script is loaded, initialize the account opening details
        //    setTimeout(() => {
        //        if (typeof window.initializeCashReceiptDetail === 'function') {
        //            window.initializeCashReceiptDetail();
        //        }
        //    }, 100);
        //});

        reinitForm();
    }).fail(() => {
        showAlert('Error', 'Failed to load form', 'error');
        goBackToList();
    });
}

// Function to dynamically load a script
function loadScript(src, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.onload = function () {
        if (callback) callback();
    };
    script.onerror = function () {
        showAlert('Error', 'Failed to load the script', 'error');
    };
    document.head.appendChild(script);
}



window.showEdit = (id) => loadForm('edit', id);

// FORM REINIT
function reinitForm() {
    if (typeof select2dropdawn === 'function') select2dropdawn();
    $.validator.unobtrusive.parse('#invoiceForm');
    if (typeof window.initializeCashReceiptDetail === 'function') {
        setTimeout(window.initializeCashReceiptDetail, 100);
    }

    $(document).off('submit', '#invoiceForm').on('submit', '#invoiceForm', e => {
        e.preventDefault();
        submitForm($(e.target));
    });

    $(document).off('click', '#confirmBtn').on('click', '#confirmBtn', () => $('#invoiceForm').submit());
}

function submitForm($form) {
    const $btn = $('#confirmBtn').prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Saving...');
    const formData = new FormData($form[0]);

    $.ajax({
        url: $form.attr('action'),
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
        .done(res => {
            if (res.success) {
                showAlert('Success', res.message || 'Saved!', 'success');
                table.ajax.reload(null, false);
                goBackToList();
            } else {
                $('#personal-info').html(res);
                reinitForm();
            }
        })
        .always(() => $btn.prop('disabled', false).html('Confirm'));
}

// BACK TO LIST
function initBackButton() {
    $(document).on('click', '#gobacktolistbtn', goBackToList);
}
function goBackToList() {
    toggleView(true);
    $('#personal-info').empty();
    $('#btnCreate').removeClass('btn btn-primary btn-outline-primary btn-sm shadow-none');
    $('#btnCreate').addClass('btn btn-primary');
    $('#universalSearch').css('display', 'block');
    $('.input-group-text').css('display', '');


    if (stepper) stepper.to(1);

    // Safely destroy and recreate DataTable
    if ($.fn.DataTable.isDataTable(PAGE_CONFIG.tableSelector)) {
        if (table) {
            table.destroy(); // destroy old instance
            $(PAGE_CONFIG.tableSelector).empty(); // clear DOM
        }
    }

    // Reinitialize cleanly
    table = initializeDataTable(PAGE_CONFIG);

    // Reset URL cleanly
    if (window.history && window.history.pushState) {
        history.pushState({}, '', BASE_PATH + '/list');
    }
}




// GLOBAL ACTIONS
function initGlobalActions() {
    window.deleteRecord = (id, ev) => {
        ev?.preventDefault();
        const row = $(ev.target).closest('tr');
        const ref = row.find('td:eq(2)').text();
        Swal.fire({
            title: 'Delete?',
            html: `Reference: <strong>${ref}</strong>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            customClass: { confirmButton: 'btn btn-danger btn-sm me-2', cancelButton: 'btn btn-secondary btn-sm' }
        }).then(r => {
            if (r.isConfirmed) {
                $.post(`${BASE_PATH}/Delete`, { id })
                    .done(res => {
                        if (res.success) {
                            showAlert('Deleted', res.message || '', 'success');
                            table.ajax.reload(null, false);
                        }
                    });
            }
        });
    };

    window.printRecord = (id) => window.open(`${BASE_PATH}/Print/${id}`, '_blank');
    window.viewPdf = (id) => window.open(`${BASE_PATH}/PrintPdfOfHtml/${id}`, '_blank');
}

// URL HANDLING
function updateUrl(mode, id) {
    const path = mode === 'create' ? `${BASE_PATH}/Create` : `${BASE_PATH}/Edit/${id}`;
    history.pushState({ mode, id }, '', path);
}

function handleDirectUrl() {
    const path = location.pathname;
    const parts = path.split('/').filter(p => p);
    const action = parts.pop();
    const maybeId = parts.pop();
    if (action === 'Create') loadForm('create');
    else if (action === 'Edit' && maybeId) loadForm('edit', maybeId);
}

window.addEventListener('popstate', () => {
    if (!location.pathname.includes(BASE_PATH)) goBackToList();
});

// UI HELPERS
function toggleView(showTable) {
    const hide = showTable ? [] : ['#searchdev', '#sharedLength', '#customPagination'];
    const show = showTable ? ['#searchdev', '#sharedLength', '#customPagination'] : [];
    hide.forEach(s => $(s).addClass('d-none'));
    show.forEach(s => $(s).removeClass('d-none'));
    $('.create-header').toggleClass('border-bottom pt-5', !showTable);
}
function showSuccessAlert(message) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        //  title: title,
        text: 'Account ' + message + ' Successfully!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
            popup: 'bootstrap-toast'
        },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}

function showAlert(title, text, icon) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon, // icon passed as argument
        title: title, // title passed as argument
        text: text, // text passed as argument
        showConfirmButton: false,
        timer: 3000, // Set timer for auto-hide
        timerProgressBar: true,
        customClass: {
            popup: 'bootstrap-toast'
        },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}