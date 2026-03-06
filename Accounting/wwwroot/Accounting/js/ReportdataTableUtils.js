// ReportdataTableUtilsDummy.js

let activeTables = new Map();
export let groupBySelectionOrder = [];
let pageFilterConfig = {};
let currentOffset = 0;
const PAGE_SIZE = 10;
let allLoadedData = [];
let isAppendMode = false;

const FILTER_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,4H21V6H3V4M6,10H18V12H6V10M10,16H14V18H10V16Z"></path></svg>`;
const GROUP_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,13H9V19H3V13M3,5H9V11H3V5M11,5H21V11H11V5M11,13H21V19H11V13Z"></path></svg>`;
const DATE_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1">
  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm-7-9h5v5h-5z"></path>
</svg>`;
export function setPageFilterConfig(config) {
    pageFilterConfig = { ...config };
}
window.addEventListener('resize', function () {
    if ($.fn.DataTable.isDataTable('#masterTable')) {
        $('#masterTable').DataTable().columns.adjust().draw(false);
    }
});
export function generateColumnsFromHeaders(tableSelector = '#masterTable') {
    const columns = [];
    $(`${tableSelector} thead th`).each(function () {
        const $th = $(this);
        const datafield = $th.attr('datafield');
        const header = $th.attr('header') || $th.text().trim();
        const width = $th.attr('width');
        const align = $th.attr('align');
        const isActive = $th.attr('active') !== 'false';
        const isGroupTotal = $th.attr('group-total') === 'true';

        const colDef = {
            title: header,
            visible: isActive,
            width: width || undefined,
            groupTotal: isGroupTotal,
        };

        if (align) {
            const alignMap = { right: 'end', center: 'center', left: 'start' };
            colDef.className = `text-${alignMap[align.toLowerCase()] || 'start'}`;
        }

        if (datafield) colDef.data = datafield;
        else colDef.orderable = false;

        const amountKeywords = ['debit', 'credit', 'amount', 'balance'];
        if (datafield && amountKeywords.some(k => datafield.toLowerCase().includes(k))) {
            colDef.render = $.fn.dataTable.render.number(',', '.', 2);
            colDef.className = (colDef.className || '') + ' text-end';
        }

        if (datafield && /date/i.test(datafield)) {
            colDef.render = (data) => data ? new Date(data).toLocaleDateString('en-IN') : '';
        }

        columns.push(colDef);
    });
    return columns;
}
export function applyFavorite(view) {

    let filters = {};
    let groups = [];
    try {
        filters = JSON.parse(view.filters || '{}');
    } catch (e) {
        console.error("Error parsing filters JSON:", e);
    }

    try {
        groups = JSON.parse(view.groupBy || '[]');
    } catch (e) {
        console.error("Error parsing groupBy JSON:", e);
    }

    // Reset UI state
    $('.badge-tag').remove();
    groupBySelectionOrder.length = 0;
    $('#groupByList li').removeClass('active');
    const isLocked = !!view.IsLocked;

    // Restore filter badges
    Object.keys(filters).forEach(filterType => {
        (filters[filterType] || []).forEach(savedValue => {
            const config = pageFilterConfig[filterType] || {};
            const backendKey = config.backendKey || filterType;
            let displayText = savedValue;
            let icon = FILTER_ICON;
            const extraAttrs = {};

            // Special handling for DateRange
            if (filterType === 'DateRange' || filterType === 'dateRange') {
                icon = FILTER_ICON;
                const dates = savedValue.split(' to ');
                if (dates.length === 2) {
                    const start = dates[0].trim();
                    const end = dates[1].trim();
                    const formatForDisplay = (dStr) => {
                        const d = new Date(dStr);
                        return isNaN(d) ? dStr : `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                    };
                    displayText = `Date: ${formatForDisplay(start)} to ${formatForDisplay(end)}`;
                    extraAttrs['data-start-date'] = start;
                    extraAttrs['data-end-date'] = end;
                }
            }

            const $badge = $(`
                <span class="badge-tag d-inline-flex align-items-center ${isLocked ? 'opacity-75 cursor-not-allowed' : ''}"
                      data-type="Filter"
                      data-value="${savedValue}"
                      data-filter="${filterType}"
                      data-key="${backendKey}">
                    <span class="filter-icon" style="cursor:pointer;">${icon}</span>
                    <span class="badge-text ms-1">${displayText}</span>
                    ${isLocked ? '' : '<span class="remove-btn ms-1" style="cursor:pointer;">×</span>'}
                </span>
            `);

            // Add extra attributes (like start/end dates)
            Object.keys(extraAttrs).forEach(attr => $badge.attr(attr, extraAttrs[attr]));

            // Attach Events
            if (!isLocked) {
                // Remove Event
                $badge.find('.remove-btn').on('click', function (e) {
                    e.stopPropagation();
                    $badge.remove();
                    resetToFirstPage();
                });

                // Edit/Filter Icon Event
                $badge.find('.filter-icon').on('click', function (e) {
                    e.stopPropagation();
                    openFilterModal(filterType, $badge);
                });
            }

            $('#universalSearch').before($badge);
        });
    });

    // Restore groups
    groups.forEach(g => {
        if (!groupBySelectionOrder.includes(g)) {
            groupBySelectionOrder.push(g);
            $('#groupByList li[data-group="' + g + '"]').addClass('active');
            addSearchBadge('Group', g, g.charAt(0).toUpperCase() + g.slice(1), isLocked);
        }
    });

    resetToFirstPage();

}

