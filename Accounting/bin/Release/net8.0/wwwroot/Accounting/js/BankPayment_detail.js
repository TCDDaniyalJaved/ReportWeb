let rowIndex = 0;

function initializeBankPaymentDetail() {
    const $tbody = $('#ItemsTable tbody');
    const $form = $('#invoiceForm');

    setTimeout(() => {
        // Initialize rowIndex based on existing rows
        rowIndex = $tbody.find('tr').length;

        // If no rows exist, add one non-removable row
        if (rowIndex === 0) {
            addNewRow(true);
        } else {
            // Mark the first existing row as non-removable
            const $firstRow = $tbody.find('tr:first');
            if (!$firstRow.hasClass('nonRemovable')) {
                makeRowNonRemovable($firstRow);
            }

            // Mark other rows as removable
            $tbody.find('tr:not(:first)').each(function () {
                $(this).removeClass('nonRemovable')
                    .find('.btn-icon')
                    .prop('disabled', false)
                    .css({
                        opacity: 1,
                        cursor: 'pointer',
                        'pointer-events': 'auto'
                    });
            });
        }

        attachAllEvents();

        // Alt + N shortcut
        $(document).off('keydown.addrow').on('keydown.addrow', e => {
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                addNewRow();
            }
        });

        // Confirm button
        $('#confirmBtn').off('click').on('click', function () {
            $form.submit();
        });

        // Form submit with validation
        $form.off('submit').on('submit', function (e) {
            e.preventDefault();
            clearFieldErrors();
            //if (!validateDebitCreditRows()) {
            //    showToast('warning', 'Please fix the debit/credit errors before submitting.');
            //    return;
            //}

            $.ajax({
                url: this.action,
                type: 'POST',
                data: $form.serialize(),
                success: response => {
                    if (!response.success) {
                        showValidationErrors(response.errors || {});
                        showToast('warning', 'Please fix all validation errors.');
                        return;
                    }
                    showToast('success', response.message);
                    $form[0].reset();
                    $tbody.empty();
                    rowIndex = 0;
                    addNewRow(true); // fresh first row
                },
                error: () => showToast('error', 'Something went wrong. Please try again.')
            });
        });

        $(document).trigger('validation-errors-updated');
    }, 100);
}

//function validateDebitCreditRows() {
//    let valid = true;
//    $('#ItemsTable tbody tr').each(function () {
//        const $row = $(this);
//        const debit = parseFloat($row.find('[data-debit] input').val()) || 0;
//        const credit = parseFloat($row.find('[data-credit] input').val()) || 0;

//        if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
//            $row.find('[data-debit], [data-credit]').each(function () {
//                showFieldError($(this).find('input'), 'Either Debit or Credit is required, not both.');
//            });
//            valid = false;
//        }
//    });
//    return valid;
//}

function attachAllEvents() {
    $('#ItemsTable tbody tr').each(function () {
        attachRowEvents($(this));
    });
}

function attachRowEvents($row) {
    const $debit = $row.find('[data-debit] input');
    const $credit = $row.find('[data-credit] input');

    const clearOpposite = function () {
        const val = parseFloat(this.value) || 0;
        if (val > 0) {
            (this === $debit[0] ? $credit : $debit).val('').trigger('change');
        }
    };

    $debit.add($credit)
        .off('input.lock change.lock blur.lock')
        .on('input.lock change.lock', clearOpposite)
        .on('blur.lock', () => setTimeout(clearOpposite.bind(this), 50));
}

