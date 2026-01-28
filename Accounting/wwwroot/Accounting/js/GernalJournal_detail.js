let rowIndex = 0;

function initializeGernalJournalDetail() {
    const $tbody = $('#ItemsTable tbody');
    const $form = $('#invoiceForm');

    setTimeout(() => {
        rowIndex = $tbody.find('tr').length;

        if (rowIndex === 0) {
            addNewRow(true);
        } else {
            const $firstRow = $tbody.find('tr:first');
            if (!$firstRow.hasClass('nonRemovable')) makeRowNonRemovable($firstRow);

            $tbody.find('tr:not(:first)').each(function () {
                $(this).removeClass('nonRemovable')
                    .find('.btn-icon')
                    .prop('disabled', false)
                    .css({ opacity: 1, cursor: 'pointer', 'pointer-events': 'auto' });
            });
        }

        attachAllEvents();

        // Alt+N shortcut
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

        // Form submit
        $form.off('submit').on('submit', function (e) {
            e.preventDefault();
            clearFieldErrors();

            if (!validateDebitCreditRows()) {
                showToast('warning', 'Please fix the debit/credit errors before submitting.');
                return;
            }

            if (!validateTotalBalance()) return;

        //    $.ajax({
        //        url: this.action,
        //        type: 'POST',
        //        data: $form.serialize(),
        //        success: response => {
        //            if (!response.success) {
        //                showValidationErrors(response.errors || {});
        //                showToast('warning', response.message || 'Please fix all validation errors.');
        //                return;
        //            }
        //            showToast('success', response.message);
        //            $form[0].reset();
        //            $tbody.empty();
        //            rowIndex = 0;
        //            addNewRow(true);
        //        },
        //        error: () => showToast('error', 'Something went wrong. Please try again.')
        //    });
            //});
            $.ajax({
                url: this.action,
                type: 'POST',
                data: $form.serialize(),
                success: response => {
                    if (!response.success) {
                        // Show field errors if any
                        if (response.errors) showValidationErrors(response.errors);

                        // Show server message in toast
                        if (response.message) {
                            showToast('warning', response.message);
                        } else {
                            showToast('warning', 'Please fix all validation errors.');
                        }
                        return;
                    }

                    // Success
                    showToast('success', response.message);
                    $form[0].reset();
                    $('#ItemsTable tbody').empty();
                    rowIndex = 0;
                    addNewRow(true);
                },
                error: () => showToast('error', 'Something went wrong. Please try again.')
            });
        });

        $(document).trigger('validation-errors-updated');
    }, 100);
}

// Row-level validation
function validateDebitCreditRows() {
    let valid = true;
    $('#ItemsTable tbody tr').each(function () {
        const $row = $(this);
        const debit = parseFloat($row.find('[data-debit] input').val()) || 0;
        const credit = parseFloat($row.find('[data-credit] input').val()) || 0;

        if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
            $row.find('[data-debit], [data-credit]').each(function () {
                showFieldError($(this).find('input'), 'Either Debit or Credit is required, not both.');
            });
            valid = false;
        }
    });
    return valid;
}

// Voucher-level balance validation
function validateTotalBalance() {
    let totalDebit = 0;
    let totalCredit = 0;

    $('#ItemsTable tbody tr').each(function () {
        const debit = parseFloat($(this).find('[data-debit] input').val()) || 0;
        const credit = parseFloat($(this).find('[data-credit] input').val()) || 0;
        totalDebit += debit;
        totalCredit += credit;
    });

    if (totalDebit !== totalCredit) {
        showToast(
            'warning',
            'Record Not Saved! Your Credit Amount Is Not Equal To Debit Amount.'
        );
        return false;
    }
    return true;
}

// Attach row events
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

// Add new row
function addNewRow(makeNonRemovable = false) {
    const $tbody = $('#ItemsTable tbody');
    const currentRowCount = $tbody.find('tr').length;
    const shouldBeNonRemovable = makeNonRemovable && currentRowCount === 0;

    const template = $('#itemRowTemplate').html().replace(/INDEX/g, rowIndex++);
    const $newRow = $(template);
    $tbody.append($newRow);

    attachRowEvents($newRow);

    if (shouldBeNonRemovable) makeRowNonRemovable($newRow);
}

// Make row non-removable
function makeRowNonRemovable($tr) {
    $tr.addClass('nonRemovable')
        .attr('data-non-removable', 'true')
        .find('.btn-icon')
        .prop('disabled', true)
        .css({ opacity: 0.5, cursor: 'not-allowed', 'pointer-events': 'none' });
}

// Remove row
window.removeRow = function (btn) {
    const $row = $(btn).closest('tr');
    const $tbody = $('#ItemsTable tbody');
    const totalRows = $tbody.find('tr').length;

    if ($row.hasClass('nonRemovable')) {
        showToast('warning', 'This row cannot be deleted.');
        return false;
    }

    $row.remove();
    rowIndex = $tbody.find('tr').length;

    if (totalRows === 2 && $tbody.find('tr').length === 1) {
        makeRowNonRemovable($tbody.find('tr:first'));
    }
    updateTotals();
};

// Toast & error helpers
function showToast(icon, text, timer = 3000) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        text: text,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        allowOutsideClick: false
    });
}

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
}

function updateTotals() {
    let totalDebit = 0, totalCredit = 0;
    $('#ItemsTable tbody tr').each(function () {
        totalDebit += parseFloat($(this).find('[data-debit] input').val()) || 0;
        totalCredit += parseFloat($(this).find('[data-credit] input').val()) || 0;
    });
    console.log('Total Debit:', totalDebit, 'Total Credit:', totalCredit);
}

// Initialize
window.initializeGernalJournalDetail = initializeGernalJournalDetail;
$(document).ready(() => {
    if ($('#invoiceForm').length) initializeGernalJournalDetail();
});
