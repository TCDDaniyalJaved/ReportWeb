
var table
$(document).ready(function () {

    table = $('#userTable').DataTable({
        "ajax": {
            "url": "/TrialBalance/GetData",
            "data": function (d) {
                d.TDate = $('#flatpickr-date-end').val();
            },
            "dataSrc": "data"
            
        },
        "createdRow": function (row, data, dataIndex) {
            $(row).find('td:eq(3)').addClass('user-name text-nowrap');

            var obj = typeof data === 'string' ? eval(data) : data;
            var typeNum = Number(obj["type"]);

            switch (typeNum) {
                case 0: $(row).addClass('cGroup'); break;
                case 1: $(row).addClass('cDetail'); break;
                case 2: $(row).addClass('cGroupT'); break;
                case 3: $(row).addClass('cGroup2'); break;
                case 4: $(row).addClass('cGroupGT'); break;
            }
        },

        "columns": [
            {
                "data": "id",
                "render": function (data, type, row) {
                    return '';
                }
            },
            {
                "data": "id",
                "name": "Id",
                "sClass": "hiddencol",
                "visible": false
            },
            {
                "data": "type",
                "name": "Type",
                "sClass": "hiddencol",
                "visible": false

            },
            {
                "data": "accountName",
                "name": "AccountName",
            },
            {
                "data": "debit", render: $.fn.dataTable.render.number(',', '.', 2, ''), "sClass": "Amountright",
                "name": "Debit",
            },
            {
                "data": "credit", render: $.fn.dataTable.render.number(',', '.', 2, ''), "sClass": "Amountright",
                "name": "Credit",

            }
        ],
        scrollY: "350px",
        scrollCollapse: true,
        scroller: true, 
        ordering: false,
        deferRender: true,
        displayLength: -1,
       
        dom:
            '<"mx-4 d-flex flex-wrap flex-column justify-content-md-end flex-sm-row gap-2 py-4 py-sm-0"' + '<"dt-action-buttons text-xl-end text-lg-start text-md-end text-start d-flex flex-sm-row align-items-center justify-content-md-end gap-5 ms-n2 ms-md-2 flex-wrap flex-sm-nowrap pb-2"B>' + '>t' + '<"row mx-4"' + '<"col-sm-12 col-md-6">' + '<"col-sm-12 col-md-6 pb-3 ps-0">' + '>',
      
        lengthMenu: [[7, 10, 15, 20, -1], [7, 10, 15, 20, "All"]],
        language: {
            searchPlaceholder: 'Search..',
            search: '',
            lengthMenu: '_MENU_'
        },
        buttons: [{
            extend: 'collection',
            className: 'btn btn-label-secondary dropdown-toggle shadow-none me-4',
            text: '<i class="bx bx-export me-2"></i><span class="d-none d-sm-inline-block">Export</span>',
            "buttons": [{
                extend: 'print',
                title: 'Working Trial Balance',
                text: '<i class="bx bx-printer me-2"></i>Print',
                className: 'dropdown-item',
                autoPrint: true,

                customize: function (win) {
                    var $body = $(win.document.body);

                    $body.css({
                        'color': config.colors.headingColor,
                        'border-color': config.colors.borderColor,
                        'background-color': config.colors.body,
                        'font-family': 'Arial, sans-serif',
                        'padding': '20px'
                    });

                    $body.find('table')
                        .addClass('compact')
                        .css({
                            'color': 'inherit',
                            'border-color': 'inherit',
                            'background-color': 'inherit',
                            'width': '100%',
                            'border-collapse': 'collapse'
                        })
                        .find('th, td')
                        .css({
                            'padding': '8px',
                            'border-bottom': '1px solid ' + config.colors.borderColor
                        });



                    $body.find('h1')
                        .css({
                            'text-align': 'center',
                            'margin': '5px',
                            'font-size': '24px',
                            'font-weight': 'bold'
                        });
                    $body.find('h1').after(
                        '<h2 style="text-align: center; font-size: 18px; font-weight: bold;">' +
                        'Accounting Reports' +
                        '</h2>'
                    );

                    $body.append(
                        '<div style="text-align: center; font-size: 12px; margin-top: 20px;">' +
                        'As On Date: ' + $('#flatpickr-date-end').val() + ' | Printed Date: ' + new Date().toLocaleString() +
                        '</div>'
                    );
                    $(win.document.body).find('table tbody tr').each(function (index, row) {
                        var data = $('#userTable').DataTable().row(index).data(); // Fetch row data for styling

                        // Apply custom row styles based on type value
                        if (Number(data["type"]) === 0) {
                            $(row).css({
                                //'font-size': '18px',
                                'font-weight': 'bold',
                                'color': '#000'
                                //'border-top': '2px solid #000',
                                //'border-bottom': '2px solid #000'
                                // Example style
                            });
                        } else if (Number(data["type"]) === 2) {
                            $(row).css({
                                // 'font-size': '18px',
                                'color': '#000',
                                'font-weight': 'bold'

                            });
                        } else if (Number(data["type"]) === 4) {
                            $(row).css({
                                'color': '#000',
                                'font-weight': 'bold'

                            });
                        }

                    });
                },

                exportOptions: {
                    columns: [3, 4, 5],
                    modifier: {
                        page: 'all'
                    },
                    format: {
                        header: function (data) {
                            return data.toUpperCase();
                        },
                        body: function (data, row, column, node) {
                            try {
                                if (column === 3) {
                                    return $(data).text(); // Extract text from user-name cell
                                }
                                return data || '-';
                            } catch (e) {
                                return data || '-';
                            }
                        }
                    }
                }
            }
                , {
                extend: 'excel',
                title: 'Working Trial Balance',
                text: '<i class="bx bxs-file-export me-1"></i>Excel',
                className: 'dropdown-item',

                exportOptions: {
                    columns: [3, 4, 5],
                    format: {
                        body: function body(data, row, column, node) {
                            return data;
                        }
                    }
                }
            },
            {
                extend: 'pdf',
                title: 'Working Trial Balance',
                text: '<i class="bx bxs-file-pdf me-2"></i>Pdf',
                className: 'dropdown-item',
                exportOptions: {
                    columns: [3, 4, 5], // Export only AccountName, Debit, Credit
                    modifier: {
                        page: 'all' // Export all rows, not just the current page
                    },
                    format: {
                        body: function (data, row, column, node) {
                            return data || '-';
                        }
                    }
                },
                customize: function (doc) {
                    // Adjust table structure
                    doc.content[1].table.widths = ['60%', '20%', '20%'];
                    doc.content[1].table.borders = ['0.5pt'];
                    doc.styles.tableHeader = {
                        fontSize: 14,
                        bold: true,
                        alignment: 'right', // Change default to right
                        border: true
                    };
                    doc.styles.tableBodyEven = {};
                    doc.styles.tableBodyOdd = {};
                    doc.defaultStyle = {
                        fontSize: 10,
                        alignment: 'left'
                    };
                    doc.content[1].table.body[0][0].alignment = 'left';
                    // Page margins
                    doc.pageMargins = [20, 40, 20, 40]; // [left, top, right, bottom]

                    // Modify content to include bold title and subheading
                    doc.content.splice(0, 1, { // Replace the default title
                        text: 'Working Trial Balance',
                        fontSize: 16,
                        bold: true,
                        alignment: 'center',
                        margin: [0, 0, 0, 10] // Bottom margin before subheading
                    }, {
                        text: 'Accounting Reports', // Example subheading
                        fontSize: 12,
                        bold: false,
                        alignment: 'center',
                        margin: [0, 0, 0, 10] // Bottom margin before table
                    });

                    // Add custom header
                    doc['header'] = function (currentPage, pageCount) {
                        return {
                            text: 'Trial Balance - Generated on: ' + new Date().toLocaleString(),
                            alignment: 'center',
                            fontSize: 10,
                            margin: [0, 10, 0, 0]
                        };
                    };
                    doc['footer'] = function (currentPage, pageCount) {
                        return {

                            text: 'As On Date: ' + $('#flatpickr-date-end').val() + ' | Page ' + currentPage + ' of ' + pageCount,
                            alignment: 'center',
                            fontSize: 8,
                            margin: [0, 0, 0, 10]
                        };
                    };

                    let tableRows = doc.content[2].table.body; // Adjust index since we added title and subheading
                    tableRows.forEach((row, rowIndex) => {
                        if (rowIndex === 0) return; // Skip header row

                        let dataRow = table.rows().data()[rowIndex - 1];
                        let typeNum = Number(dataRow.type);

                        switch (typeNum) {
                            case 0: // cGroup
                                row.forEach(cell => {
                                    /*cell.fillColor = '#f8f9fa';*/
                                    cell.fontSize = 12;
                                    cell.bold = true;
                                });
                                break;
                            case 1: // cDetail
                                row.forEach(cell => {
                                    /*cell.fillColor = '#ffffff';*/
                                });
                                break;
                            case 2: // cGroupT
                                row.forEach(cell => {
                                    cell.bold = true;
                                    /*cell.fillColor = '#e9ecef';*/
                                });
                                break;
                            case 3: // cGroup2
                                row.forEach(cell => {
                                    /*cell.fillColor = '#f1f3f5';*/
                                    cell.bold = true;
                                });
                                break;
                            case 4: // cGroupGT
                                row.forEach(cell => {
                                    /*cell.fillColor = '#dee2e6';*/
                                    cell.fontSize = 12;
                                    cell.bold = true;
                                });
                                break;
                        }

                        if (row[1]) row[1].alignment = 'right'; // Debit
                        if (row[2]) row[2].alignment = 'right'; // Credit
                    });

                    doc.content[2].table.layout = {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#dee2e6', // From both configs
                        vLineColor: () => '#dee2e6',
                        paddingLeft: () => 8, // From print config
                        paddingRight: () => 8,
                        paddingTop: () => 8,
                        paddingBottom: () => 8,
                    };
                }
            }
                ,
            {
                extend: 'copy',
                title: 'Working Trial Balance',
                text: '<i class="bx bx-copy me-2" ></i>Copy',
                className: 'dropdown-item',
                exportOptions: {
                    columns: [3, 4, 5],
                    modifier: {
                        page: 'all' // Export all rows, not just the current page
                    },
                    format: {
                        body: function body(data, row, column, node) {
                            if (column === 5) {
                                var $content = $(data);
                                // Extract the value of data-user-name attribute (User Name)
                                var userName = $content.find('[class^="user-name-full-"]').text();
                                return userName;
                            }
                            return data;
                        }
                    }
                }
            }
            ]
        }, {
            // For Create User Button (Add New User)
            text: '<i class="bx bx-plus me-0 me-sm-1_5"></i><span class="d-none d-sm-inline-block">Filter</span>',
            className: 'add-new btn btn-primary',

            attr: {
                'id': 'btnCreate',
                'data-bs-toggle': 'offcanvas',
                'data-bs-target': '#createUserOffcanvas'
            }
        }],
        responsive: true,
        // For responsive popup
        rowReorder: {
            selector: 'td:nth-child(2)'
        },
        // For responsive popup button and responsive priority for user name
        columnDefs: [{
            // For Responsive Popup Button (plus icon)
            className: 'control',
            searchable: false,
            orderable: false,
            responsivePriority: 2,
            targets: 0,
            render: function render(data, type, full, meta) {
                return '';
            }
        }, {
            // For Id
            targets: 1,
            responsivePriority: 4
        }, {
            // For User Name
            targets: 2,
            responsivePriority: 3
        }, {
            // For Is Verified
            targets: 4,
            responsivePriority: 5
        }, {
            // For Actions
            targets: -1,
            searchable: false,
            orderable: false,
            responsivePriority: 1
        }],
        responsive: {
            details: {
                display: $.fn.dataTable.Responsive.display.modal({
                    header: function header(row) {
                        var data = row.data();
                        var $content = $(data[2]);
                        // Extract the value of data-user-name attribute (User Name)
                        //var userName = $content.find('[class^="user-name-full-"]').text();
                        var accountName = data.name; // If it's plain text
                        return 'Details of ' + accountName;
                    }
                }),
                type: 'column',
                renderer: function renderer(api, rowIdx, columns) {
                    var data = $.map(columns, function (col, i) {
                        // Exclude the last column (Action)
                        if (i < columns.length - 1) {
                            return col.title !== '' ? '<tr data-dt-row="' + col.rowIndex + '" data-dt-column="' + col.columnIndex + '">' + '<td>' + col.title + ':' + '</td> ' + '<td>' + col.data + '</td>' + '</tr>' : '';
                        }
                        return '';
                    }).join('');

                    return data ? $('<table class="table mt-3"/><tbody />').append(data) : false;
                }
            }
        }
    });

    $('#btnRefresh').click(function () {
        table.ajax.reload(null, false); // false → Keep current pagination
    });


    // Buton Click
    $("#btnCreate").click(function () {
        $.get("/Department/Create", function (data) {
            $("#createOffcanvasContainer").html(data);
            var offcanvasElement = document.getElementById("offcanvasCreate");
            var offcanvas = new bootstrap.Offcanvas(offcanvasElement);
            offcanvas.show();

            offcanvasElement.addEventListener('shown.bs.offcanvas', function () {
                offcanvasElement.focus();
            });

        });
    });


    $(document).ready(function () {
        $('.Amountright').css('text-align', 'right');
    });








    /// Create Save

    $(document).on("submit", "#createDepartmentForm", function (e) {
        e.preventDefault();

        $.ajax({
            type: "POST",
            url: "/Department/Create",
            data: $(this).serialize(),
            success: function (response) {
                if (response.success) {
                    /*  alert("Department saved successfully!");*/
                    /*reloadUserTable();*/

                    showSuccessAlert("Created");
                    /*  $("#tablediv").load(location.href + " #tablediv");*/

                    //reloadDiv();
                    table.ajax.reload(null, false);
                    $("#createDepartmentForm").find("input[type=text], input[type=email], textarea").val(""); // Clear text, email, and textarea inputs.
                    /*$("#createDepartmentForm").find("select").val(""); // Clear select inputs.*/

                    // Validation Reset
                    $('.field-validation-error').text('').hide();

                    var offcanvasElement = document.getElementById("offcanvasCreate");
                    if (offcanvasElement) {
                        var offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
                        if (offcanvas) {
                            offcanvas.show();
                        }
                    }


                    //location.reload(); // Refresh to show new data
                    // Reload partial view with validation errors
                }
                else {

                    $("#createOffcanvasContainer").html(response);

                    // Ensure offcanvas stays open
                    //var offcanvasElement = document.getElementById("offcanvasCreate");
                    //if (!offcanvasElement.classList.contains("show")) {
                    //  var offcanvas = new bootstrap.Offcanvas(offcanvasElement);
                    //  offcanvas.show();
                    //}
                    var offcanvasElement = document.getElementById("offcanvasCreate");
                    if (offcanvasElement && !offcanvasElement.classList.contains("show")) {
                        var offcanvas = new bootstrap.Offcanvas(offcanvasElement);
                        offcanvas.show();
                    }


                }
            },
            error: function () {
                alert("Error saving department.");
            }
        });
    });


    //$(document).ready(function () {
    //  // This applies the style to all elements with the class "myClass"
    //  $('.cGroup').css('color', 'red');
    //});

    // Edit Save


    $(document).on("submit", "#EditDepartmentForm", function (e) {
        e.preventDefault();

        $.ajax({
            type: "POST",
            url: "/Department/Edit",
            data: $(this).serialize(),
            success: function (response) {
                if (response.success) {
                    /*  alert("Department saved successfully!");*/
                    /*reloadUserTable();*/

                    showSuccessAlert("Edit");
                    /*  $("#tablediv").load(location.href + " #tablediv");*/
                    //reloadDiv();
                    table.ajax.reload(null, false);
                    //$("#createDepartmentForm").find("input[type=text], input[type=email], textarea").val(""); // Clear text, email, and textarea inputs.
                    //$("#createDepartmentForm").find("select").val(""); // Clear select inputs.

                    var offcanvasElement = document.getElementById("offcanvasEdit");
                    if (offcanvasElement) {
                        var offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
                        if (offcanvas) {
                            offcanvas.hide();
                        }
                    }
                }
                else {

                    $("#createOffcanvasContainer").html(response);
                    var offcanvasElement = document.getElementById("offcanvasCreate");
                    if (offcanvasElement && !offcanvasElement.classList.contains("show")) {
                        var offcanvas = new bootstrap.Offcanvas(offcanvasElement);
                        offcanvas.show();
                    }


                }
            },
            error: function () {
                alert("Error saving department.");
            }
        });
    });


});

