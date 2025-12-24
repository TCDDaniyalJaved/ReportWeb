
var table;
let stepper = null;

//let stepper;
var currentFilters = {
    companyId: '',
    groupId: ''
};
function initializeDataTable() {

    if ($.fn.DataTable.isDataTable('#userTable')) {
        $('#userTable').DataTable().destroy();

    }
    table = $('#userTable').DataTable({
        processing: true,
        serverSide: true,


        "stripeClasses": ['even-row', 'odd-row'],
        "ajax": {
            "url": "/Accounting/Chart/GetData",
            "type": "POST",
            data: function (d) {
                // Attach companyId array and groupId
                if (Array.isArray(currentFilters.companyId)) {
                    currentFilters.companyId.forEach((id, index) => {
                        d[`companyId[${index}]`] = id;  // Send as array: companyId[0], companyId[1], ...
                    });
                } else {
                    d.companyId = currentFilters.companyId;
                }

                d.groupId = currentFilters.groupId;

                console.log("Sending filters:", {
                    companyId: currentFilters.companyId,
                    groupId: currentFilters.groupId
                });
            }
        },
        // Any Row Click Edit Mode
        "createdRow": function (row, data, dataIndex) {
            $(row).css('cursor', 'pointer');
            $(row).on('click', function (e) {
                const tagName = e.target.tagName.toLowerCase();
                if (!['input', 'button', 'a', 'label', 'i'].includes(tagName) &&
                    !$(e.target).closest('[onclick]').length) {
                    showEdit(data.id);
                }
            });

            $(row).find('td:eq(2)').addClass('user-name text-nowrap');
            $(row).find('td:eq(3)').addClass('user-name text-nowrap');
        },
        "columns": [
            {
                data: 'id',
                render: function (data, type, row) {
                    return `<input type="checkbox" class="dt-checkboxes form-check-input delete-checkbox" data-id="${data}">`;
                }
            },

            {
                "data": "name",
                "name": "Name",
                "render": function (data, type, row) {
                    return `<div class="user-name-full-${row.id} user-name-full">${data || ''}</div>`;
                }
            },
            {
                "data": "natureName",
                "name": "NatureName",
                "render": function (data, type, row) {
                    return `<div>${data || ''}</div>`
                }
            },


            {
                "data": "id",
                searchable: false,
                //   searchBuilder: false,
                "render": function (data, type, row) {
                    return `<button class="btn btn-icon edit-user-button" data-bs-toggle="offcanvas" id="${row.id}-editUser" onclick="showEdit(${row.id})" > <i class="bx bx-edit bx-md"></i> </button> <button class="btn btn-icon" id="${row.id}-deleteUser" onclick="showDeleteConfirmation(${row.id})"> <i class="bx bx-trash bx-md"></i> </button>`;

                }
            }
        ],
        scrollX: false,
        scrollY: false,
        scrollCollapse: false,
        //fixedColumns: false,
        deferRender: true,
        displayLength: 7,
        pagingType: "full_numbers_limited",
        //fixedColumns: {
        //  leftColumns: 0,
        //  leftColumns: 1,
        //  rightColumns: 1,
        //},
        dom: '<"d-flex flex-wrap flex-column flex-sm-row  py-sm-0"' +
            '<"w-100 d-flex flex-wrap flex-sm-nowrap ps-4 pe-4 justify-content-between align-items-center "' +
            '<"d-flex align-items-center pb-0 pt-0  header gap-2"' +
            '<"new-btn-container">' +
            '<"datatable-heading fw-700">' +
            '>' +
            '<""B>' +
            '<"col-sm-6 col-md-6"f>' + '<"select-btn-container d-none">' +
            '>' +
            '<"d-flex col-md-12 ps-4 flex-wrap col-sm-12 justify-content-between"' +
            '<"pb-0 p-0"p>' +
            '<"p-0"l>' +
            '>' +

            '>t',

        lengthMenu: [[7, 10, 15, 20, -1], [7, 10, 15, 20, "All"]],
        language: {
            paginate: {
                next: '>',
                previous: '<'
            },
            searchPlaceholder: 'Search..',
            search: '',
            lengthMenu: '_MENU_'
        },
        buttons: [

            //{
            //  text: '<i class="bx bx-save me-0 me-sm-1_5"></i><span class="d-none d-sm-inline-block">Delete All</span>',
            //  className: 'btn btn-secondary d-none',
            //  attr: { id: 'btnDeleteSelected' }
            //}
        ],
        initComplete: function () {
            var api = this.api();
            $('.new-btn-container').html(
                `<button class="btn btn-primary" id="btnCreate" data-target="#personal-info"><span class="d-sm-inline-block">New</span></button>
        `
            );
            $('.select-btn-container').html(
                ` <div class="btn-group mb-5 pb-5" role="group">
         <button class= "btn btn-outline-secondary" id = "btnSelectAll" > Select All</button >
         <button class="btn btn-outline-secondary" id="btnDeselectAll">Deselect All</button>
        </div>`

            );
            $('#btnSelectAll').on('click', function () {
                $('#userTable tbody input.dt-checkboxes[type="checkbox"]').prop('checked', true);
                $('#select-all').prop('checked', true);
            });

            $('#btnDeselectAll').on('click', function () {
                $('#userTable tbody input.dt-checkboxes[type="checkbox"]').prop('checked', false);
                $('#select-all').prop('checked', false);
            });

            $('#btnCreate').on('click', function () {
                if (window.stepper) {
                    stepper.to(2);
                    loadCreateForm();
                    history.pushState({ page: "create" }, "Create Chart", "/accounting/chart/create");
                } else {
                    console.warn('Stepper not initialized, loading create form directly');
                    loadCreateForm();
                }
            });

            $('.datatable-heading').text('Chart of Account').css('font-size', '20px');



            $('.dataTables_filter').each(function () {
                const $filter = $(this);
                const $input = $filter.find('input');
                const placeholder = $input.attr('placeholder') || 'Search...';
                const inputGroup = $(`
          <div class="input-group">
            <span class="input-group-text d-none"><i class="fa fa-search"></i></span>
            <input type="search" class="form-control" placeholder="${placeholder}" />
            <span class="input-group-text" id="filter" style="cursor:pointer;">
              <i class="bx bx-filter"></i>
            </span>
              <span class="input-group-text" id="clearAllfilter" style="cursor:pointer;"  data-bs-toggle="tooltip" data-bs-placement="bottom" title="Clear Filters">
              <i class="bx bx-refresh"></i>
            </span>
          </div>
        `);


                $filter.html(inputGroup);
                var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
                var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl)
                })
                inputGroup.find('input').on('input', function () {
                    api.search(this.value).draw();
                });
                // inputGroup.find('input').removeClass('no-border-input')
                inputGroup.find('#filter').on('click', function () {
                    showFilterModal();
                });

                inputGroup.find('#clearAllfilter').on('click', function () {
                    resetFilters();
                });
            });

        },
        columnDefs: [
            {
                targets: 0,
                orderable: false,
                checkboxes: {
                    selectAllRender: '<input type="checkbox" id="select-all" class="form-check-input">'
                },
                render: function () {
                    return '<input type="checkbox" class="dt-checkboxes form-check-input" >';
                },
                orderable: false,
            }, {
                targets: 1,
                responsivePriority: 4
            }, {
                targets: 2,
                responsivePriority: 3
            },



            {
                targets: -1,
                orderable: false,
                responsivePriority: 1
            }],
    });

}
$.fn.dataTable.ext.pager.full_numbers_limited = function (page, pages) {
    const visible = 2;
    const buttons = [];

    buttons.push('previous');

    if (pages <= visible + 2) {
        for (let i = 0; i < pages; i++) {
            buttons.push(i);
        }
    } else {
        if (page < visible) {
            for (let i = 0; i < visible; i++) {
                buttons.push(i);
            }
            buttons.push('ellipsis');
            buttons.push(pages - 1);
        } else if (page >= pages - visible) {
            buttons.push(0);
            buttons.push('ellipsis');
            for (let i = pages - visible; i < pages; i++) {
                buttons.push(i);
            }
        } else {
            buttons.push(0);
            buttons.push('ellipsis');
            buttons.push(page);
            buttons.push('ellipsis');
            buttons.push(pages - 1);
        }
    }

    buttons.push('next');

    return buttons;
};
function initializeStepper() {
    const stepperElement = document.querySelector('#wizardStepper');
    if (stepperElement) {
        stepper = new Stepper(stepperElement);
        window.stepper = stepper;
        console.log('Stepper initialized');
    } else {
        console.warn('Stepper element not found');
    }
}
//Create
function loadCreateForm() {
    $.get("/accounting/chart/Create", function (data) {
        $('#personal-info').html(data);
        toggleMappingSection('#createChartForm');
        select2dropdawn('#createChartForm');
        if (typeof $.validator !== 'undefined') {
            $.validator.unobtrusive.parse('#personal-info');
        }
    });
}
$(document).ready(function () {

    initializeStepper();
    loadCreateForm();
    initializeDataTable();
    //select2dropdawn();
    $(document).on('change', '.delete-checkbox', function () {
        selectAllbutton();
    });
    $('#select-all').on('change', function () {
        $('.delete-checkbox').prop('checked', this.checked);
        selectAllbutton();
    });

    $('#btnSelectAll').on('click', function () {
        $('.delete-checkbox').prop('checked', true);
        $('#select-all').prop('checked', true);
        selectAllbutton();
    });
    $('#btnDeselectAll').on('click', function () {
        $('.delete-checkbox').prop('checked', false);
        $('#select-all').prop('checked', false);
        $('.select-btn-container').addClass('d-none');
    });
    // ---------- MULTIPLE DELETE ------------
    // updateDeleteAllButton();
    // For each row checkbox
    //$(document).on('change', '.delete-checkbox', function () {
    //  updateDeleteAllButton();
    //});

    //// For select all checkbox
    //$(document).on('change', '#select-all', function () {
    //  $('.delete-checkbox').prop('checked', this.checked);
    //  updateDeleteAllButton();
    //});

    //$('#btnDeleteSelected').click(function () {
    //  const selectedIds = [];

    //  $('.delete-checkbox:checked').each(function () {
    //    selectedIds.push($(this).data('id'));
    //  });
    //  console.log($('.delete-checkbox:checked').map(function () { return $(this).data('id'); }).get());
    //  if (selectedIds.length === 0) {
    //    Swal.fire('No Selection', 'Please select at least one record.', 'info');
    //    return;
    //  }
    //  console.log("selected ids" + JSON.stringify(selectedIds)),
    //    Swal.fire({
    //      title: 'Delete Selected',
    //      html: `<p>Are you sure you want to delete <strong class="text-danger">${selectedIds.length}</strong> selected item(s)?</p>`,
    //      icon: 'warning',
    //      showCancelButton: true,
    //      confirmButtonText: 'Delete',
    //      cancelButtonText: 'Cancel',
    //      customClass: {
    //        confirmButton: 'btn btn-danger',
    //        cancelButton: 'btn btn-secondary'
    //      }
    //    }).then((result) => {
    //      if (result.isConfirmed) {
    //        console.log("Selected IDs:", JSON.stringify(selectedIds));
    //        $.ajax({
    //          url: '/Chart/BulkDelete',
    //          type: 'POST',
    //          contentType: 'application/json',
    //          data: JSON.stringify(selectedIds),
    //          success: function (response) {
    //            if (response.success) {
    //              showSuccessAlert("Selected records deleted");
    //              table.ajax.reload(null, false);
    //            } else {
    //              console.log(JSON.stringify(selectedIds)),
    //                showErrorAlert(response.message || 'Something went wrong.');
    //            }
    //          },
    //          error: function () {
    //            showErrorAlert('Server error occurred.');
    //          }
    //        });
    //      }
    //    });
    //});


    $('.datatable-heading').text('Chart Of Account').css('font-size', '20px')
    $(document).on('click', '.btn-next', function () {
        if (window.stepper) {
            stepper.next();
        }
    });


    $(document).on('click', '.btn-label-danger', function () {
        if (window.stepper) {
            stepper.to(1);
            history.pushState({ page: "list" }, "Chart List", "/accounting/chart/list");
        }

    });
    $(document).on('hidden.bs.offcanvas', '#offcanvasCreate, #offcanvasEdit', function () {
        $('body').css('overflow', ''); // Restore scroll
        if (table && $.fn.DataTable.isDataTable('#userTable')) {
            table.ajax.reload(null, false); // Refresh data, keep current page
            console.log('Offcanvas closed, DataTable refreshed');
        } else {
            initializeDataTable(); // Fallback to reinitialization if table not initialized
            console.log('Offcanvas closed, DataTable reinitialized');
        }
    });

    // Create Form Submission
    $(document).on("submit", "#createChartForm", function (e) {
        e.preventDefault();

        var $form = $(this);
        //$.ajax({
        //  type: "POST",
        //  url: "/Chart/Create",
        //  data: $form.serialize(),
        //  success: function (response) {
        //    if (response.success) {
        //      showSuccessAlert("Created");
        //      table.ajax.reload(null, false);
        //      $form[0].reset();
        //      $form.find("select.select2").val(null).trigger("change");
        //      $('.field-validation-error').text('').hide();

        //    } else {
        //      $("#personal-info").html(response);
        //      toggleMappingSection('#createChartForm');
        //      toggleAssetTempId('#createChartForm');
        //      if (typeof $.validator !== 'undefined') {
        //        $form.validate().resetForm();
        //        $.validator.unobtrusive.parse($form);
        //      }
        //      var firstInvalidField = $form.find(".field-validation-error:visible").first().closest(".form-group").find("input, textarea, select").first();
        //      if (firstInvalidField.length) {
        //        firstInvalidField.focus();
        //      }
        //    }
        //  },
        //  error: function () {
        //    alert("Error saving Chart.");
        //  }
        //});
        //let token = $('input[name="__RequestVerificationToken"]').val();

        $.ajax({
            type: "POST",
            url: "/Accounting/Chart/Create",
            /* data: $form.serialize() + "&__RequestVerificationToken=" + token,*/
            data: $form.serialize(),
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    showSuccessAlert("Created");
                    table.ajax.reload(null, false);
                    $form[0].reset();
                    $form.find("select.select2").val(null).trigger("change");
                } else {
                    // Handle validation errors
                    //toggleMappingSection('#createChartForm');
                    //toggleAssetTempId('#createChartForm');
                    for (let key in response.errors) {
                        let errorMsg = response.errors[key][0];
                        let field = $form.find(`[name="${key}"]`);
                        field.next(".text-danger").text(errorMsg).removeClass("d-none");
                    }
                }
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                console.log("Error saving Chart." + xhr.responseText);
            }
        });

    });


    $(document).on("submit", "#EditChartForm", function (e) {
        e.preventDefault();
        var $form = $(this);
        $form.find('select.select2').trigger('change');
        var formData = $form.serialize();
        //$.ajax({
        //  type: "POST",
        //  url: "/Chart/Edit",
        //  data: formData,
        //  success: function (response) {
        //    if (response.success) {
        //      showSuccessAlert("Edited");
        //      if (table && $.fn.DataTable.isDataTable('#userTable')) {
        //        table.ajax.reload(null, false);
        //      } else {
        //        initializeDataTable();
        //      }
        //    } else {
        //      $("#personal-info").html(response);
        //      toggleMappingSection('#EditChartForm');
        //      toggleAssetTempId('#EditChartForm');
        //      if (typeof $.validator !== 'undefined') {
        //        $form.validate().resetForm();
        //        $.validator.unobtrusive.parse($form);
        //      }
        //      var firstInvalidField = $form.find(".field-validation-error:visible").first().closest(".form-group").find("input, textarea, select").first();
        //      if (firstInvalidField.length) {
        //        firstInvalidField.focus();
        //      }
        //    }
        //  },
        //  error: function (xhr, status, error) {
        //    console.error("Error details:", { status, error, responseText: xhr.responseText });
        //    alert("Error saving Edit NewChart: " + error);
        //  }
        //});
        //let token = $('input[name="__RequestVerificationToken"]').val();

        $.ajax({
            type: "POST",
            url: "/Accounting/Chart/Edit",
            data: $form.serialize(),
            dataType: "json",
            success: function (response) {
                if (response.success) {
                    showSuccessAlert("Edited");
                    if (table && $.fn.DataTable.isDataTable('#userTable')) {
                        table.ajax.reload(null, false);
                    } else {
                        initializeDataTable();
                    }
                } else {

                    // Handle validation errors
                    for (let key in response.errors) {
                        let errorMsg = response.errors[key][0];
                        let field = $form.find(`[name="${key}"]`);
                        field.next(".text-danger").text(errorMsg).removeClass("d-none");
                    }
                }
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                alert("Error saving Chart." + xhr.responseText);
            }
        });
    });
    $(document).on('hidden.bs.offcanvas', '#offcanvasCreate, #offcanvasEdit', function () {
        $('body').css('overflow', '');
    });
});

