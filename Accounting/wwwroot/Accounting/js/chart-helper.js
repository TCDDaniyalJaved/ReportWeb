// chart-helper.js
async function renderGroupedBarChart(config) {
    const {
        containerId,
        chartTitle,
        endpoint,
        xField,
        seriesConfig = [],
        height = 380,
        valuePrefix = 'Rs. ',
        valueSuffix = '',
        yAxisTitle = 'Amount',
        chartType = 'bar',
        stacked = false,
        horizontal = false
    } = config;

    if (!containerId || !chartTitle || !endpoint || !xField || seriesConfig.length === 0) {
        console.error("Required parameters for chart rendering are missing.");
        return;
    }

    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to retrieve chart data from API.');

        const data = await response.json();
        const groupedData = {};
        data.forEach(item => {
            const key = String(item[xField] ?? 'Unknown');
            if (!groupedData[key]) groupedData[key] = {};
            seriesConfig.forEach(series => {
                const field = series.field;
                groupedData[key][field] = (groupedData[key][field] || 0) + (Number(item[field]) || 0);
            });
        });

        const categories = Object.keys(groupedData).sort();
        const series = seriesConfig.map(series => ({
            name: series.name,
            data: categories.map(key => groupedData[key][series.field] || 0)
        }));

        const colors = seriesConfig.map(series => series.color).filter(Boolean);

        const options = {
            chart: { type: chartType, height, stacked, toolbar: { show: true } },
            series,
            xaxis: { categories, title: { text: '' } },
            yaxis: { title: { text: yAxisTitle } },
            colors: colors.length > 0 ? colors : undefined,
            plotOptions: { bar: { horizontal, columnWidth: '60%', endingShape: 'rounded' } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            tooltip: { y: { formatter: val => valuePrefix + val.toLocaleString() + valueSuffix } },
            legend: { position: 'top' },
            title: { text: chartTitle, align: 'center', style: { fontSize: '16px' } }
        };

        const chart = new ApexCharts(document.querySelector("#" + containerId), options);
        await chart.render();

    } catch (error) {
        console.error('Chart rendering error:', error);
        document.querySelector("#" + containerId).innerHTML =
            `<div class="alert alert-danger m-3">Unable to load chart.</div>`;
    }
}

async function renderRevenueBarChart(config) {
    const {
        containerId,
        endpoint = null,    // API URL
        data = null,        // fallback direct data
        colors = [],        // optional custom colors
        height = 95,
        labelColor = '#6e6b7b'
    } = config;

    const el = document.querySelector('#' + containerId);
    if (!el) return;

    // Default fallback values
    let seriesData = [0, 0, 0, 0, 0, 0, 0];
    let categories = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    let barColors = colors.length ? colors : ['#7367f0', '#7367f0', '#7367f0', '#7367f0', '#28c76f', '#7367f0', '#7367f0'];

    try {
        // Fetch data from API if endpoint is provided
        if (endpoint) {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Failed to fetch revenue data');
            const apiData = await response.json();

            // API should return { categories: [], series: [], colors: [] }
            seriesData = Array.isArray(apiData.series) ? apiData.series : seriesData;
            categories = Array.isArray(apiData.categories) ? apiData.categories : categories;
            barColors = Array.isArray(apiData.colors) ? apiData.colors : barColors;
        }
        // If direct data provided
        else if (data) {
            seriesData = Array.isArray(data.series) ? data.series : seriesData;
            categories = Array.isArray(data.categories) ? data.categories : categories;
            barColors = Array.isArray(data.colors) ? data.colors : barColors;
        }

        // Clear container before rendering
        el.innerHTML = '';

        // ApexCharts config
        const revenueBarChartConfig = {
            chart: {
                type: 'bar',
                height,
                toolbar: { show: false }
            },
            plotOptions: {
                bar: {
                    barHeight: '80%',
                    columnWidth: '75%',
                    startingShape: 'rounded',
                    endingShape: 'rounded',
                    borderRadius: 4,
                    distributed: true
                }
            },
            grid: { show: false, padding: { top: -20, bottom: -12, left: -10, right: 0 } },
            colors: barColors,
            dataLabels: { enabled: false },
            series: [{ data: seriesData }],
            legend: { show: false },
            xaxis: {
                categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { colors: labelColor, fontSize: '13px' } }
            },
            yaxis: { labels: { show: false } },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        plotOptions: { bar: { columnWidth: '60%' } }
                    }
                },
                {
                    breakpoint: 480,
                    options: {
                        plotOptions: { bar: { columnWidth: '70%' } }
                    }
                }
            ]
        };

        const chart = new ApexCharts(el, revenueBarChartConfig);
        await chart.render();

    } catch (err) {
        console.error('Revenue Bar Chart Error:', err);
        el.innerHTML = '<div class="text-danger small">Data load failed</div>';
    }
}


