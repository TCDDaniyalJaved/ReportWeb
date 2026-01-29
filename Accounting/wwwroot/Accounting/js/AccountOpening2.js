import {
    initializeDataTable,
    goBackToList,
    handleCreateButton,
    handleDirectUrl,
    handleRowActions,
    initStepper,
    initCheckboxSelection,
    groupBySelectionOrder
} from './dataTableUtils2.js';

const BASE_PATH = '/Accounting/Accountopening';
let table;

$(document).ready(() => {
    initStepper();
    handleDirectUrl(BASE_PATH);
    handleCreateButton(BASE_PATH);

    table = initializeDataTable(`${BASE_PATH}/GetData3`, '#masterTable', {
        callbacks: {
            onDraw: () => {
                handleRowActions(BASE_PATH, {
                    onDelete: () => {
                        table.ajax.reload(null, false);
                    }
                });
                $('#totalRecords').text(table?.page.info().recordsDisplay || 0);

                // Optional: reset select-all on every draw (safety)
                $('#select-all').prop('checked', false);
            }
        }
    });

    // Initialize checkbox selection WITH bulk delete endpoint
    initCheckboxSelection(table, '#masterTable', [], `${BASE_PATH}/BulkDelete`);
});