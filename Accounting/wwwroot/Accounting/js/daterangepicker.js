$(function () {
    $('#dateRangePicker').dateRangepicker({
        opens: 'left', // left/right/top/bottom
        autoUpdateInput: false,
        locale: {
            format: 'YYYY-MM-DD',
            cancelLabel: 'Clear'
        }
    });

    // Agar user select kare to input update ho
    $('#dateRangePicker').on('apply.dateRangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
    });

    // Agar user clear kare to input empty ho
    $('#dateRangePicker').on('cancel.dateRangepicker', function (ev, picker) {
        $(this).val('');
    });
});