async function renderPieChart(config) {
    const {
        containerId,
        chartTitle,
        endpoint,
        labelField,
        valueField,
        colors = [],
        height = 380,
        valuePrefix = '',
        valueSuffix = '',
        showLabels = true,
        donut = false
    } = config;

    if (!containerId || !chartTitle || !endpoint || !labelField || !valueField) {
        console.error("Pie chart required parameters are missing.");
        return;
    }

    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to retrieve pie chart data.');

        const data = await response.json();
        const grouped = {};
        data.forEach(item => {
            const key = item[labelField];
            if (!key) return;
            grouped[key] = (grouped[key] || 0) + (Number(item[valueField]) || 0);
        });

        const labels = Object.keys(grouped);
        const values = Object.values(grouped);

        const options = {
            chart: { type: donut ? 'donut' : 'pie', height },
            series: values,
            labels,
            colors: colors.length > 0 ? colors : undefined,
            dataLabels: { enabled: showLabels, formatter: val => valuePrefix + val.toLocaleString() + valueSuffix, style: { fontSize: '14px' }, dropShadow: { enabled: false } },
            legend: { position: 'bottom', horizontalAlign: 'center' },
            tooltip: { y: { formatter: val => valuePrefix + val.toLocaleString() + valueSuffix } },
            title: { text: chartTitle, align: 'center' },
            plotOptions: { pie: { expandOnClick: true, startAngle: -90, customScale: 0.95 } }
        };

        const chart = new ApexCharts(document.querySelector("#" + containerId), options);
        await chart.render();

    } catch (error) {
        console.error('Pie chart rendering error:', error);
        document.querySelector("#" + containerId).innerHTML =
            `<div class="alert alert-danger m-3">Unable to load pie chart.</div>`;
    }
}
async function renderOrderStatisticsChart(config) {
    const {
        containerId,
        chartTitle = 'Order Statistics',
        endpoint = null,      // API endpoint
        data = null,          // optional direct data
        colors = ['#00E396', '#008FFB', '#FEB019', '#FF4560'],
        height = 145,
        width = 110,
        donutSize = '75%',
        cardColor = '#fff',
        headingColor = '#566a7f',
        legendColor = '#a1acb8',
        centerLabel = 'Weekly',
        centerValue = ''      // dynamic total or % can be set here
    } = config;

    if (!containerId) {
        console.error("containerId is required for Order Statistics Chart");
        return;
    }

    const chartContainer = document.querySelector('#' + containerId);
    if (!chartContainer) {
        console.error(`Element #${containerId} not found.`);
        return;
    }

    try {
        let finalLabels = [];
        let finalSeries = [];

        // Fetch data from API if endpoint is provided
        if (endpoint) {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Failed to fetch order statistics data');
            const apiData = await response.json();

            /**
             * Flexible handling:
             * If API returns array of objects like [{ category: 'Electronic', value: 50 }, ...]
             */
            if (Array.isArray(apiData)) {
                finalLabels = apiData.map(item => item.category || item.label || 'Unknown');
                finalSeries = apiData.map(item => Number(item.value || item.amount || 0));
            }
            // If API returns { labels: [], series: [] }
            else if (apiData.labels && apiData.series) {
                finalLabels = apiData.labels;
                finalSeries = apiData.series;
            }
        }
        // If direct data is provided
        else if (data) {
            if (Array.isArray(data)) {
                finalLabels = data.map(item => item.category || item.label || 'Unknown');
                finalSeries = data.map(item => Number(item.value || item.amount || 0));
            } else {
                finalLabels = data.labels || [];
                finalSeries = data.series || [];
            }
        }

        // Compute center value if not provided
        const total = finalSeries.reduce((a, b) => a + b, 0);
        const centerVal = centerValue || (total ? Math.round(total / 100) + '%' : '0%');

        chartContainer.innerHTML = '';

        const orderChartConfig = {
            chart: { height, width, type: 'donut' },
            labels: finalLabels,
            series: finalSeries,
            colors,
            stroke: { width: 5, colors: [cardColor] },
            dataLabels: { enabled: false },
            legend: { show: false },
            grid: { padding: { top: 0, bottom: 0, right: 15 } },
            plotOptions: {
                pie: {
                    donut: {
                        size: donutSize,
                        labels: {
                            show: true,
                            value: {
                                fontSize: '18px',
                                fontFamily: 'Public Sans',
                                fontWeight: 500,
                                color: headingColor,
                                offsetY: -17,
                                formatter: val => parseInt(val) + '%'
                            },
                            name: { offsetY: 17, fontFamily: 'Public Sans' },
                            total: {
                                show: true,
                                fontSize: '13px',
                                color: legendColor,
                                label: centerLabel,
                                formatter: () => centerVal
                            }
                        }
                    }
                }
            }
        };

        const statisticsChart = new ApexCharts(chartContainer, orderChartConfig);
        await statisticsChart.render();

    } catch (error) {
        console.error('Error rendering Order Statistics Chart:', error);
        chartContainer.innerHTML = `<div class="alert alert-danger m-2">Unable to load order statistics chart.</div>`;
    }
}

