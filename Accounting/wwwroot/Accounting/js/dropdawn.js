function select2dropdawn() {
    $('.select2').each(function () {
        // Skip selects that belong to ebit-select components
        if ($(this).closest('ebit-select').length > 0) {
            console.log('Skipping select2 init for ebit-select element:', this.name);
            return;
        }

        var $select = $(this);
        var url = $select.data('url');
        var placeholder = $select.data('placeholder') || '';
        var selectedId = $select.data('selected-id');

        console.log("Initializing select2 for:", $select.attr('id') || $select.attr('name'));
        console.log("URL:", url);
        console.log("Placeholder:", placeholder);
        console.log("Selected ID:", selectedId);

        $select.select2({
            placeholder: placeholder,
            minimumInputLength: 0,
            ajax: {
                url: url,
                dataType: 'json',
                delay: 300,
                data: function (params) {
                    console.log("AJAX request params.term:", params.term);
                    return {
                        term: params.term || ''
                    };
                },
                processResults: function (data) {
                    console.log("AJAX response data:", data);
                    var results = data.map(function (item) {
                        return {
                            id: item.id,
                            text: item.name
                        };
                    });
                    console.log("Processed results:", results);
                    return { results: results };
                },
                cache: true
            }
        });

        // Load pre-selected item if any
        if (selectedId) {
            $.ajax({
                type: 'GET',
                url: url,
                data: { id: selectedId },
                dataType: 'json'
            }).then(function (data) {
                if (data && data.length > 0) {
                    var option = new Option(data[0].name, data[0].id, true, true);
                    $select.append(option).trigger('change');
                }
            });
        }
    });
}


function clearDevCache() {
    localStorage.clear();
    sessionStorage.clear();
    caches.keys().then(function (names) {
        for (let name of names)
            caches.delete(name);
    });
    alert("Cache cleared! Refreshing...");
    location.reload(true);
}
