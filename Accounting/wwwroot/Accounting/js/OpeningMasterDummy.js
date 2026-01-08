// OpeningMasterDummy.js
// Import   
import {
    initializeDataTable,   
    initStepper,           
    setPageFilterConfig    
} from './ReportdataTableUtilsDummy.js';

const BASE_PATH = '/Accounting/Report';

let table;

// Configuration object 
const MY_FILTERS = {
    'Companies': {
        divId: 'filter-company',         
        title: 'Select Company',          
        backendKey: 'CompanyName'         
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
    }
    // Add more filters here as needed for this specific report
};

$(document).ready(() => {
    initStepper();                       

    setPageFilterConfig(MY_FILTERS);       

    table = initializeDataTable(
        `${BASE_PATH}/GetData`,          
        '#masterTable',                 
        {
            callbacks: {
                onDraw: () => {
                    $('#totalRecords').text(table?.page.info().recordsDisplay || 0);
                }
            }
        }
    );
});