// chart-helper.js
async function renderRadialMiniChart(config) {
    const {
        containerId,           // required
        endpoint = null,       // ← NEW: API se data laane ke liye
        valueField = 'value',  // API response mein kis field se value leni hai
        maxValueField = 'maxValue', // target ya max value ka field
        value = 0,             // fallback/static value
        maxValue = 100,
        prefix = '',
        suffix = '',
        color = '#7367f0',
        trackColor = '#e9ecef',
        size = 80,
        hollowSize = '45%',
        strokeWidth = 10,
        valueFontSize = '14px',
        nameText = '',
        showName = false,
        centerOffsetY = 5
    } = config;

    const element = document.querySelector(`#${containerId}`);
    if (!element) return;

    let currentValue = value;
    let currentMax = maxValue;

    // Agar endpoint diya hai to data fetch karo
    if (endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('API error');
            const data = await response.json();

            // Flexible handling: direct value ya object se
            currentValue = Number(data[valueField] || data.current || data.value || data.amount || 0);
            currentMax = Number(data[maxValueField] || data.target || data.max || 100);
        } catch (err) {
            console.error("Radial chart data fetch error:", err);
            element.innerHTML = '<div class="text-danger small">Data nahi mila</div>';
            return;
        }
    }

    const percentage = Math.min(100, Math.max(0, (currentValue / currentMax) * 100));

    const options = {
        series: [percentage],
        chart: {
            width: size,
            height: size,
            type: 'radialBar',
            sparkline: { enabled: true }
        },
        plotOptions: {
            radialBar: {
                startAngle: 0,
                endAngle: 360,
                hollow: { margin: 2, size: hollowSize },
                track: { background: trackColor, strokeWidth: '100%' },
                dataLabels: {
                    show: true,
                    name: {
                        show: showName,
                        offsetY: -10,
                        color: '#999',
                        fontSize: '11px'
                    },
                    value: {
                        formatter: () => prefix + Math.round(currentValue).toLocaleString() + suffix,
                        offsetY: centerOffsetY,
                        color: '#333',
                        fontSize: valueFontSize,
                        fontWeight: 600,
                        show: true
                    }
                }
            }
        },
        fill: { type: 'solid', colors: [currentValue > currentMax ? '#ea5455' : color] },
        stroke: { lineCap: 'round' },
        grid: { padding: { top: -10, bottom: -15, left: -10, right: -10 } },
        states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } }
    };

    if (showName && nameText) {
        options.plotOptions.radialBar.dataLabels.name.text = nameText;
    }

    try {
        const chart = new ApexCharts(element, options);
        await chart.render();
    } catch (err) {
        element.innerHTML = '<div class="text-danger small">Chart load nahi hua</div>';
    }
}
// chart-helper.js
async function renderTotalRevenueChart(config) {
    const {
        containerId,                // required
        endpoint = null,            // API URL
        seriesField = 'series',     // API me series ka key
        categoriesField = 'categories', // API me categories ka key
        fallbackSeries = [],        // fallback static series
        fallbackCategories = [],
        colors = ['#7367f0', '#00cfe8'],
        height = 332
    } = config;

    const element = document.querySelector(`#${containerId}`);
    if (!element) return;

    let seriesData = fallbackSeries;
    let categories = fallbackCategories;

    // 🔹 API se data lao
    if (endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('API Error');

            const data = await response.json();

            seriesData = data[seriesField] || fallbackSeries;
            categories = data[categoriesField] || fallbackCategories;

        } catch (err) {
            console.error('Total Revenue Chart Error:', err);
            element.innerHTML = '<div class="text-danger small">Data load nahi ho saka</div>';
            return;
        }
    }

    const options = {
        series: seriesData,
        chart: {
            height: height,
            type: 'bar',
            stacked: true,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '30%',
                borderRadius: 8,
                startingShape: 'rounded',
                endingShape: 'rounded'
            }
        },
        colors: colors,
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 6,
            lineCap: 'round',
            colors: ['#fff']
        },
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    fontSize: '13px',
                    fontFamily: 'Public Sans'
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: '13px',
                    fontFamily: 'Public Sans'
                }
            }
        },
        grid: {
            strokeDashArray: 7,
            padding: {
                top: 0,
                bottom: -8,
                left: 20,
                right: 20
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'left',
            fontSize: '13px'
        },
        fill: { opacity: 1 },
        states: {
            hover: { filter: { type: 'none' } },
            active: { filter: { type: 'none' } }
        }
    };

    try {
        const chart = new ApexCharts(element, options);
        await chart.render();
    } catch (err) {
        element.innerHTML = '<div class="text-danger small">Chart render nahi hua</div>';
    }
}

