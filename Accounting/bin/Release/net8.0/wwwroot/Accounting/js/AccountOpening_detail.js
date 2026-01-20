let rowIndex = 0;

function initializeAccountOpeningDetail() {
    const $tbody = $('#ItemsTable tbody');

    // Wait for ebit-number to render their <input> (critical!)
    setTimeout(() => {

        // Ensure one default non-removable row
        if ($tbody.find('tr').length === 0) {
            addNewRow();
            const $firstRow = $tbody.find('tr').first();
            $firstRow.addClass('nonRemovable');
            $firstRow.find('.removeRowBtn')
                .prop('disabled', true)
                .css({ opacity: 0.5, cursor: 'not-allowed' });
        }

        rowIndex = $tbody.find('tr').length;

        // Attach events to rows
        attachEventsToExistingRows();

        // Alt + N shortcut
        $(document).off('keydown.addrow').on('keydown.addrow', function (e) {
            if (e.altKey && e.key.toLowerCase() === 'n') {

                e.preventDefault();

                if (typeof addNewRow === "function") {
                    addNewRow();
                }
            }
        });


        $('#addNewRowBtn').off('click').on('click', addNewRow);

        $('#confirmBtn').on('click', function () {
            $('#invoiceForm').submit();
        });

        // Controlled form submit
        $('#invoiceForm').off('submit').on('submit', function (e) {

            e.preventDefault();
            e.stopPropagation();
            clearFieldErrors();

            const debitCreditValid = validateDebitCreditRows();
            if (!debitCreditValid) {
                showWarningAlert("Please fix the debit/credit errors before submitting.");
                return;
            }

            const $form = $(this);
            const formData = $form.serialize();

            $.ajax({
                url: $form.attr('action'),
                type: 'POST',
                data: formData,
                success: function (response) {

                    if (!response.success) {
                        showValidationErrors(response.errors || {});
                        showWarningAlert("Please fix all validation errors");
                        return;
                    }

                    showSuccessAlert("Created");

                    //  RESET FORM after success
                    $form[0].reset();

                    // Reset rows
                    $('#ItemsTable tbody').empty();
                    rowIndex = 0;
                    addNewRow();
                },

                error: function (xhr) {
                    console.error('AJAX Error:', xhr);
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        text: 'Something went wrong. Please try again later.',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        customClass: { popup: 'bootstrap-toast' },
                        didOpen: (toast) => {
                            toast.addEventListener('mouseenter', Swal.stopTimer);
                            toast.addEventListener('mouseleave', Swal.resumeTimer);
                        }
                    });
                }
            });
        });

        $(document).trigger('validation-errors-updated');

    }, 100); // Critical delay for ebit-number
}

// Debit/Credit validation
function validateDebitCreditRows() {
    let hasError = false;

    $('#ItemsTable tbody tr').each(function () {

        const $row = $(this);

        const $debit = $row.find('ebit-number[data-debit] input');
        const $credit = $row.find('ebit-number[data-credit] input');

        const debitVal = parseFloat($debit.val()) || 0;
        const creditVal = parseFloat($credit.val()) || 0;

        // Rule 1: Both can't be filled
        if (debitVal > 0 && creditVal > 0) {
            showFieldError($debit, "Either Debit or Credit is required.");
            showFieldError($credit, "Either Debit or Credit is required.");
            hasError = true;
        }

        // Rule 2: At least one must be filled
        if (debitVal === 0 && creditVal === 0) {
            showFieldError($debit, "Either Debit or Credit is required.");
            showFieldError($credit, "Either Debit or Credit is required.");
            hasError = true;
        }
    });

    return !hasError;
}


function showFieldError($field, message) {
    if ($field.length === 0) return;

    $field.addClass('input-validation-error');

    let $error = $field.closest('td, .col-sm-10, .mb-3').find('.text-danger').first();
    if ($error.length === 0) {
        $error = $('<span class="text-danger"></span>');
        $field.after($error);
    }

    if ($error.text()) $error.append('<br>' + message);
    else $error.text(message);
}

function clearFieldErrors() {
    $('.text-danger').text('');
    $('.input-validation-error').removeClass('input-validation-error');
}

function showValidationErrors(errors) {
    clearFieldErrors();
    let hasError = false;

    $.each(errors, function (fieldName, messages) {
        hasError = true;

        const $field = $(`[name="${fieldName}"]`);
        if ($field.length === 0) return;

        showFieldError($field, messages[0]);
    });

    if (hasError && $('#validationSummary').length) {
        const list = Object.values(errors).map(m => `<li>${m[0]}</li>`).join('');
        $('#validationSummary').removeClass('d-none').find('ul').html(list);
    }

    $(document).trigger('validation-errors-updated');
}

function attachRowEvents($row) {
    const $debitInput = $row.find('ebit-number[data-debit] input');
    const $creditInput = $row.find('ebit-number[data-credit] input');

    // Helper function to clear opposite field
    const clearOpposite = function () {
        if (this === $debitInput[0] && (parseFloat(this.value) || 0) > 0) {
            $creditInput.val('').trigger('change'); // trigger change for ebit-number
        } else if (this === $creditInput[0] && (parseFloat(this.value) || 0) > 0) {
            $debitInput.val('').trigger('change');
        }
    };

    // Multiple events jo value change ko catch kar sake
    $debitInput.off('input.lock change.lock').on('input.lock change.lock', clearOpposite);
    $creditInput.off('input.lock change.lock').on('input.lock change.lock', clearOpposite);

    // Extra safety: Agar koi aur tarike se value set ho (jaise JS se ya copy-paste)
    $debitInput.add($creditInput).on('blur.lock', function () {
        setTimeout(clearOpposite.bind(this), 50); // ebit-number formatting ke baad
    });
}


function attachEventsToExistingRows() {
    $('#ItemsTable tbody tr').each(function () {
        attachRowEvents($(this));
    });
}

function addNewRow() {
    const template = $('#itemRowTemplate').html();
    const newRow = template.replace(/INDEX/g, rowIndex);

    const $newRow = $(newRow);
    $('#ItemsTable tbody').append($newRow);

    // Force ebit-number to render input
    setTimeout(() => {
        $newRow.find('ebit-number').each(function () {
            if (!this.querySelector('input')) {
                this.connectedCallback();
            }
        });

        attachRowEvents($newRow);

    }, 50);

    rowIndex++;
    $(document).trigger('row-added');
}

window.removeRow = function (btn) {
    const $row = $(btn).closest('tr');
    if ($row.hasClass('nonRemovable')) {
        showWarningAlert('The first row cannot be deleted.');
        return;
    }

    $row.remove();
};

window.initializeAccountOpeningDetail = initializeAccountOpeningDetail;

$(document).ready(function () {
    if ($('#invoiceForm').length) {
        initializeAccountOpeningDetail();
    }
});

function showSuccessAlert(message) {
    return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        text: 'Account Opening ' + message + ' Successfully!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: { popup: 'bootstrap-toast' },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}

function showWarningAlert(message) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        text: 'Warning: ' + message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: { popup: 'bootstrap-toast' },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}