setTimeout(function () {
    $('.dataTables_filter .form-control').removeClass('form-control-sm');
    $('.dataTables_length .form-select').removeClass('form-select-sm');
    $('.dt-buttons').addClass('d-flex align-items-center');
    $('#userTable_length').addClass('mt-0 mt-md-3 me-2');
}, 300);

// NatureId Conditions 
function toggleMappingSection(formContext) {
    var $form = $(formContext);
    var $natureIdSelect = $form.find('#NatureId');
    var natureId = $natureIdSelect.val();
    if (natureId === '1' || natureId === '9') {
        $form.find('#mappingSection').show();
    } else {
        $form.find('#mappingSection').hide();
        $form.find('input[name="Mapping"]').prop('checked', false);
    }
}

function toggleAssetTempId(formContext) {
    var $form = $(formContext);
    var $natureIdSelect = $form.find('#NatureId');
    var natureId = $natureIdSelect.val();
    //console.log('NatureId value in toggleAssetTempId:', natureId);
    if (natureId === '6') {
        $form.find('#AssetTempId').closest('.mb-3').show();
    } else {
        $form.find('#AssetTempId').closest('.mb-3').hide();
        $form.find('#AssetTempId').val('');
    }
}


$(document).on('change', '#NatureId', function () {
    var formContext = $(this).closest('form');
    toggleMappingSection(formContext);
    toggleAssetTempId(formContext);
});
function showEdit(userId) {
    history.pushState({ page: "edit" }, "Edit Chart", "/accounting/chart/edit");
    $.get("/Accounting/Chart/Edit/" + userId, function (data) {
        $("#personal-info").html(data);
        select2dropdawn('#EditChartForm');
        stepper.to(2);
        if ($.fn.select2) {
            $('#EditChartForm select.select2').select2();
        }
        setTimeout(() => {
            toggleMappingSection('#EditChartForm');
            toggleAssetTempId('#EditChartForm');
        }, 100);
    });
}
function showFilterModal() {
    const offcanvasElement = document.getElementById('filterOffcanvas');
    if (offcanvasElement) {
        const filterOffcanvas = new bootstrap.Offcanvas(offcanvasElement);
        filterOffcanvas.show();
    } else {
        $.ajax({
            url: '/Chart/Search',
            type: 'GET',
            success: function (data) {
                $('body').append(data);
                const newOffcanvasElement = document.getElementById('filterOffcanvas');
                if (newOffcanvasElement) {
                    const filterOffcanvas = new bootstrap.Offcanvas(newOffcanvasElement);
                    filterOffcanvas.show();
                    $(".select2").select2({
                        dropdownParent: $("#filterOffcanvas"),
                        placeholder: "",
                        width: "100%",
                        //  multiple: true,
                        allowClear: true,
                        //width: '100%',
                        closeOnSelect: true,
                    });

                    console.log('Filter offcanvas loaded');

                }
                // Destroy on hide
                $("#filterOffcanvas").on("hidden.bs.offcanvas", function () {
                    $(".select2").select2("destroy");
                });
            },
            error: function (xhr, status, error) {
                console.error('Error loading filter offcanvas:', error);
                showErrorAlert('Could not load filter offcanvas.');
            }
        });
    }
}
function updateFilter() {

    const companyId = $('#FilterCompanyId').val() || [];
    const groupId = $('#FilterGroupId').val() || [];
    console.log("Selected Company ID:", companyId);
    console.log("Selected Group ID:", groupId);

    window.currentFilters = window.currentFilters || {};
    window.currentFilters.companyId = companyId;
    window.currentFilters.groupId = groupId;

    console.log("Updated currentFilters:", window.currentFilters);


    const table = $('#userTable').DataTable();
    table.ajax.reload(null, false);

    const offcanvasElement = document.getElementById('filterOffcanvas');
    if (offcanvasElement) {
        const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (offcanvas) {
            offcanvas.hide();
        }
    }
}