function renderBrowserStatsTable(options) {
    fetch(options.endpoint)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById(options.tbodyId);
            tbody.innerHTML = "";

            data.forEach(item => {
                const visitsText = item.visits >= 1000
                    ? (item.visits / 1000).toFixed(2) + "k"
                    : item.visits;

                tbody.innerHTML += `
                        <tr>
                            <td>${item.no}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img src="/img/icons/brands/${item.icon}" height="24" class="me-3">
                                    <span class="text-heading">${item.name}</span>
                                </div>
                            </td>
                            <td class="text-heading">${visitsText}</td>
                            <td>
                                <div class="d-flex justify-content-between align-items-center gap-4">
                                    <div class="progress w-100" style="height:10px;">
                                        <div class="progress-bar ${item.color}"
                                             style="width:${item.percentage}%">
                                        </div>
                                    </div>
                                    <small class="fw-medium">${item.percentage}%</small>
                                </div>
                            </td>
                        </tr>
                    `;
            });
        })
        .catch(err => console.error("Browser stats error:", err));
}

async function renderDataTable(config) {
    const {
        tableBodyId,          // required
        endpoint,             // required
        columns = [],         // [{ field, formatter }]
        emptyMessage = 'No data available',
        errorMessage = 'Unable to load data',
        beforeRender = null,  // optional hook
        afterRender = null    // optional hook
    } = config;

    if (!tableBodyId || !endpoint || columns.length === 0) {
        console.error('renderDataTable: Required parameters missing');
        return;
    }

    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('API Error');

        let data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center text-muted">${emptyMessage}</td></tr>`;
            return;
        }

        if (beforeRender) data = beforeRender(data);

        let html = '';

        data.forEach((row, index) => {
            html += '<tr>';
            columns.forEach(col => {
                let value = row[col.field];
                if (col.formatter) {
                    value = col.formatter(value, row, index);
                }
                html += `<td>${value ?? '-'}</td>`;
            });
            html += '</tr>';
        });

        tbody.innerHTML = html;

        if (afterRender) afterRender();

    } catch (error) {
        console.error('renderDataTable error:', error);
        tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center text-danger">${errorMessage}</td></tr>`;
    }
}