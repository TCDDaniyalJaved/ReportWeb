
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

        // Now safe: attach events + calculate
        attachEventsToExistingRows();
        calculateTotals();

        // Alt + N shortcut
        $(document).off('keydown.addrow').on('keydown.addrow', function (e) {
            if (e.altKey && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                $('#addNewRowBtn').click();
            }
        });

        $('#addNewRowBtn').off('click').on('click', addNewRow);


        $('#confirmBtn').on('click', function () {
            $('#invoiceForm').submit();
            //showWarningAlert("AccountOpeningDetailSumbit")

        });

        // Controlled form submit
        $('#invoiceForm').off('submit').on('submit', function (e) {

            //showWarningAlert("AccountOpeningDetailSumbit")
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

                    showSuccessAlert("Created")
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
        const $debit = $row.find('input[name$=".Debit"]');
        const $credit = $row.find('input[name$=".Credit"]');
        const debitVal = parseFloat($debit.val()) || 0;
        const creditVal = parseFloat($credit.val()) || 0;
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

// Critical: Comma-safe + null-safe
function calculateTotals() {
    let totalDebit = 0, totalCredit = 0;
    $('#ItemsTable tbody tr').each(function () {
        const $debit = $(this).find('input[name$=".Debit"]');
        const $credit = $(this).find('input[name$=".Credit"]');

        const debitVal = parseFloat(($debit.val() || '0').replace(/,/g, '')) || 0;
        const creditVal = parseFloat(($credit.val() || '0').replace(/,/g, '')) || 0;

        totalDebit += debitVal;
        totalCredit += creditVal;
    });
    const diff = totalDebit - totalCredit;
    $('#totalDebit').text(totalDebit.toFixed(2) + ' Rs.');
    $('#totalCredit').text(totalCredit.toFixed(2) + ' Rs.');
    $('#difference').text(diff.toFixed(2) + ' Rs.');
    return diff;
}

function attachRowEvents($row) {
    const $debit = $row.find('input[name$=".Debit"]');
    const $credit = $row.find('input[name$=".Credit"]');

    $debit.add($credit).off('input.calc').on('input.calc', function () {
        if ($(this).is($debit) && $debit.val()) $credit.val('');
        else if ($(this).is($credit) && $credit.val()) $debit.val('');
        calculateTotals();
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

    // Critical: Force ebit-number to render input
    setTimeout(() => {
        $newRow.find('ebit-number').each(function () {
            if (!this.querySelector('input')) {
                this.connectedCallback(); // Re-init
            }
        });
        attachRowEvents($newRow);
        calculateTotals();

        const diff = calculateTotals();
        if (diff < 0) {
            const $debit = $newRow.find('input[name$=".Debit"]');
            if ($debit.length) {
                $debit.val(Math.abs(diff).toFixed(2)).trigger('blur');
            }
        }
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
    calculateTotals();
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
        toast: true, position: 'top-end', icon: 'warning',
        text: 'Warning: ' + message,
        showConfirmButton: false, timer: 3000, timerProgressBar: true,
        customClass: { popup: 'bootstrap-toast' },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}