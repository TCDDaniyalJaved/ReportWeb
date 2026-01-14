// OpeningMasterDummy.js
// Import utility functions from ReportdataTableUtilsDummy.js
import {
    initializeDataTable,
    addSearchBadge,
    initStepper,
    setPageFilterConfig,
    groupBySelectionOrder,
    resetToFirstPage,
} from './ReportdataTableUtilsDummy.js';

// SVG icons for Filter and Group badges
const FILTER_ICON = `
<svg viewBox="0 0 24 24" width="14" height="14" class="me-1">
    <path d="M3,4H21V6H3V4M6,10H18V12H6V10M10,16H14V18H10V16Z"></path>
</svg>`;

const GROUP_ICON = `
<svg viewBox="0 0 24 24" width="14" height="14" class="me-1">
    <path d="M3,13H9V19H3V13M3,5H9V11H3V5M11,5H21V11H11V5M11,13H21V19H11V13Z"></path>
</svg>`;

const BASE_PATH = '/Accounting/Report';
let table;

// Page-specific filter configuration
const MY_FILTERS = {
    'Companies': { divId: 'filter-company', title: 'Select Company', backendKey: 'Companyid' },
    'CustomerInvoice': { divId: 'filter-customerinvoice', title: 'Select Customer', backendKey: 'CustomerName' },
    'VendorBill': { divId: 'filter-vendorbill', title: 'Select Vendor', backendKey: 'VendorName' }
};

$(document).ready(() => {
    // Initialize stepper if present
    initStepper();

    // Setup page filters
    setPageFilterConfig(MY_FILTERS);

    // Initialize master table
    table = initializeDataTable(
        `${BASE_PATH}/GetData`,
        '#masterTable',
        {
            callbacks: {
                onDraw: () => $('#totalRecords').text(table?.page.info().recordsDisplay || 0)
            }
        }
    );

    // Open Save Favorite modal
    $('#saveFavorite').on('click', () => {
        $('#favoriteName').val('');
        new bootstrap.Modal($('#saveFavoriteModal')[0]).show();
    });

    // Save Favorite
    $('#saveFavoriteConfirm').on('click', function () {
        const viewName = $('#favoriteName').val().trim();
        if (!viewName) return alert('Please enter a name for the view');

        // Collect current filters
        const filters = {};
        $('.badge-tag[data-type="Filter"]').each(function () {
            const key = $(this).data('key');
            const value = $(this).data('value');
            if (!filters[key]) filters[key] = [];
            filters[key].push(value);
        });

        // Collect current groupBy
        const groupBy = [...groupBySelectionOrder];

        const payload = {
            ViewName: viewName,
            ReportKey: 'OpeningMaster',
            Filters: JSON.stringify(filters),
            GroupBy: JSON.stringify(groupBy)
        };

        // AJAX save
        $.ajax({
            url: '/Accounting/Report/SaveReportView',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: () => {
                bootstrap.Modal.getInstance($('#saveFavoriteModal')[0]).hide();
                alert('Favorite saved successfully!');
                loadFavorites();
            },
            error: () => alert('Failed to save favorite')
        });
    });

    // Load favorites from backend
    // Load favorites from backend
    function loadFavorites() {
        $.get('/Accounting/Report/GetUserReportViews', { reportKey: 'OpeningMaster' }, function (data) {
            const $list = $('#favoritesList');
            $list.empty();

            if (!data || data.length === 0) {
                $list.append('<li>No favorites found</li>');
                return;
            }

            let defaultView = null;

            // Optional: Log raw data for debugging (you can remove later)
            //console.log("Raw favorites from backend:", data);

            data.forEach(v => {
                const filtersStr = v.filters || '{}';
                const groupByStr = v.groupBy || '[]';

                // FIXED: use lowercase 'isDefault' and 'isLocked' to match backend JSON
                const isDefault = !!v.isDefault;
                const isLocked = !!v.isLocked;

                // Track the default view if found
                if (v.isDefault) {
                    defaultView = v;
                   // console.log(`Found default favorite: ${v.viewName} (isDefault: true)`);
                }

                // Create list item
                const $li = $('<li>')
                    .addClass('favorite-item')
                    .attr('data-filters', filtersStr)
                    .attr('data-groupby', groupByStr)
                    .attr('data-isdefault', isDefault ? '1' : '0')
                    .attr('data-islocked', isLocked ? '1' : '0')
                    .html('⭐ ' + (v.viewName || 'Unnamed View'))
                    // Optional: visual highlight for default item
                    .toggleClass('default-favorite text-primary fw-bold', isDefault);

                $list.append($li);
            });

            // Auto-apply the real default favorite (if exists)
            if (defaultView) {
                //console.log('Auto-applying default favorite:', 
                //{
                //    viewName: defaultView.viewName,
                //    isDefault: defaultView.isDefault,
                //    isLocked: defaultView.isLocked
                //});

                applyFavorite({
                    filters: defaultView.filters || '{}',
                    groupBy: defaultView.groupBy || '[]',
                    IsLocked: !!defaultView.isLocked   // consistent with your applyFavorite usage
                });
            } 

        }).fail((jqXHR, textStatus, errorThrown) => {
            //console.error('Failed to load favorites:', textStatus, errorThrown);
            $('#favoritesList').html('<li class="text-danger">Error loading favorites</li>');
        });
    }
    // Apply favorite (filters + group)
    function applyFavorite(view) {
        let filters = {};
        let groups = [];

        try { filters = JSON.parse(view.filters || '{}'); } catch { console.error('Invalid filters JSON'); }
        try { groups = JSON.parse(view.groupBy || '[]'); } catch { console.error('Invalid groupBy JSON'); }

        // Clear existing badges and group selection
        $('.badge-tag').remove();
        groupBySelectionOrder.length = 0;
        $('#groupByList li').removeClass('active');

        // Restore filter badges
        Object.keys(filters).forEach(key => {
            (filters[key] || []).forEach(val => addSearchBadge('Filter', key, val, view.IsLocked));
        });

        // Restore groupBy badges
        groups.forEach(g => {
            if (!groupBySelectionOrder.includes(g)) {
                groupBySelectionOrder.push(g);
                $('#groupByList li[data-group="' + g + '"]').addClass('active');
                addSearchBadge('Group', g, g.charAt(0).toUpperCase() + g.slice(1), view.IsLocked);
            }
        });

        // Reload table
        resetToFirstPage();
    }

    // Favorite click handler
    $(document).on('click', '.favorite-item', function () {
        const $item = $(this);
        const view = {
            filters: $item.attr('data-filters'),
            groupBy: $item.attr('data-groupby'),
            IsLocked: $item.attr('data-islocked') == '1'
        };
        applyFavorite(view);
    });

    // Initial favorites load
    loadFavorites();
});
