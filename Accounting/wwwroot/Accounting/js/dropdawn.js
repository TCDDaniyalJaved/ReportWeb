// dropdown.js 
$(document).ready(function () {
    $('.select2').each(function () {
        const $select = $(this);
        const isAjax = !!$select.data('url');           
        const url = $select.data('url');
        const placeholder = $select.data('placeholder') || 'Select...';
        const selectedId = $select.data('selected-id');

        const $modal = $select.closest('.modal');
        const dropdownParent = $modal.length ? $modal : $('body');

        const baseOptions = {
            placeholder: placeholder,
            allowClear: false,                      
            minimumInputLength: 0,
            width: '100%',
            dropdownParent: dropdownParent,
            language: {
                noResults: function () {
                    return "No results found";
                }
            }
        };

    
        if (isAjax && url) {
            $select.select2({
                ...baseOptions,
                ajax: {
                    url: url,
                    dataType: 'json',
                    delay: 250,
                    cache: true,
                    data: function (params) {
                        return {
                            term: params.term?.trim() || ''
                        };
                    },
                    processResults: function (data) {
                        let results = [];

                        if (Array.isArray(data)) {
                            results = data.map(item => ({
                                id: item.id ?? item.value ?? item.Id,
                                text: item.name ?? item.text ?? item.title ?? 'Unnamed'
                            }));
                        }

                        return { results };
                    }
                }
            });

            if (selectedId) {
                $.ajax({
                    url: url,
                    type: 'GET',
                    data: { id: selectedId },
                    dataType: 'json',
                    cache: true
                })
                    .done(function (data) {
                        let item = null;

                        if (Array.isArray(data) && data.length > 0) {
                            item = data[0];
                        } else if (data && data.id) {
                            item = data;
                        }

                        if (item) {
                            const option = new Option(
                                item.name || item.text || 'Selected',
                                item.id,
                                true,
                                true
                            );
                            $select.append(option).trigger('change');
                        }
                    })
                    .fail(function () {
                        console.warn(`Pre-selected value ${selectedId} load nahi hua from ${url}`);
                    });
            }
        }

        else {
            $select.select2(baseOptions);
        }
    });

});