setTimeout(function () {
    $('.dataTables_filter .form-control').removeClass('form-control-sm');
    $('.dataTables_length .form-select').removeClass('form-select-sm');
    $('.dt-buttons').addClass('d-flex align-items-center');
    $('#userTable_length').addClass('mt-0 mt-md-3 me-2');
}, 300);
function showSuccessAlert(message) {
    var name = message[0].toUpperCase() + message.slice(1);

    Swal.fire({
        title: name,
        text: 'Department ' + message + ' Successfully!',
        icon: 'success',
        confirmButtonText: 'Ok',
        customClass: {
            confirmButton: 'btn btn-success'
        },
        didOpen: () => {
            // Focus on the "OK" button when the modal opens
            const okButton = Swal.getConfirmButton();
            if (okButton) {
                okButton.focus();
            }

            // Close modal when Enter key is pressed
            document.addEventListener('keydown', function handleEnter(event) {
                if (event.key === 'Enter') {
                    Swal.close();
                    document.removeEventListener('keydown', handleEnter); // Remove event listener to prevent duplicate calls
                }
            });
        }
    });
}

function exportExcel() {
    const date = $('#flatpickr-date-end').val() || new Date().toISOString().split('T')[0];
    window.location = `/TrialBalance/ExportExcel?date=${date}`;
}