function resetFilters() {
    $('#CompanyId').val('');
    $('#GroupId').val('0');

    currentFilters = {
        companyId: '',
        groupId: ''
    };

    table.ajax.reload();

    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('filterOffcanvas'));
    if (offcanvas) offcanvas.hide();
}
$(function () {
    $('button[data-bs-target="#navs-pills-top-profile"]').on('click', function () {
        $.get("/Chart/Create", function (data) {
            $("#formTabContent").html(data);

            toggleMappingSection('#createChartForm');
            toggleAssetTempId('#createChartForm');
            $('button[data-bs-target="#navs-pills-top-profile"]').text("New");
            $('button[data-bs-target="#navs-pills-top-profile"]').tab('show');
        });
    });

});
function selectAllbutton() {
    const selectedCount = $('.delete-checkbox:checked').length;
    const $btn = $('.select-btn-container');
    const $filterbtn = $('#userTable_filter');

    if (selectedCount > 0) {
        $btn.removeClass('d-none');
        $filterbtn.addClass('d-none');
    } else {
        $filterbtn.removeClass('d-none');
        $btn.addClass('d-none');
    }
}
//function updateDeleteAllButton() {
//  const selectedCount = $('.delete-checkbox:checked').length;
//  const $btn = $('#btnDeleteSelected');
//  const $filterbtn = $('#userTable_filter');
//  //$btn.find('span').text(`Delete (${selectedCount})`);
//  if (selectedCount > 0) {
//    $btn.removeClass('d-none');
//    $filterbtn.addClass('d-none');// Show
//    $btn.find('span').text(`Delete(${selectedCount})`);
//  } else {
//    $filterbtn.removeClass('d-none');
//    $btn.addClass('d-none'); // Hide
//    $btn.find('span').text('Delete All');
//  }
//}


