import {
    initializeDataTable,
    goBackToList,
    handleCreateButton,
    handleDirectUrl,
    handleRowActions,
    initStepper,
    initCheckboxSelection   
} from './dataTableUtils.js';

const BASE_PATH = '/Accounting/Accountopening';
let table;

$(document).ready(() => {
    initStepper();
    handleDirectUrl(BASE_PATH);
    handleCreateButton(BASE_PATH);

    table = initializeDataTable(`${BASE_PATH}/GetData`, '#masterTable', {
        callbacks: {
            onDraw: () => {
                handleRowActions(BASE_PATH, {
                    onDelete: () => {
                        table.ajax.reload(null, false);
                    }
                });
                $('#totalRecords').text(table?.page.info().recordsDisplay || 0);

                // Optional: reset select-all on every draw (safety)
                $('#select-all').prop('checked', false);
            }
        }
    });

    //initCheckboxSelection(table, '#masterTable');

initCheckboxSelection(table, '#masterTable', [
    {
        id: 'action-select-all',
        label: 'Select All (this page)',
        icon: 'bx bx-check-square',
        action: (table, $table, selectedIds) => {
            $table.find('tbody .row-selector').each(function () {
                const id = String($(this).data('id') ?? '');
                if (id) selectedIds.add(id);
                $(this).prop('checked', true);
                $(this).closest('tr').addClass('table-active');
            });
        }
    },
    {
        id: 'action-select-none',
        label: 'Clear Selection',
        icon: 'bx bx-x-circle',
        action: (table, $table, selectedIds) => {
            selectedIds.clear();
            $table.find('.row-selector').prop('checked', false);
            $table.find('tr').removeClass('table-active');
        }
    }
    // You can add more actions like bulk delete, export, etc.
]);
});