export function showToast(icon, text, timer = 3000) {
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
// Grouping Helpers
function getGroupByFieldsInOrder() {
    return groupBySelectionOrder;
}

// Calculate totals for group-total columns within current group
function calculateGroupTotals(rowDataArray, startIndex, groupByFields, level, currentGroupValues, columns) {
    const totals = {};
    columns.forEach(col => { if (col.groupTotal) totals[col.data] = 0; });

    for (let i = startIndex; i < rowDataArray.length; i++) {
        const row = rowDataArray[i];
        let stillInGroup = true;
        for (let l = 0; l <= level; l++) {
            const field = groupByFields[l];
            if (currentGroupValues[l] !== (row[field] ?? '(Blank)')) {
                stillInGroup = false;
                break;
            }
        }
        if (!stillInGroup) break;

        columns.forEach(col => {
            if (col.groupTotal) totals[col.data] += Number(row[col.data] || 0);
        });
    }
    return totals;
}

// Count how many records belong to the current group
function countRecordsInGroup(rowDataArray, startIndex, groupByFields, level, currentGroupValues) {
    let count = 0;
    for (let i = startIndex; i < rowDataArray.length; i++) {
        const row = rowDataArray[i];
        let stillInGroup = true;
        for (let l = 0; l <= level; l++) {
            if (currentGroupValues[l] !== (row[groupByFields[l]] ?? '(Blank)')) {
                stillInGroup = false;
                break;
            }
        }
        if (!stillInGroup) break;
        count++;
    }
    return count;
}

// Create DOM row for group header (with toggle + totals)
function createGroupHeaderRow(field, value, count, level, columns, totals) {
    const displayValue = value || '(Blank)';
    let tds = `<td colspan="1" style="padding-left:${level * 20}px;" class="text-nowrap">
        <span class="toggle-icon d-inline-block" style="width:20px;"><i class="bx bx-chevron-down"></i></span>
        ${displayValue} <small class="text-muted">(${count})</small>
    </td>`;

    columns.forEach((col, i) => {
        if (i === 0) return;
        if (col.groupTotal) {
            tds += `<td class="text-end fw-semibold">
                ${totals[col.data]?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || ''}
            </td>`;
        } else {
            tds += '<td></td>';
        }
    });

    return $(`<tr class="group-row level-${level}">${tds}</tr>`);
}

function setupGroupRowToggle() {
    // Collapse all group rows by default when page loads
    $('#masterTable tbody tr.group-row').each(function () {
        const $row = $(this);
        $row.addClass('collapsed');
        $row.find('.toggle-icon i')
            .removeClass('bx-chevron-down')
            .addClass('bx-chevron-right');

        // Hide all child rows
        let $next = $row.next();
        while ($next.length) {
            const nextLevel = parseInt($next[0].className.match(/level-(\d+)/)?.[1] || 999);
            const level = parseInt($row[0].className.match(/level-(\d+)/)?.[1] || 0);
            if (nextLevel <= level) break;

            if ($next.hasClass('group-row')) {
                $next.hide().addClass('collapsed');
                $next.find('.toggle-icon i').removeClass('bx-chevron-down').addClass('bx-chevron-right');
            } else {
                $next.hide();
            }
            $next = $next.next();
        }
    });

    // Event handler for toggling group rows
    $('#masterTable tbody')
        .off('click', 'tr.group-row')
        .on('click', 'tr.group-row', function () {
            const $row = $(this);
            const level = parseInt($row[0].className.match(/level-(\d+)/)?.[1] || 0);
            const willCollapse = !$row.hasClass('collapsed');

            $row.toggleClass('collapsed', willCollapse);
            $row.find('.toggle-icon i')
                .toggleClass('bx-chevron-down', !willCollapse)
                .toggleClass('bx-chevron-right', willCollapse);

            let $next = $row.next();
            while ($next.length) {
                const nextLevel = parseInt($next[0].className.match(/level-(\d+)/)?.[1] || 999);
                if (nextLevel <= level) break;

                if ($next.hasClass('group-row')) {
                    if (willCollapse) {
                        $next.hide().addClass('collapsed');
                        $next.find('.toggle-icon i').removeClass('bx-chevron-down').addClass('bx-chevron-right');
                    } else {
                        $next.show().removeClass('collapsed');
                        $next.find('.toggle-icon i').removeClass('bx-chevron-right').addClass('bx-chevron-down');
                    }
                } else {
                    $next.toggle(!willCollapse);
                }
                $next = $next.next();
            }
        });
}

// Toggle expand/collapse for group rows and nested content
//function setupGroupRowToggle() {
//    $('#masterTable tbody')
//        .off('click', 'tr.group-row')
//        .on('click', 'tr.group-row', function () {
//            const $row = $(this);
//            const level = parseInt($row[0].className.match(/level-(\d+)/)?.[1] || 0);
//            const willCollapse = !$row.hasClass('collapsed');

//            $row.toggleClass('collapsed', willCollapse);
//            $row.find('.toggle-icon i')
//                .toggleClass('bx-chevron-down', !willCollapse)
//                .toggleClass('bx-chevron-right', willCollapse);

//            let $next = $row.next();
//            while ($next.length) {
//                const nextLevel = parseInt($next[0].className.match(/level-(\d+)/)?.[1] || 999);
//                if (nextLevel <= level) break;

//                if ($next.hasClass('group-row')) {
//                    if (willCollapse) {
//                        $next.hide().addClass('collapsed');
//                        $next.find('.toggle-icon i').removeClass('bx-chevron-down').addClass('bx-chevron-right');
//                    } else {
//                        $next.show().removeClass('collapsed');
//                        $next.find('.toggle-icon i').removeClass('bx-chevron-right').addClass('bx-chevron-down');
//                    }
//                } else {
//                    $next.toggle(!willCollapse);
//                }
//                $next = $next.next();
//            }
//        });
//}

// Badges & Filter Modal
// Add visual badge for active filter or group-by
export function addSearchBadge(type, value, displayText, isLocked = false) {
    if ($(`.badge-tag[data-type="${type}"][data-value="${value}"]`).length) return;

    const icon = type === 'Group' ? GROUP_ICON : `<span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>`;
    const removeBtn = isLocked ? '' : '<span class="remove-btn ms-1" style="cursor:pointer;">×</span>';
    const lockedClass = isLocked ? 'opacity-75 cursor-not-allowed' : '';

    let categoryValue = value;
    let extraAttrs = '';
    if (type === 'Filter') {
        const config = pageFilterConfig[value] || {};
        const backendKey = config.backendKey || value;
        extraAttrs = `data-filter="${value}" data-key="${backendKey}"`;
        categoryValue = ''; // Initial value is "All"
    }

    const $badge = $(`
        <span class="badge-tag d-inline-flex align-items-center ${lockedClass}"
              data-type="${type}" data-value="${categoryValue}" data-locked="${isLocked ? '1' : '0'}" ${extraAttrs}>
            ${icon}
            <span class="badge-text ms-1">${displayText}</span>
            ${removeBtn}
        </span>
    `);

    if (!isLocked) {
        $badge.find('.remove-btn').on('click', function (e) {
            e.stopPropagation();
            const $b = $(this).closest('.badge-tag');
            const t = $b.data('type'), v = $b.data('value');

            if (t === 'Group') {
                groupBySelectionOrder = groupBySelectionOrder.filter(f => f !== v);
                $(`#groupByList li[data-group="${v}"]`).removeClass('active');
            }
            if (t === 'Filter') {
                const badgeText = $b.find('.badge-text').text().trim();
                $('[data-filter]').each(function () {
                    if ($(this).text().trim() === badgeText) {
                        $(this).removeClass('active');
                    }
                });
            }




            $b.remove();
            currentOffset = 0;
            isAppendMode = false;
            activeTables.get('#masterTable')?.ajax.reload();
        });


        if (type === 'Filter') {
            $badge.find('.filter-icon').on('click', function (e) {
                e.stopPropagation();
                openFilterModal(value, $badge);
            });
        }
    }

    $('#universalSearch').before($badge);
}

// Open filter selection modal and handle apply
function openFilterModal(filterType, $badge = null) {
    const config = pageFilterConfig[filterType];
    if (!config) return alert('Filter not configured: ' + filterType);

    const $modal = $('#filterModal');
    $('#filterModalTitle').text(config.title || 'Select Option');

    $modal.find('.filter-option').hide();
    const $div = $(`#${config.divId}`).show();

    // DateRange Filter Handling
    if (filterType === 'DateRange') {
        const $dateInput = $div.find('#bs-rangepicker-dropdown');

        // If editing existing badge, populate the date range
        if ($badge) {
            const startDate = $badge.attr('data-start-date');
            const endDate = $badge.attr('data-end-date');
            if (startDate && endDate) {
                $dateInput.val(`${startDate} to ${endDate}`);
            }
        } else {
            $dateInput.val('');
        }

        // Apply button click handler for DateRange
        $modal.find('#applyFilterBtn').off('click').on('click', function () {
            const dateRange = $dateInput.val();

            // If no date selected, remove badge if exists
            if (!dateRange || dateRange === '') {
                $badge?.remove();
                bootstrap.Modal.getInstance($modal[0]).hide();
                currentOffset = 0;
                isAppendMode = false;
                activeTables.get('#masterTable')?.ajax.reload();
                return;
            }

            // Parse date range (format: "YYYY-MM-DD to YYYY-MM-DD")
            const dates = dateRange.split(' to ');
            if (dates.length !== 2) {
                alert('Please select a valid date range');
                return;
            }

            const startDate = dates[0].trim();
            const endDate = dates[1].trim();

            // Format dates for display (DD-MM-YYYY)
            const formatForDisplay = (dateStr) => {
                const d = new Date(dateStr);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
            };

            const displayText = `Date: ${formatForDisplay(startDate)} to ${formatForDisplay(endDate)}`;

            if (!$badge) {
                // ─────────── Create NEW badge ───────────
                const $newBadge = $(`
                <span class="badge-tag d-inline-flex align-items-center" 
                      data-type="Filter" 
                      data-value="${dateRange}"
                      data-start-date="${startDate}"
                      data-end-date="${endDate}"
                      data-filter="${filterType}"
                      data-key="${config.backendKey || filterType}">
                    <span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>
                    <span class="badge-text ms-1">${displayText}</span>
                    <span class="remove-btn ms-1" style="cursor:pointer;">×</span>
                </span>
            `);

                // Remove button click
                $newBadge.find('.remove-btn').on('click', function (e) {
                    e.stopPropagation();
                    $newBadge.remove();
                    currentOffset = 0;
                    isAppendMode = false;
                    activeTables.get('#masterTable')?.ajax.reload();
                });

                // Filter icon click (edit)
                $newBadge.find('.filter-icon').on('click', function (e) {
                    e.stopPropagation();
                    openFilterModal('DateRange', $newBadge);
                });

                // Insert badge before search input
                $('#universalSearch').before($newBadge);

            } else {
                // ─────────── Update EXISTING badge ───────────
                $badge.attr('data-value', dateRange);
                $badge.attr('data-start-date', startDate);
                $badge.attr('data-end-date', endDate);
                $badge.attr('data-filter', 'DateRange'); // ✅ Fix here
                $badge.find('.badge-text').text(displayText);

                // Force reflow so inspect shows updated attribute
                $badge[0].offsetHeight;
            }

            // Close modal and reload table
            bootstrap.Modal.getInstance($modal[0]).hide();
            currentOffset = 0;
            isAppendMode = false;
            activeTables.get('#masterTable')?.ajax.reload();
        });
    }
    // Regular Filters (Select Dropdown) Handling
    else {
        const $select = $div.find('select').first();

        // Pre-fill select if editing existing badge
        if ($badge?.attr('data-id')) {
            $select.val($badge.attr('data-id'));

        } else {
            $select.val($select.find('option:first').val());

        }

        // Apply button click handler for regular filters
        $modal.find('#applyFilterBtn').off('click').on('click', function () {
            const id = $select.val();
            const text = $select.find('option:selected').text();
            //                .trim();

            // Badge text logic: FilterName only OR FilterName::Value
            const displayText = id && id !== '0'
                ? `${config.title || filterType}::${text}`
                : `${config.title || filterType}`;

            const finalValue = id && id !== '0' ? text : '';

            if (!$badge) {
                // Create NEW regular filter badge
                const $newBadge = $(`
                    <span class="badge-tag d-inline-flex align-items-center" 
                          data-type="Filter" 
                          data-value="${finalValue}" 
                          data-id="${id || '0'}" 
                          data-filter="${filterType}">
                        <span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>
                        <span class="badge-text ms-1">${displayText}</span>
                        <span class="remove-btn ms-1" style="cursor:pointer;">×</span>
                    </span>
                `);

                // Set backend key attribute
                $newBadge.attr('data-key', config.backendKey);



                // Remove button click handler
                $newBadge.find('.remove-btn').on('click', () => {

                    $newBadge.remove();
                    currentOffset = 0;
                    isAppendMode = false;
                    activeTables.get('#masterTable')?.ajax.reload();
                });

                // Filter icon click handler (to edit)
                $newBadge.find('.filter-icon').on('click', () => {

                    openFilterModal(filterType, $newBadge);
                });

                // Insert badge before search input
                $('#universalSearch').before($newBadge);

            } else {
                // Update EXISTING regular filter badge
                $badge.attr('data-value', finalValue);
                $badge.attr('data-id', id || '0');
                $badge.find('.badge-text').text(displayText);
                $badge.attr('data-key', config.backendKey);
            }

            // Close modal and reload table
            bootstrap.Modal.getInstance($modal[0]).hide();
            currentOffset = 0;
            isAppendMode = false;
            activeTables.get('#masterTable')?.ajax.reload();
        });
    }

    // Close advanced dropdown when filter modal opens
    document.getElementById("advancedDropdown")?.classList.add("d-none");

    // Show modal
    new bootstrap.Modal($modal[0]).show();

}

// Helper to create badge (aapke existing addSearchBadge se inspired)
function createFilterBadge(key, value, displayText, extraAttrs = {}) {
    const $badge = $(`
        <span class="badge-tag d-inline-flex align-items-center" data-type="Filter"
              data-key="${key}" data-filter="${key}" data-value="${value}">
            <span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>
            <span class="badge-text ms-1">${displayText}</span>
            <span class="remove-btn ms-1" style="cursor:pointer;">×</span>
        </span>
    `);

    Object.entries(extraAttrs).forEach(([k, v]) => $badge.attr(k, v));

    // Remove & edit events attach karo (aapke existing code se copy-paste)
    $badge.find('.remove-btn').on('click', function (e) {
        e.stopPropagation();
        $(this).closest('.badge-tag').remove();
        resetToFirstPage();
    });

    $badge.find('.filter-icon').on('click', function (e) {
        e.stopPropagation();
        openFilterModal(key, $badge);
    });

    return $badge;
}


// Core DataTable Initialization
export async function initializeDataTable(endpoint, tableSelector = '#masterTable', options = {}) {
    const { columns = generateColumnsFromHeaders(tableSelector), pageLength = 8, pageLengthEndpoint = null, callbacks = {} } = options;
    const $table = $(tableSelector);
    if (!$table.length) return null;

    // Clean up previous instance
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }
    let defaultPageLength = pageLength; // default fallback

    if (pageLengthEndpoint) {
        try {
            defaultPageLength = await fetchDefaultPageLength(pageLengthEndpoint, 8);
            //console.log(`Server se page length mili: ${defaultPageLength}`);
        } catch (err) {
            console.warn("Page length fetch fail hua, fallback use ho raha:", pageLength);
        }
    }

    // ── Ab DataTable initialize karo ──
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }
    // Reset state
    currentOffset = 0;
    allLoadedData = [];
    isAppendMode = false;

    // Fetch server-configured page length if endpoint provided
    //let defaultPageLength = pageLength;
    //if (pageLengthEndpoint) {
    //    defaultPageLength = await fetchDefaultPageLength(pageLengthEndpoint);
    //    console.log("Fetched default page length from server: ", defaultPageLength);
    //}


    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        serverSide: true,
        paging: false,
        dom: 't',
        //pageLength,
        pageLength: defaultPageLength,
        searching: false,
        ordering: true,
        info: false,
        ajax: {
            url: endpoint,
            type: 'POST',
            data: d => {
                d.customSearch = $('#universalSearch').val() || '';
                d.groupByFields = groupBySelectionOrder;
                d.start = currentOffset;
                d.length = defaultPageLength;

                // Process all filter badges
                $('.badge-tag[data-type="Filter"]').each(function () {
                    const $badge = $(this);
                    const key = $badge.attr('data-key');
                    const val = $badge.attr('data-value');
                    const filterType = $badge.attr('data-filter');
                    //console.log('Date range sent:', { fromDate: startDate, toDate: endDate });

                    // Handle DateRange filter
                    if (filterType === 'DateRange') {
                        const startDate = $badge.attr('data-start-date');
                        const endDate = $badge.attr('data-end-date');

                        if (startDate && endDate) {
                            // Change these parameter names to match what your server expects
                            d.fromDate = startDate;     // or d.dateFrom, d.start_date, etc.
                            d.toDate = endDate;         // or d.dateTo, d.end_date, etc.
                            // console.log('Date range sent:', { fromDate: startDate, toDate: endDate });
                        }
                    }
                    // Handle regular filters
                    else if (key && val) {
                        d[key] = d[key] ? [].concat(d[key], val) : [val];
                    }
                });

                console.log('Final ajax request payload:', d);
                return d;
            },

            dataSrc: json => {
                if (isAppendMode) {
                    allLoadedData = [...allLoadedData, ...json.data];
                    updateLoadMoreButton(json.data.length);
                    return allLoadedData;
                } else {
                    allLoadedData = json.data;
                    updateLoadMoreButton(json.data.length);
                    return allLoadedData;
                }
            }
        },
        columns,
        drawCallback: function () {
            $('#masterTable tbody tr.group-row').remove();
            $('#masterTable tbody tr').show();

            const groupFields = getGroupByFieldsInOrder();
            if (!groupFields.length) {
                updateCustomPagination(table);
                callbacks.onDraw?.();
                isAppendMode = false;
                return;
            }

            const rowData = allLoadedData;
            const lastValues = [];
            const bodyRows = $('#masterTable tbody tr:not(.group-row)').toArray();

            bodyRows.forEach((node, idx) => {
                const data = rowData[idx];
                if (!data) return;

                groupFields.forEach((field, lvl) => {
                    const val = data[field] ?? '(Blank)';
                    if (lastValues[lvl] !== val) {
                        const groupVals = [...lastValues.slice(0, lvl), val];
                        const cnt = countRecordsInGroup(rowData, idx, groupFields, lvl, groupVals);
                        const totals = calculateGroupTotals(rowData, idx, groupFields, lvl, groupVals, columns);
                        $(node).before(createGroupHeaderRow(field, val, cnt, lvl, columns, totals));
                        lastValues[lvl] = val;
                        for (let j = lvl + 1; j < groupFields.length; j++) lastValues[j] = undefined;
                    }
                });
            });

            setupGroupRowToggle();
            updateCustomPagination(table);
            callbacks.onDraw?.();
            isAppendMode = false;
        }
    });

    // ── Load More ──
    $('#loadMoreBtn').off('click').on('click', function () {
        const $btn = $(this), $spin = $('#loadMoreSpinner');
        $spin.removeClass('d-none');
        $btn.prop('disabled', true);

        //currentOffset += PAGE_SIZE;
        //isAppendMode = true;
        currentOffset += defaultPageLength;
        isAppendMode = true;

        table.ajax.reload(() => {
            $spin.addClass('d-none');
            $btn.prop('disabled', false);
        }, false);
    });

    // ── Event handlers ──
    $('#universalSearch').off('keyup').on('keyup', () => {
        currentOffset = 0;
        isAppendMode = false;
        table.ajax.reload();
    });

    $(document).off('click', '#groupByList li[data-group]').on('click', '#groupByList li[data-group]', function () {
        const $li = $(this), field = $li.data('group'), txt = $li.text().trim();
        $li.toggleClass('active');

        if ($li.hasClass('active')) {
            if (!groupBySelectionOrder.includes(field)) groupBySelectionOrder.push(field);
            addSearchBadge('Group', field, txt);
        } else {
            groupBySelectionOrder = groupBySelectionOrder.filter(f => f !== field);
            $(`.badge-tag[data-type="Group"][data-value="${field}"]`).remove();
        }
        currentOffset = 0;
        isAppendMode = false;
        table.ajax.reload();
    });

    $(document).off('click', '[data-filter]').on('click', '[data-filter]', function () {
        const val = this.dataset.filter, txt = this.textContent.trim();
        $(this).toggleClass('active');

        if ($(this).hasClass('active')) addSearchBadge('Filter', val, txt);
        else $(`.badge-tag[data-type="Filter"][data-value="${val}"]`).remove();

        currentOffset = 0;
        isAppendMode = false;
        table.ajax.reload();
    });

    activeTables.set(tableSelector, table);
    $('#loadMoreBtn').show();

    return table;
}

