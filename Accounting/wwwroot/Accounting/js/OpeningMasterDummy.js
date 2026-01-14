// OpeningMasterDummy.js

// Imports & Constants
import {
    initializeDataTable,
    addSearchBadge,
    initStepper,
    setPageFilterConfig,
    groupBySelectionOrder,
    resetToFirstPage,
} from './ReportdataTableUtilsDummy.js';

// SVG icons used in filter/group badges
const FILTER_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,4H21V6H3V4M6,10H18V12H6V10M10,16H14V18H10V16Z"></path></svg>`;
const GROUP_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,13H9V19H3V13M3,5H9V11H3V5M11,5H21V11H11V5M11,13H21V19H11V13Z"></path></svg>`;

const BASE_PATH = '/Accounting/Report';

let table;  // reference to the DataTable instance

// Page-specific filter mapping (UI → backend)
const MY_FILTERS = {
    'Companies': { divId: 'filter-company', title: 'Select Company', backendKey: 'Companyid' },
    'CustomerInvoice': { divId: 'filter-customerinvoice', title: 'Select Customer', backendKey: 'CustomerName' },
    'VendorBill': { divId: 'filter-vendorbill', title: 'Select Vendor', backendKey: 'VendorName' }
};

// Document Ready - Main Initialization
$(document).ready(() => {
    initStepper();                      // setup wizard stepper if present
    setPageFilterConfig(MY_FILTERS);    // register page-specific filter handlers
    // Initialize main master table with server-side data
    table = initializeDataTable(
        `${BASE_PATH}/GetData`,
        '#masterTable',
        {
            callbacks: {
                onDraw: () => $('#totalRecords').text(table?.page.info().recordsDisplay || 0)
            }
        }
    );

    // ── Save Favorite Modal triggers ──
    $('#saveFavorite').on('click', () => {
        $('#favoriteName').val('');
        new bootstrap.Modal($('#saveFavoriteModal')[0]).show();
    });

    // Save current view (filters + grouping) as favorite
    $('#saveFavoriteConfirm').on('click', function () {
        const viewName = $('#favoriteName').val().trim();
        if (!viewName) return showToast('warning', 'Please enter a name for the view');

        // Collect active filter badges
        const filters = {};
        $('.badge-tag[data-type="Filter"]').each(function () {
            const key = $(this).data('key');
            const value = $(this).data('value');
            if (!filters[key]) filters[key] = [];
            filters[key].push(value);
        });

        const groupBy = [...groupBySelectionOrder];  // current group order

        const payload = {
            ViewName: viewName,
            ReportKey: 'OpeningMaster',
            Filters: JSON.stringify(filters),
            GroupBy: JSON.stringify(groupBy)
        };

        $.ajax({
            url: '/Accounting/Report/SaveReportView',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: () => {
                bootstrap.Modal.getInstance($('#saveFavoriteModal')[0]).hide();
                showToast('success', 'Favorite saved successfully!');
                loadFavorites();  // refresh list
            },
            error: () => showToast('warning', 'Failed to save favorite')
        });
    });

    // Favorites Management
    function loadFavorites() {
        $.get('/Accounting/Report/GetUserReportViews', { reportKey: 'OpeningMaster' }, function (data) {
            const $list = $('#favoritesList');
            $list.empty();

            if (!data || data.length === 0) {
                $list.append('<li>No favorites found</li>');
                return;
            }

            let defaultView = null;

            data.forEach(v => {
                const filtersStr = v.filters || '{}';
                const groupByStr = v.groupBy || '[]';
                const isDefault = !!v.isDefault;
                const isLocked = !!v.isLocked;

                if (isDefault) {
                    defaultView = v;
                }

                const $li = $('<li>')
                    .addClass('favorite-item')
                    .attr({
                        'data-filters': filtersStr,
                        'data-groupby': groupByStr,
                        'data-isdefault': isDefault ? '1' : '0',
                        'data-islocked': isLocked ? '1' : '0'
                    })
                    .html('⭐ ' + (v.viewName || 'Unnamed View'))
                    .toggleClass('default-favorite text-primary fw-bold', isDefault);

                $list.append($li);
            });

            // Auto-apply default view on first load (if exists)
            if (defaultView) {
                applyFavorite({
                    filters: defaultView.filters || '{}',
                    groupBy: defaultView.groupBy || '[]',
                    IsLocked: !!defaultView.isLocked
                });
            }
        }).fail(() => {
            $('#favoritesList').html('<li class="text-danger">Error loading favorites</li>');
        });
    }

    // Apply saved view (clear current → restore filters & groups)
    function applyFavorite(view) {
        let filters = {};
        let groups = [];

        try { filters = JSON.parse(view.filters || '{}'); } catch { }
        try { groups = JSON.parse(view.groupBy || '[]'); } catch { }

        // Reset UI state
        $('.badge-tag').remove();
        groupBySelectionOrder.length = 0;
        $('#groupByList li').removeClass('active');

        const isLocked = !!view.IsLocked;

        // Restore filter badges
        Object.keys(filters).forEach(key => {
            (filters[key] || []).forEach(val => {
                addSearchBadge('Filter', key, val, isLocked);
            });
        });

        // Restore group badges & internal order
        groups.forEach(g => {
            if (!groupBySelectionOrder.includes(g)) {
                groupBySelectionOrder.push(g);
                $('#groupByList li[data-group="' + g + '"]').addClass('active');
                addSearchBadge('Group', g, g.charAt(0).toUpperCase() + g.slice(1), isLocked);
            }
        });

        resetToFirstPage();  // trigger table reload with new state
    }

    // Click handler for favorite items
    $(document).on('click', '.favorite-item', function () {
        const $item = $(this);
        applyFavorite({
            filters: $item.attr('data-filters'),
            groupBy: $item.attr('data-groupby'),
            IsLocked: $item.attr('data-islocked') === '1'
        });
    });

    // Initial Load
    loadFavorites();
});

function showToast(icon, text, timer = 3000) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        text: text,
        showConfirmButton: false,
        showCloseButton: false,
        showCancelButton: false,
        timer: timer,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false
    });
}