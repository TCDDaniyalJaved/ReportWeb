// Ledger.js
import {
    showToast,
    initializeDataTable,
    addSearchBadge,
    loadReportFields,
    initStepper,
    loadAndDisplayDefaultPageLength,
    setPageFilterConfig,
    groupBySelectionOrder,
    resetToFirstPage,
    applyFavorite,         // import from utils
    /*downloadReportPdf,*/     // import pdf function
    loadReportFavorites,   // import favorites loader
    saveReportFavorite ,    // import save favorite helper
    downloadReportPdfMultiple
} from './ReportdataTableUtils.js';

const BASE_PATH = '/Accounting/Report';

let table; // reference to main DataTable

// Page-specific filter mapping
const MY_FILTERS = {
    'AccountName': { divId: 'filter-LedgerName', title: 'Select Account', backendKey: 'Account' },
    'GroupName': { divId: 'filter-groupName', title: 'Select Group', backendKey: 'GroupName' },
    'DateRange': { divId: 'filter-date', title: 'Select Date', backendKey: 'Date' }
};

$(document).ready(async () => {
    initStepper();

    // Load report fields dynamically and set page filters
    await loadReportFields('Ledger', {
        onSuccess: (fields) => {
            const pageFilterConfigDynamic = {};
            fields.forEach(f => {
                if (!f.IsFilterAllowed) return;
                pageFilterConfigDynamic[f.FieldName] = {
                    title: f.DisplayName,
                    type: f.FieldType,
                    dataUrl: f.DataSourceUrl || null,
                    placeholder: `Select ${f.DisplayName}...`
                };
            });
            setPageFilterConfig(pageFilterConfigDynamic);
        },
        onError: (err) => console.error("Error loading fields:", err)
    });

    // Apply static page-specific filters as fallback
    setPageFilterConfig(MY_FILTERS);

    // Initialize main DataTable
    table = await initializeDataTable(`${BASE_PATH}/Ledger`, '#masterTable', {
        pageLengthEndpoint: `${BASE_PATH}/GetDefaultLoad`,
        callbacks: { onDraw: () => $('#totalRecords').text(table?.page.info().recordsDisplay || 0) }
    });

    // ── Favorites ──
    loadReportFavorites('Ledger', { listSelector: '#favoritesList', onApply: applyFavorite });

    // Open save favorite modal
    $('#saveFavorite').on('click', () => {
        $('#favoriteName').val('');
        document.getElementById("advancedDropdown")?.classList.add("d-none");
        new bootstrap.Modal($('#saveFavoriteModal')[0]).show();
    });

    // Save favorite
    $('#saveFavoriteConfirm').on('click', () => saveReportFavorite('Ledger', table));

    // Download PDF
    $('#downloadPdfBtn').on('click', () => {
        downloadReportPdfMultiple('/Accounting/Report/LedgerPdfMultiple');
    });
    //$('#downloadPdfBtn').on('click', () => downloadReportPdf('LedgerReport.pdf', groupBySelectionOrder));
});