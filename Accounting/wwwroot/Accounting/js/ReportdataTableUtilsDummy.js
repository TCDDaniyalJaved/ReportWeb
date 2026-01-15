// ReportdataTableUtilsDummy.js
// Shared utilities for DataTable initialization, grouping, custom pagination, badges, filters in reports

// Global state & constants
let activeTables = new Map();               // stores DataTable instances by selector
export let groupBySelectionOrder = [];      // maintains order of selected group-by fields
let pageFilterConfig = {};                  // page-specific filter mappings (UI → backend)
let currentOffset = 0;                      // manual offset for "Load More" style pagination
const PAGE_SIZE = 10;                       // records per "page" / load batch
let allLoadedData = [];                     // accumulates all loaded rows for client-side grouping
let isAppendMode = false;                   // flag to know if we're appending vs replacing data

const FILTER_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,4H21V6H3V4M6,10H18V12H6V10M10,16H14V18H10V16Z"></path></svg>`;
const GROUP_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" class="me-1"><path d="M3,13H9V19H3V13M3,5H9V11H3V5M11,5H21V11H11V5M11,13H21V19H11V13Z"></path></svg>`;

// Configuration & Column Generation
// Store page-specific filter config (used in badge → modal → backend key mapping)
export function setPageFilterConfig(config) {
    pageFilterConfig = { ...config };
}

// Dynamically build DataTable column definitions from <ebit-headcolumn> attributes
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

        // Auto-format amount-like columns
        const amountKeywords = ['debit', 'credit', 'amount', 'balance'];
        if (datafield && amountKeywords.some(k => datafield.toLowerCase().includes(k))) {
            colDef.render = $.fn.dataTable.render.number(',', '.', 2);
            colDef.className = (colDef.className || '') + ' text-end';
        }

        // Format dates to Indian style (DD-MM-YYYY)
        if (datafield && /date/i.test(datafield)) {
            colDef.render = (data) => data ? new Date(data).toLocaleDateString('en-IN') : '';
        }

        columns.push(colDef);
    });
    return columns;
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

// Toggle expand/collapse for group rows and nested content
function setupGroupRowToggle() {
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

// Badges & Filter Modal
// Add visual badge for active filter or group-by
export function addSearchBadge(type, value, displayText, isLocked = false) {
    if ($(`.badge-tag[data-type="${type}"][data-value="${value}"]`).length) return;

    const icon = type === 'Group' ? GROUP_ICON : `<span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>`;
    const removeBtn = isLocked ? '' : '<span class="remove-btn ms-1" style="cursor:pointer;">×</span>';
    const lockedClass = isLocked ? 'opacity-75 cursor-not-allowed' : '';

    const $badge = $(`
        <span class="badge-tag d-inline-flex align-items-center ${lockedClass}"
              data-type="${type}" data-value="${value}" data-locked="${isLocked ? '1' : '0'}">
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
    const $select = $div.find('select').first();

    if ($badge?.data('id')) $select.val($badge.data('id'));
    else $select.val($select.find('option:first').val());

    $modal.find('#applyFilterBtn').off('click').on('click', function () {
        const id = $select.val();
        const text = $select.find('option:selected').text().trim();

        if (!id || id === '0') {
            $badge?.remove();
        } else if (!$badge) {
            // create new badge
            const $newBadge = $(`
            <span class="badge-tag d-inline-flex align-items-center" 
                  data-type="Filter" 
                  data-value="${text}" 
                  data-id="${id}">
                <span class="filter-icon" style="cursor:pointer;">${FILTER_ICON}</span>
                <span class="badge-text ms-1">${text}</span>
                <span class="remove-btn ms-1" style="cursor:pointer;">×</span>
            </span>
        `);

            //  Add backend key attribute here
            $newBadge.attr('data-key', config.backendKey);

            $newBadge.find('.remove-btn').on('click', () => {
                $newBadge.remove();
                activeTables.get('#masterTable')?.ajax.reload();
            });
            $newBadge.find('.filter-icon').on('click', () => openFilterModal(filterType, $newBadge));
            $('#universalSearch').before($newBadge);
        } else {
            // update existing badge
            $badge.data({ id, value: text });
            $badge.find('.badge-text').text(text);

            //  Ensure backend key attribute is set on existing badge too
            $badge.attr('data-key', config.backendKey);
        }

        bootstrap.Modal.getInstance($modal[0]).hide();
        activeTables.get('#masterTable')?.ajax.reload();
    });


    new bootstrap.Modal($modal[0]).show();
}

// Core DataTable Initialization
export function initializeDataTable(endpoint, tableSelector = '#masterTable', options = {}) {
    const { columns = generateColumnsFromHeaders(tableSelector), pageLength = PAGE_SIZE, callbacks = {} } = options;
    const $table = $(tableSelector);
    if (!$table.length) return null;

    // Clean up previous instance
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $table.DataTable().destroy();
        $table.empty();
    }

    // Reset state
    currentOffset = 0;
    allLoadedData = [];
    isAppendMode = false;

    const table = $table.DataTable({
        autoWidth: false,
        scrollX: true,
        serverSide: true,
        paging: false,
        dom: 't',
        pageLength,
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
                d.length = PAGE_SIZE;

                $('.badge-tag[data-type="Filter"]').each(function () {
                    const key = $(this).data('key');//||'companyid';
                    const val = $(this).data('value');


                    console.log('backend key: ' + key);
                    if (key && val) {
                        d[key] = d[key] ? [].concat(d[key], val) : [val];
                    }
                });

                console.log('ajax request payload:', d);
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

        currentOffset += PAGE_SIZE;
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

function updateCustomPagination(table) {
    $('#totalRecords').text(table.page.info().recordsDisplay || 0);
}

export function resetToFirstPage() {
    currentOffset = 0;
    isAppendMode = false;
    activeTables.get('#masterTable')?.ajax.reload();
}