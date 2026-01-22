let rowIndex = 0;

function initializeCashPaymentDetail() {
    const $tbody = $('#ItemsTable tbody');
    const $form = $('#invoiceForm');

    setTimeout(() => {
        // Ensure at least one non-removable row
        if ($tbody.find('tr').length === 0) {
            addNewRow(true);
        }
        rowIndex = $tbody.find('tr').length;
        attachAllEvents();

        // Alt + N shortcut & buttons
        $(document).off('keydown.addrow').on('keydown.addrow', e => {
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                addNewRow();
            }
        });

        $('#addNewRowBtn, #confirmBtn').off('click').on('click', function () {
            this.id === 'confirmBtn' ? $form.submit() : addNewRow();
        });

        // Form submit with validation
        $form.off('submit').on('submit', function (e) {
            e.preventDefault();
            clearFieldErrors();
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
                    showToast('success', 'Cash PaymentCreated Successfully!');
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
    const template = $('#itemRowTemplate').html().replace(/INDEX/g, rowIndex++);
    const $newRow = $(template);
    $('#ItemsTable tbody').append($newRow);

    setTimeout(() => {
        $newRow.find('ebit-number').each(function () {
            if (!this.querySelector('input')) this.connectedCallback();
        });
        attachRowEvents($newRow);
        if (makeNonRemovable) {
            $newRow.addClass('nonRemovable')
                .find('.btn-icon').prop('disabled', true)
                .css({ opacity: 0.5, cursor: 'not-allowed' });
        }
    }, 50);

    $(document).trigger('row-added');
}

window.removeRow = function (btn) {
    const $row = $(btn).closest('tr');
    if ($row.hasClass('nonRemovable')) {
        showToast('warning', 'The first row cannot be deleted.');
        return;
    }
    $row.remove();
};

// Reusable Toast Function (No buttons at all!)
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

// Initialize
window.initializeCashPaymentDetail = initializeCashPaymentDetail;
$(document).ready(() => $('#invoiceForm').length && initializeCashPaymentDetail());