function exportPdf() {
    const date = $('#flatpickr-date-end').val() || new Date().toISOString().split('T')[0];
    window.open(`/TrialBalance/ExportPdf?date=${date}`, '_blank');
}

function showEdit(userId) {
    $.get("/Department/Edit/" + userId, function (data) {
        $("#createOffcanvasContainer").html(data);
        var offcanvasElement = document.getElementById("offcanvasEdit");
        var offcanvas = new bootstrap.Offcanvas(offcanvasElement);
        offcanvas.show();

    });
}

function showDeleteConfirmation(userId) {
    event.preventDefault(); // prevent form submit
    var userName = document.querySelector('.user-name-full-' + userId).innerText;
    Swal.fire({
        title: 'Delete User',
        // Show the user the user name to be deleted
        html: '<p>Are you sure you want to delete Department ?<br> <span class="fw-medium text-danger">' + userName + '</span></p>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary'
        }
    }).then(function (result) {
        if (result.isConfirmed) {

            $.ajax({
                type: "POST",
                url: "/Department/Delete/",
                data: { id: userId }, // Parameters as object
                success: function (response) {
                    if (response.success) {
                        showSuccessAlert("Deleted");
                        table.ajax.reload(null, false);
                    }

                }
            });

        } else {
            Swal.fire({
                title: 'Cancelled',
                // Show the user that the user has not been deleted.
                html: '<p><span class="fw-medium text-primary">' + userName + '</span> has not been deleted!</p>',
                icon: 'error',
                confirmButtonText: 'Ok',
                customClass: {
                    confirmButton: 'btn btn-success'
                }
            });
        }
    });
}

