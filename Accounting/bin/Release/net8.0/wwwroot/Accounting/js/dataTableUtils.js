let activeTables = new Map();

export function initializeDataTable(config) {
    const {
        tableSelector,
        ajaxUrl,
        columns: userColumns,
        idField = 'id',
        pageLength = 10,
        drawCallback = null
    } = config;

    const $table = $(tableSelector);
    if (!$table.length) return null;

    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }

    const columns = [...userColumns];

    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        processing: false,
        serverSide: true,
        paging: false,       // Default pagination OFF
        lengthChange: false, // Default length menu OFF
        searching: false,    // Default search OFF
        info: false,         // Info OFF
        order: [[0, 'desc']],
        pageLength: pageLength,
        ajax: {
            url: ajaxUrl,
            type: 'POST',
            data: function (d) {
                d.customSearch = $('#universalSearch').val() || '';
                const token = $('input[name="__RequestVerificationToken"]').val();
                if (token) d.__RequestVerificationToken = token;
                // Send page number and length manually for server-side
                const len = parseInt($('#sharedLength').val()) || pageLength;
                const currentPage = parseInt($('#pageInfo').data('page')) || 1;
                d.start = (currentPage - 1) * len;
                d.length = len;
            }
        },
        columns,
        drawCallback: function () {
            updateCustomPagination(table);
            if (typeof drawCallback === 'function') drawCallback();
        }
    });

    // Search box
    $('#universalSearch').off('keyup').on('keyup', function () {
        $('#pageInfo').data('page', 1); // Reset page
        table.ajax.reload(null, false);
    });

    // Length menu
    $('#sharedLength').off('change').on('change', function () {
        $('#pageInfo').data('page', 1); // Reset page
        table.ajax.reload(null, false);
    });

    // Custom pagination buttons
    $('#prevPage').off('click').on('click', function () {
        let current = $('#pageInfo').data('page') || 1;
        if (current > 1) {
            $('#pageInfo').data('page', current - 1);
            table.ajax.reload(null, false);
        }
    });

    $('#nextPage').off('click').on('click', function () {
        let current = $('#pageInfo').data('page') || 1;
        const totalPages = parseInt($('#pageInfo').data('total')) || 1;
        if (current < totalPages) {
            $('#pageInfo').data('page', current + 1);
            table.ajax.reload(null, false);
        }
    });

    // Initial pagination data
    $('#pageInfo').data('page', 1);

    activeTables.set(tableSelector, table);

    return table;
}

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
