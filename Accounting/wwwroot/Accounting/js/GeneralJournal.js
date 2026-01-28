// Accountopening.js
import {
    initializeDataTable,
    goBackToList,
    handleCreateButton,
    handleDirectUrl,
    handleRowActions,
    initStepper
} from './dataTableUtils.js';

const BASE_PATH = '/Accounting/GeneralJournal';
let table;

$(document).ready(() => {
    initStepper();
    handleDirectUrl(BASE_PATH);
    handleCreateButton(BASE_PATH);

    table = initializeDataTable(`${BASE_PATH}/GetData2`, '#masterTable', {
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

    $(document).on('click', '#gobacktolistbtn', () =>
        goBackToList(table, BASE_PATH)
    );
});