/** Loads and displays default page length from server */
export async function loadAndDisplayDefaultPageLength(endpoint) {

    //alert("funcation load!!");
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        const defaultLoad = Number(data.value) || 20;
        const viewId = Number(data.id) || 0;

        const textEl = document.getElementById('defaultLoadText');
        const inputEl = document.getElementById('defaultLoadInput');

        if (textEl) {
            textEl.textContent = `${defaultLoad} records`;
            textEl.dataset.viewId = viewId;
        }
        if (inputEl) inputEl.value = defaultLoad;

        return { defaultLoad, viewId };
    } catch (err) {
        const fallback = 20;
        const textEl = document.getElementById('defaultLoadText');
        if (textEl) {
            textEl.textContent = `${fallback} records (fallback)`;
            textEl.dataset.viewId = '0';
        }
        return { defaultLoad: fallback, viewId: 0 };
    }
}
/** Fetches default page length from server or returns fallback value */
export async function fetchDefaultPageLength(endpoint, fallback = 25) {
    try {
        const res = await fetch(endpoint, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const value = Number(data?.value);
        //console.log("Server pageLength: ", value);

        return Number.isInteger(value) && value >= 5 ? value : fallback;
    } catch (err) {
        return fallback;
    }
}
// Misc Helpers
export function initStepper() {
    const el = document.querySelector('#wizardStepper');
    return el ? new Stepper(el, { linear: false }) : null;
}

function updateLoadMoreButton(returnedCount) {
    if (returnedCount < PAGE_SIZE) {
        $('#loadMoreBtn').hide();
        // $('#noMoreRecords').show(); // uncomment if you add this element
    } else {
        $('#loadMoreBtn').show();
        // $('#noMoreRecords').hide();
    }
}

// ── Universal Report Fields Loader ──
export async function loadReportFields(reportKey, options = {}) {
    const {
        filterContainerSelector = '#advancedDropdown .col:first ul',  // Filters list ka selector
        groupContainerSelector = '#groupByList',                     // Group By list ka selector
        onSuccess = () => { },                                        // Optional callback
        onError = (err) => console.error('Fields load failed:', err)
    } = options;

    try {
        const response = await fetch(`/Accounting/Report/GetReportFields?reportKey=${encodeURIComponent(reportKey)}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const fields = await response.json();

        // ── Filters populate ──
        const filterList = fields.filter(f => f.isFilterAllowed);
        const $filterUl = $(filterContainerSelector);
        if ($filterUl.length) {
            $filterUl.empty();
            filterList.forEach(f => {
                const $li = $(`
                    <li class="filter-item" data-filter="${f.fieldName}">
                        ${f.displayName}
                    </li>
                `);
                $filterUl.append($li);

                // Dynamically update pageFilterConfig with defaults from DB
                if (typeof setPageFilterConfig === 'function') {
                    pageFilterConfig[f.fieldName] = {
                        title: f.displayName,
                        backendKey: f.backendKey || f.fieldName, // Default to fieldName if backendKey is missing
                        divId: `filter-${f.fieldName}`, // Assuming a naming convention
                        defaultValue: f.defaultValue
                    };
                }
            });
        }

        // ── Automatically apply default values ──
        fields.forEach(f => {
            if (f.defaultValue && f.isFilterAllowed) {
                // Determine display text for default
                let displayText = `${f.displayName}::${f.defaultValue}`;

                // Special formatting for DateRange
                if (f.fieldName === 'DateRange' || f.fieldType === 'Date') {
                    const dates = f.defaultValue.split(' to ');
                    if (dates.length === 2) {
                        const formatForDisplay = (dStr) => {
                            const d = new Date(dStr);
                            return isNaN(d) ? dStr : `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                        };
                        displayText = `Date: ${formatForDisplay(dates[0])} to ${formatForDisplay(dates[1])}`;
                    }
                }

                addSearchBadge('Filter', f.fieldName, displayText);

                // If it was a date range, we need to set the specific attributes for it to be editable
                if (f.fieldName === 'DateRange' || f.fieldType === 'Date') {
                    const $badge = $(`.badge-tag[data-filter="${f.fieldName}"]`).last();
                    const dates = f.defaultValue.split(' to ');
                    if (dates.length === 2) {
                        $badge.attr('data-start-date', dates[0].trim());
                        $badge.attr('data-end-date', dates[1].trim());
                        $badge.attr('data-value', f.defaultValue);
                    }
                }
            }
        });

        // ── Group By populate ──
        const groupList = fields.filter(f => f.isGroupAllowed);
        const $groupUl = $(groupContainerSelector);
        if ($groupUl.length) {
            $groupUl.empty();
            groupList.forEach(f => {
                const $li = $(`
                    <li data-group="${f.fieldName}" class="group-item">
                        ${f.displayName}
                    </li>
                `);
                $groupUl.append($li);
            });
        }

        // Optional: success callback (agar kuch extra karna ho)
        onSuccess(fields);

        return fields; // agar kahin use karna ho to return kar sakte ho
    } catch (err) {
        onError(err);
        // Fallback: hardcoded values dikha sakte ho agar chaho
        return [];
    }
}
function updateCustomPagination(table) {
    $('#totalRecords').text(table.page.info().recordsDisplay || 0);
}

