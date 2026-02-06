// CashPayment.js
import {
    initializeDataTable,
    initCheckboxSelection,
    handleCreateButton,
    handleDirectUrl,
    goBackToList,
    handleRowActions,
    applyFavorite,
    initStepper,
    loadAndDisplayDefaultPageLength,
    initDefaultPageLengthEditor,
    groupBySelectionOrder   // yeh mutable hai – careful use
} from './dataTableUtils2.js';

const BASE_PATH = '/Accounting/CashPayment';
let table;

$(document).ready(async () => {
    initStepper();
    //  Default page length load + display
    await loadAndDisplayDefaultPageLength(`${BASE_PATH}/GetDefaultLoad`);

    //  Editor setup (jo value change hone par save karta hai)
    initDefaultPageLengthEditor({
        reportKey: 'CashPayment',
        viewName: 'CashPaymentView',
        isDefault: true,
        groupBySelectionOrder,
        saveEndpoint: '/Accounting/Report/SaveReportView',
        minValue: 5,
        maxValue: 500,
    });

    //  URL handling + create button
    handleDirectUrl(BASE_PATH);
    handleCreateButton(BASE_PATH);

    //  Main DataTable
    table = await initializeDataTable(`${BASE_PATH}/GetData`, '#masterTable', {
        pageLengthEndpoint: `${BASE_PATH}/GetDefaultLoad`,
        callbacks: {
            onDraw: () => {
                handleRowActions(BASE_PATH, {
                    onDelete: () => table.ajax.reload(null, false)
                });
                $('#totalRecords').text(table?.page.info().recordsDisplay || 0);
                $('#select-all').prop('checked', false);
            }
        }
    });

    //  Checkbox + bulk actions
    initCheckboxSelection(table, '#masterTable', [], `${BASE_PATH}/BulkDelete`);

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
            ReportKey: 'CashPayment',
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
        $.get('/Accounting/Report/GetUserReportViews', { reportKey: 'CashPayment' }, function (data) {
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


    // Click handler for favorite items
    $(document).on('click', '.favorite-item', function () {
        const $item = $(this);
        applyFavorite({
            filters: $item.attr('data-filters'),
            groupBy: $item.attr('data-groupby'),
            IsLocked: $item.attr('data-islocked') === '1'
        });
    });
    loadFavorites();


});


$(document).on('click', '#gobacktolistbtn', () =>
    goBackToList(table, BASE_PATH)
);