//Add New AssetTemplate
$(document).on('change', '#AssetTempId', function () {
    /* console.log('AssetTempId changed to:', $(this).val());*/
    if ($(this).val() === '__add_new__') {
        console.log('Calling showAssetTemplateModal');
        showAssetTemplateModal();
        $(this).val('');
    }
});
function refreshAssetTempIdDropdown(newId, newName) {
    var $dropdown = $('#AssetTempId');
    $dropdown.append(`<option value="${newId}">${newName}</option>`);
    $dropdown.val(newId);
}
function showDeleteConfirmation(userId) {
    event.preventDefault(); // prevent form submit
    var userName = document.querySelector('.user-name-full-' + userId).innerText;

    Swal.fire({
        title: 'Delete Account',
        // Show the user the user name to be deleted
        html: '<p>Are you sure you want to delete Account ?<br> <span class="fw-medium text-danger">' + userName + '</span></p>',
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
                url: "/Chart/Delete",
                data: { id: userId },
                success: function (response) {
                    if (response.success) {
                        showSuccessAlert("Deleted");
                        table.ajax.reload(null, false);
                    } else {
                        Swal.fire({
                            title: 'Error',
                            text: response.message || "Something went wrong.",
                            icon: 'error',
                            confirmButtonText: 'Ok',
                            customClass: {
                                confirmButton: 'btn btn-danger'
                            }
                        });
                    }
                },
                error: function () {
                    Swal.fire({
                        title: 'Error',
                        text: 'An unexpected error occurred.',
                        icon: 'error',
                        confirmButtonText: 'Ok',
                        customClass: {
                            confirmButton: 'btn btn-danger'
                        }
                    });
                }
            });
        }
        //else {
        //  Swal.fire({
        //    title: 'Cancelled',
        //    html: '<p><span class="fw-medium text-primary">' + userName + '</span> has not been deleted!</p>',
        //    icon: 'error',
        //    confirmButtonText: 'Ok',
        //    customClass: {
        //      confirmButton: 'btn btn-success'
        //    }
        //  });
        //}

    });
}



function showSuccess3Alert(title, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: 'success',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'btn btn-success' }
    });
}
//function showErrorAlert(message) {
//  Swal.fire({
//    title: 'Error',
//    text: message,
//    icon: 'error',
//    confirmButtonText: 'Close',
//    customClass: { confirmButton: 'btn btn-danger' }
//  });
//}
function showErrorAlert(message) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'Error',
        //  title: title,
        text: message,
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

window.addEventListener('beforeunload', function (e) {
    const filters = window.currentFilters || {};
    const isFiltered = (filters.companyId && filters.companyId !== '') || (filters.groupId && filters.groupId !== '0');

    if (isFiltered) {
        const confirmationMessage = "You have applied filters. Refreshing will reset them. Do you want to continue?";

        e.preventDefault(); // For some browsers
        e.returnValue = confirmationMessage; // Standard for most modern browsers
        return confirmationMessage;
    }
});

//For Development Purpose only
function clearDevCache() {
    localStorage.clear();
    sessionStorage.clear();
    caches.keys().then(function (names) {
        for (let name of names)
            caches.delete(name);
    });
    alert("Cache cleared! Refreshing...");
    location.reload(true);
}