// Add these functions to your existing JavaScript

// Custom Export Functions
function exportToPdf() {
    const date = $('#flatpickr-date-end').val() || new Date().toISOString().split('T')[0];

    showLoading('Generating PDF...');

    $.ajax({
        type: "POST",
        url: "/TrialBalance/ExportToPdf",
        data: { exportDate: date },
        xhrFields: {
            responseType: 'blob'
        },
        success: function (data) {
            hideLoading();
            // Create blob and download
            var blob = new Blob([data], { type: 'application/pdf' });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `TrialBalance_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
            link.click();
        },
        error: function (xhr) {
            hideLoading();
            Swal.fire('Error', 'Failed to generate PDF', 'error');
        }
    });
}

function exportToExcel() {
    const date = $('#flatpickr-date-end').val() || new Date().toISOString().split('T')[0];

    showLoading('Generating Excel...');

    $.ajax({
        type: "POST",
        url: "/TrialBalance/ExportToExcel",
        data: { exportDate: date },
        xhrFields: {
            responseType: 'blob'
        },
        success: function (data) {
            hideLoading();
            var blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `TrialBalance_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
            link.click();
        },
        error: function (xhr) {
            hideLoading();
            Swal.fire('Error', 'Failed to generate Excel', 'error');
        }
    });
}

