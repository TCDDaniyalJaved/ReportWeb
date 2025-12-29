// OpeningMaster.js
import {
    initializeDataTable,
    handleRowActions,
    initStepper
} from './ReportdataTableUtilsDemo.js';

const BASE_PATH = '/Report';
let table;

$(document).ready(() => {
    initStepper();
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
       $('#groupBySelect').trigger('change');
});