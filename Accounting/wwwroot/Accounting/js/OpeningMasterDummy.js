// OpeningMasterDummy.js
import { initializeDataTable, addSearchBadge, initStepper, setPageFilterConfig, groupBySelectionOrder, resetToFirstPage } from './ReportdataTableUtilsDummy.js';
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
    'Companies': {
        divId: 'filter-company',
        title: 'Select Company',
        backendKey: 'Companyid'
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

    // Save Favorite Modal
    $('#saveFavorite').on('click', function () {
        $('#favoriteName').val('');
        new bootstrap.Modal($('#saveFavoriteModal')[0]).show();
    });

    $('#saveFavoriteConfirm').on('click', function () {
        const viewName = $('#favoriteName').val().trim();
        if (!viewName) {
            alert('Please enter a name for the view');
            return;
        }

        const filters = {};
        $('.badge-tag[data-type="Filter"]').each(function () {
            const key = $(this).data('key');
            const value = $(this).data('value');
            if (!filters[key]) filters[key] = [];
            filters[key].push(value);
        });

        const groupBy = [...groupBySelectionOrder];
        const searchText = $('#universalSearch').val() || '';

        const payload = {
            ViewName: viewName,
            ReportKey: 'OpeningMaster',
            Filters: JSON.stringify(filters),
            GroupBy: JSON.stringify(groupBy),
            SearchText: searchText
        };

        $.ajax({
            url: '/Accounting/Report/SaveReportView',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function () {
                bootstrap.Modal.getInstance($('#saveFavoriteModal')[0]).hide();
                alert('Favorite saved successfully!');
                loadFavorites();
            },
            error: function () {
                alert('Failed to save favorite');
            }
        });
    });

    // Load saved favorites
    function loadFavorites() {
        $.get('/Accounting/Report/GetUserReportViews', { reportKey: 'OpeningMaster' }, function (data) {
            const $list = $('#favoritesList');
            $list.empty();

            if (!data || data.length === 0) {
                $list.append('<li>No favorites found</li>');
                return;
            }

            data.forEach(v => {
                const filtersStr = v.filters || '{}';     // adjust to your actual API key name
                const groupByStr = v.groupBy || '[]';

                const $li = $('<li>')
                    .addClass('favorite-item')
                    .attr('data-filters', filtersStr)
                    .attr('data-groupby', groupByStr)
                    .html('⭐ ' + (v.viewName || 'Unnamed'));

                $list.append($li);
            });
        }).fail(function (jqXHR, textStatus) {
            console.error('Failed to load favorites:', textStatus);
        });
    }

    // Restore favorite when clicked
    $(document).on('click', '.favorite-item', function () {
        const $item = $(this);
        const rawFilters = $item.attr('data-filters') || '{}';
        const rawGroupBy = $item.attr('data-groupby') || '[]';

        let filters = {};
        let groups = [];

        try {
            if (rawFilters.trim() !== '{}') {
                filters = JSON.parse(rawFilters);
            }
        } catch (e) {
            console.error('Failed to parse filters:', rawFilters);
        }

        try {
            if (rawGroupBy.trim() !== '[]') {
                groups = JSON.parse(rawGroupBy);
            }
        } catch (e) {
            console.error('Failed to parse groupBy:', rawGroupBy);
        }

        // Reset current state
        $('.badge-tag').remove();
        groupBySelectionOrder.length = 0;
        $('#groupByList li').removeClass('active');

        // Restore filter badges
        Object.keys(filters).forEach(key => {
            (filters[key] || []).forEach(val => {
                let displayText = val;
                Object.entries(MY_FILTERS).forEach(([type, cfg]) => {
                    if (cfg.backendKey === key) {
                        displayText = val; // can be enhanced later with ID → Name lookup
                    }
                });

                const $badge = $(`
                    <span class="badge-tag d-inline-flex align-items-center"
                          data-type="Filter"
                          data-key="${key}"
                          data-value="${val.replace(/"/g, '&quot;')}">
                        <span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>
                        <span class="badge-text ms-1">${displayText}</span>
                        <span class="remove-btn ms-1" style="cursor:pointer;">×</span>
                    </span>
                `);

                $badge.find('.remove-btn').on('click', function (e) {
                    e.stopPropagation();
                    $badge.remove();
                    activeTables.get('#masterTable')?.ajax.reload();
                });

                $badge.find('.filter-icon').on('click', function (e) {
                    e.stopPropagation();
                    // openFilterModal(key, $badge); // enable when you want edit support
                });

                $('#universalSearch').before($badge);
            });
        });

        // Restore grouping
        groups.forEach(g => {
            if (!groupBySelectionOrder.includes(g)) {
                groupBySelectionOrder.push(g);
                $(`#groupByList li[data-group="${g}"]`).addClass('active');
                addSearchBadge('Group', g, g.charAt(0).toUpperCase() + g.slice(1));
            }
        });

        resetToFirstPage();
    });

    // Initial load
    loadFavorites();
});