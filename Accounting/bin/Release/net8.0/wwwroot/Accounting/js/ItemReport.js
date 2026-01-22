// OpeningMaster.js
import {
    initializeDataTable,
    initStepper
} from './ReportdataTableUtils.js';

const BASE_PATH = '/Report';
let table;

$(document).ready(() => {
    initStepper();
    table = initializeDataTable(`${BASE_PATH}/GetData2`, '#masterTable', {
        callbacks: {
            onDraw: () => {
                $('#totalRecords').text(table?.page.info().recordsDisplay || 0);
            }
        }
    });
       $('#groupBySelect').trigger('change');
});