export function resetToFirstPage() {
    currentOffset = 0;
    isAppendMode = false;
    activeTables.get('#masterTable')?.ajax.reload();
}


export async function loadReportFavorites(reportKey, options = {}) {
    const { listSelector = '#favoritesList', onApply = null } = options;
    function applyView(item) {
        if (onApply) {
            onApply({
                filters: item.attr('data-filters'),
                groupBy: item.attr('data-groupby'),
                IsLocked: item.attr('data-islocked') === '1'
            });
        }
    }
    try {
        const data = await $.get(`/Accounting/Report/GetUserReportViews`, { reportKey });
        const $list = $(listSelector);
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
            if (isDefault) defaultView = v;
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
        // Auto-apply default view
        if (defaultView) applyView($(listSelector).find('.favorite-item').first());
        // Click handler
        $(document).off('click', `${listSelector} .favorite-item`).on('click', `${listSelector} .favorite-item`, function () {
            applyView($(this));
        });
    } catch (err) {
        $(listSelector).html('<li class="text-danger">Error loading favorites</li>');
        console.error(err);
    }
}
export function saveReportFavorite(viewName, reportKey) {
    if (!viewName) {
        showToast('warning', 'Please enter a name for the view');
        return $.Deferred().reject().promise();
    }
    const filters = {};
    $('.badge-tag[data-type="Filter"]').each(function () {
        const filterName = $(this).attr('data-filter') || $(this).data('filter');
        const value = $(this).data('value');
        if (filterName) {
            if (!filters[filterName]) filters[filterName] = [];
            filters[filterName].push(value);
        }
    });
    const groupBy = [...groupBySelectionOrder];
    const payload = {
        ViewName: viewName,
        ReportKey: reportKey,
        Filters: JSON.stringify(filters),
        GroupBy: JSON.stringify(groupBy)
    };
    return $.ajax({
        url: '/Accounting/Report/SaveReportView',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload)
    });
}
export function downloadReportPdfMultiple(endpoint) {
    const $btn = $('#downloadPdfBtn');
    const originalHtml = $btn.html();

    // Show spinner and disable button
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Generating...');

    const payload = {
        CustomSearch: $('#universalSearch').val(),
        GroupByFields: groupBySelectionOrder
    };
    $('.badge-tag[data-type="Filter"]').each(function () {
        const $badge = $(this);
        const key = $badge.attr('data-key');
        const val = $badge.attr('data-value');
        const filterType = $badge.attr('data-filter');
        if (filterType === 'DateRange') {
            const startDate = $badge.attr('data-start-date');
            const endDate = $badge.attr('data-end-date');
            if (startDate && endDate) {
                payload.fromDate = startDate;
                payload.toDate = endDate;
            }
        } else if (key && val) {
            if (!payload[key]) payload[key] = [];
            payload[key].push(val);
        }
    });
    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(resp => {
            if (!resp.ok) throw new Error('Server error');
            return resp.blob();
        })
        .then(blob => {
            const zipBlob = new Blob([blob], { type: 'application/zip' });
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'LedgerReports.zip';
            a.click();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        })
        .catch(err => {
            console.error('PDF generation failed', err);
            alert('PDF generation failed. Please try again.');
        })
        .finally(() => {
            // Restore button state
            $btn.prop('disabled', false).html(originalHtml);
        });
}
//export function downloadReportPdf(endpoint, payloadOverrides = {}) {
//        const payload = {
//            CustomSearch: $('#universalSearch').val(),
//            GroupByFields: groupBySelectionOrder
//        };
//        //  Loop through all filter badges
//        $('.badge-tag[data-type="Filter"]').each(function () {
//            const $badge = $(this);
//            const key = $badge.data('key');
//            const val = $badge.data('value');
//            const filterType = $badge.data('filter');
//            //  Handle dateRange separately
//            if (filterType === 'dateRange') {
//                const startDate = $badge.attr('data-start-date');
//                const endDate = $badge.attr('data-end-date');
//                if (startDate && endDate) {
//                    payload.fromDate = startDate;
//                    payload.toDate = endDate;
//                }
//            }
//            //  Handle normal filters
//            else if (key && val) {
//                if (!payload[key]) payload[key] = [];
//                payload[key].push(val);
//            }
//        });
//        console.log("PDF Payload:", payload); //  check console
//    //fetch('/Accounting/Report/LedgerPdf', {
//    //        method: 'POST',
//    //        headers: { 'Content-Type': 'application/json' },
//    //        body: JSON.stringify(payload)
//    //    })
//            //.then(resp => resp.blob())
//            //.then(blob => {
//            //    const url = window.URL.createObjectURL(blob);
//            //    const a = document.createElement('a');
//            //    a.href = url;
//            //    a.download = 'LedgerReport.pdf';
//            //    a.click();
//            //    window.URL.revokeObjectURL(url);
//    //});
//    fetch('/Accounting/Report/LedgerPdfMultiple', {
//        method: 'POST',
//        headers: { 'Content-Type': 'application/json' },
//        body: JSON.stringify(payload)
//    })
//        .then(resp => resp.blob())
//        .then(blob => {
//            const url = window.URL.createObjectURL(blob);
//            const a = document.createElement('a');
//            a.href = url;
//            a.download = 'LedgerReports.zip'; // multiple PDFs in ZIP
//            a.click();
//            window.URL.revokeObjectURL(url);
//        })
//        .catch(err => console.error('PDF generation failed', err));
//}