function exportToCsv() {
    const date = $('#flatpickr-date-end').val() || new Date().toISOString().split('T')[0];

    showLoading('Generating CSV...');

    $.ajax({
        type: "POST",
        url: "/TrialBalance/ExportToCsv",
        data: { exportDate: date },
        xhrFields: {
            responseType: 'blob'
        },
        success: function (data) {
            hideLoading();
            var blob = new Blob([data], { type: 'text/csv' });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `TrialBalance_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
            link.click();
        },
        error: function (xhr) {
            hideLoading();
            Swal.fire('Error', 'Failed to generate CSV', 'error');
        }
    });
}

function openPrintView() {
    const date = $('#flatpickr-date-end').val() || new Date().toISOString().split('T')[0];
    window.open(`/TrialBalance/PrintView?printDate=${date}`, '_blank');
}

// Loading functions
function showLoading(message = 'Processing...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function hideLoading() {
    Swal.close();
}

// Update your existing DataTable buttons to include custom exports
// Add this to your DataTable configuration:
function initializeCustomExportButtons() {
    // Add custom buttons to your existing DataTable
    $.fn.dataTable.ext.buttons.customPdf = {
        text: '<i class="bx bxs-file-pdf me-2"></i>Custom PDF',
        className: 'dropdown-item',
        action: function (e, dt, node, config) {
            exportToPdf();
        }
    };

    $.fn.dataTable.ext.buttons.customExcel = {
        text: '<i class="bx bxs-file-excel me-2"></i>Custom Excel',
        className: 'dropdown-item',
        action: function (e, dt, node, config) {
            exportToExcel();
        }
    };

    $.fn.dataTable.ext.buttons.customCsv = {
        text: '<i class="bx bxs-file me-2"></i>Custom CSV',
        className: 'dropdown-item',
        action: function (e, dt, node, config) {
            exportToCsv();
        }
    };

    $.fn.dataTable.ext.buttons.customPrint = {
        text: '<i class="bx bx-printer me-2"></i>Custom Print',
        className: 'dropdown-item',
        action: function (e, dt, node, config) {
            openPrintView();
        }
    };
}
