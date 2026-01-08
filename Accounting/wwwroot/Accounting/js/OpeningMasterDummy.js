// OpeningMasterDummy.js
import {
    initializeDataTable,
    initStepper,
    setPageFilterConfig
} from './ReportdataTableUtilsDummy.js';

const BASE_PATH = '/Accounting/Report';
let table;
const MY_FILTERS = {
    'Companies': {
        divId: 'filter-company',
        title: 'Select Company',
        backendKey: 'CompanyName'  // Yeh backend property se match karega
    },
    'CustomerInvoice': {
        divId: 'filter-customerinvoice',
        title: 'Select Customer',
        backendKey: 'CustomerName'
    },
    'VendorBill': {
        divId: 'filter-vendorbill',
        title: 'Select Vendor',
        backendKey: 'VendorName'
    },
    // Agar aur filters add karne hain to yahan add karo
};

$(document).ready(() => {
    initStepper();
    setPageFilterConfig(MY_FILTERS);
    table = initializeDataTable(`${BASE_PATH}/GetData`, '#masterTable', {
        callbacks: {
            onDraw: () => {
                $('#totalRecords').text(table?.page.info().recordsDisplay || 0);
            }
        }
    });
});