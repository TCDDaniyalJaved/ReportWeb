    $(document).ready(function () {
        $('#trialBalanceTable').DataTable({
            ajax: {
                url: '/Accounting/TrialBalance/GetTrialBalanceReport', // API endpoint
                dataSrc: 'data' // JSON property containing array
            },
            columns: [
                { data: 'Date', render: function (data) { return new Date(data).toLocaleDateString(); } },
                { data: 'AccountName' },
                { data: 'Debit', render: $.fn.dataTable.render.number(',', '.', 2, '') },
                { data: 'Credit', render: $.fn.dataTable.render.number(',', '.', 2, '') }
            ],
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50]
        });
     });