function addNewRow(makeNonRemovable = false) {
    const $tbody = $('#ItemsTable tbody');
    const currentRowCount = $tbody.find('tr').length;

    // IMPORTANT: Only make it non-removable if:
    // 1. makeNonRemovable is true (explicitly called that way)
    // 2. AND it's the first row (rowCount === 0)
    const shouldBeNonRemovable = makeNonRemovable && currentRowCount === 0;

    const template = $('#itemRowTemplate').html().replace(/INDEX/g, rowIndex++);
    const $newRow = $(template);

    // Append the row
    $tbody.append($newRow);

    // Use MutationObserver to detect when the row is converted
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const $tr = $tbody.find('tr:last');
                if ($tr.length && !$tr.data('processed')) {
                    observer.disconnect();
                    $tr.data('processed', true);

                    attachRowEvents($tr);

                    if (shouldBeNonRemovable) {
                        // Only make it non-removable if it should be
                        makeRowNonRemovable($tr);
                        console.log('Made first row non-removable');
                    } else {
                        // Ensure ALL other rows are removable
                        $tr.removeClass('nonRemovable')
                            .find('.btn-icon')
                            .prop('disabled', false)
                            .css({
                                opacity: 1,
                                cursor: 'pointer',
                                'pointer-events': 'auto'
                            });
                        console.log('Added removable row');
                    }
                    break;
                }
            }
        }
    });

    observer.observe($tbody[0], { childList: true, subtree: true });

    // Fallback timeout
    setTimeout(() => {
        observer.disconnect();
        const $tr = $tbody.find('tr:last');
        if ($tr.length) {
            attachRowEvents($tr);

            if (shouldBeNonRemovable) {
                makeRowNonRemovable($tr);
            }
        }
    }, 500);
}

// Helper function to make a row non-removable
function makeRowNonRemovable($tr) {
    $tr.addClass('nonRemovable')
        .attr('data-non-removable', 'true')
        .find('.btn-icon')
        .prop('disabled', true)
        .css({
            opacity: 0.5,
            cursor: 'not-allowed',
            'pointer-events': 'none'
        });
}

// Fixed removeRow function
window.removeRow = function (btn) {
    const $row = $(btn).closest('tr');
    const $tbody = $('#ItemsTable tbody');
    const totalRows = $tbody.find('tr').length;

    // Check if row is non-removable
    if ($row.hasClass('nonRemovable')) {
        showToast('warning', 'This row cannot be deleted.');
        return false;
    }

    // Clear validation
    $row.find('.text-danger').remove();
    $row.find('.input-validation-error').removeClass('input-validation-error');

    // Remove the row
    $row.remove();

    // Update rowIndex
    rowIndex = $tbody.find('tr').length;

    // If we removed a row and now have only one row, make it non-removable
    if (totalRows === 2 && $tbody.find('tr').length === 1) {
        const $remainingRow = $tbody.find('tr:first');
        if (!$remainingRow.hasClass('nonRemovable')) {
            makeRowNonRemovable($remainingRow);
        }
    }

    $(document).trigger('row-removed');
    updateTotals(); // If you have this function
};

// Reusable Toast Function
function showToast(icon, text, timer = 3000) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        text: text,
        showConfirmButton: false,
        showCloseButton: false,
        showCancelButton: false,
        timer: timer,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false
    });
}

// Error handling
function showFieldError($input, msg) {
    if (!$input.length) return;
    $input.addClass('input-validation-error');
    let $error = $input.parent().find('.text-danger').first();
    if (!$error.length) {
        $error = $('<span class="text-danger"></span>');
        $input.after($error);
    }
    $error.html($error.html() ? $error.html() + '<br>' + msg : msg);
}

function clearFieldErrors() {
    $('.text-danger').empty();
    $('.input-validation-error').removeClass('input-validation-error');
}

function showValidationErrors(errors) {
    clearFieldErrors();
    $.each(errors, (field, msgs) => {
        const $field = $(`[name="${field}"]`);
        if ($field.length) showFieldError($field, msgs[0]);
    });
    $(document).trigger('validation-errors-updated');
}

// Update totals function (add if not exists)
function updateTotals() {
    let totalDebit = 0;
    let totalCredit = 0;

    $('#ItemsTable tbody tr').each(function () {
        const debit = parseFloat($(this).find('[data-debit] input').val()) || 0;
        const credit = parseFloat($(this).find('[data-credit] input').val()) || 0;
        totalDebit += debit;
        totalCredit += credit;
    });

    // Update your total display elements here
    console.log('Total Debit:', totalDebit, 'Total Credit:', totalCredit);
}

// Initialize
window.initializeBankPaymentDetail = initializeBankPaymentDetail;
$(document).ready(() => {
    if ($('#invoiceForm').length) {
        initializeBankPaymentDetail();
    }
});