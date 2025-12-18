// Accountopening.js
import {
    initializeDataTable,
    goBackToList,
    handleCreateButton,
    handleDirectUrl,
    handleRowActions,
    initStepper
} from './dataTableUtils.js';

const BASE_PATH = '/Accounting/Accountopening';
const BASE_PATH_POSTED = '/Accounting/Accountopening';

let table;

$(document).ready(() => {
    initStepper();
    handleDirectUrl(BASE_PATH);
    handleCreateButton(BASE_PATH);

    table = initializeDataTable(`${BASE_PATH}/GetData`, '#masterTable', {
        callbacks: {
            onDraw: () => {
                handleRowActions(BASE_PATH, {
                    onDelete: () => {
                        table.ajax.reload(null, false); //  refresh data without page reload
                    }
                });

                $('#totalRecords').text(table?.page.info().recordsDisplay || 0);
            }
        }
    });



    table = initializeDataTable(`${BASE_PATH_POSTED}/GetData2`, '#masterTableDraft', {
        callbacks: {
            onDraw: () => {
                handleRowActions(BASE_PATH_POSTED, {
                    onDelete: () => {
                        table.ajax.reload(null, false); //  refresh data without page reload
                    }
                });

                $('#totalRecordsDraft').text(table?.page.info().recordsDisplay || 0);
            }
        }
    });


    $('#masterTable').on('xhr.dt', function (e, settings, json) {
        if (!json?.totals) return;

        $('#totalDebit').text(
            parseFloat(json.totals.totalDebit || 0).toFixed(2)
        );

        $('#totalCredit').text(
            parseFloat(json.totals.totalCredit || 0).toFixed(2)
        );
    });


    $('#masterTableDraft').on('xhr.dt', function (e, settings, json) {
        if (!json?.totals) return;

        $('#totalDebit').text(
            parseFloat(json.totals.totalDebit || 0).toFixed(2)
        );

        $('#totalCredit').text(
            parseFloat(json.totals.totalCredit || 0).toFixed(2)
        );
    });

    $(document).on('click', '#gobacktolistbtn', () =>
        goBackToList(table, BASE_PATH)
    );
});