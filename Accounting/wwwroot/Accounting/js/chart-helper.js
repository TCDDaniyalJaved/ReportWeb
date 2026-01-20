// chart-helper.js
// Utility functions for rendering various ApexCharts in the dashboard

/**
 * Renders a grouped or stacked bar chart with multiple series
 */
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

    // Validate required parameters
    if (!containerId || !chartTitle || !endpoint || !xField || seriesConfig.length === 0) {
        console.error("Required parameters for chart rendering are missing.");
        return;
    }

    try {
        // Fetch data from the provided API endpoint
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to retrieve chart data from API.');
        const data = await response.json();

        // Group data by xField and aggregate values for each series
        const groupedData = {};
        data.forEach(item => {
            const key = String(item[xField] ?? 'Unknown');
            if (!groupedData[key]) groupedData[key] = {};
            seriesConfig.forEach(series => {
                const field = series.field;
                groupedData[key][field] = (groupedData[key][field] || 0) + (Number(item[field]) || 0);
            });
        });

        // Prepare sorted categories and series data
        const categories = Object.keys(groupedData).sort();
        const series = seriesConfig.map(series => ({
            name: series.name,
            data: categories.map(key => groupedData[key][series.field] || 0)
        }));

        // Extract colors from seriesConfig if provided
        const colors = seriesConfig.map(series => series.color).filter(Boolean);

        // ApexCharts configuration
        const options = {
            chart: {
                type: chartType,
                height,
                stacked,
                toolbar: {
                    show: true
                }
            },
            series,
            xaxis: {
                categories,
                title: {
                    text: ''
                }
            },
            yaxis: {
                title: {
                    text: yAxisTitle
                }
            },
            colors: colors.length > 0 ? colors : undefined,
            plotOptions: {
                bar: {
                    horizontal,
                    columnWidth: '60%',
                    endingShape: 'rounded'
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            tooltip: {
                y: {
                    formatter: val => valuePrefix + val.toLocaleString() + valueSuffix
                }
            },
            legend: {
                position: 'top'
            },
            title: {
                text: chartTitle,
                align: 'center',
                style: {
                    fontSize: '16px'
                }
            }
        };

        // Render the chart
        const chart = new ApexCharts(document.querySelector("#" + containerId), options);
        await chart.render();
    } catch (error) {
        console.error('Chart rendering error:', error);
        document.querySelector("#" + containerId).innerHTML =
            `<div class="alert alert-danger m-3">Unable to load chart.</div>`;
    }
}

/**
 * Renders a compact distributed bar chart (usually for weekly data)
 * Supports flexible data formats using xField and yField
 */
async function renderRevenueBarChart(config) {
    const {
        containerId,                // required
        endpoint,                   // required for API
        xField = null,              // X-axis field (e.g. "day", "weekday")
        yField = null,              // Y-axis field (e.g. "revenue", "amount")
        title = 'Weekly Revenue',   // optional title
        colors = [],                // optional custom colors array
        height = 95,
        labelColor = '#6e6b7b',
        emptyMessage = 'No data available'
    } = config;

    const el = document.querySelector('#' + containerId);
    if (!el) return;

    // Validate required fields
    if (!endpoint || !xField || !yField) {
        console.error("renderRevenueBarChart: containerId, endpoint, xField and yField are required");
        el.innerHTML = '<div class="text-danger small">Configuration missing</div>';
        return;
    }

    // Default fallback values
    let seriesData = [0, 0, 0, 0, 0, 0, 0];
    let categories = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    let barColors = colors.length ? colors : ['#7367f0', '#7367f0', '#7367f0', '#7367f0', '#28c76f', '#7367f0', '#7367f0'];

    try {
        // Fetch data from API
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const rawData = await response.json();

        // Flexible data parsing – supports multiple formats
        if (Array.isArray(rawData) && rawData.length > 0) {
            // Case 1: Array of objects
            if (typeof rawData[0] === 'object') {
                categories = rawData.map(item => String(item[xField] ?? 'Unknown'));
                seriesData = rawData.map(item => Number(item[yField]) || 0);
            }
            // Case 2: Simple array of numbers
            else {
                seriesData = rawData.map(Number);
            }
        }
        // Case 3: Object with field arrays
        else if (rawData && (rawData[xField] || rawData.categories || rawData.series)) {
            categories = rawData[xField] || rawData.categories || categories;
            seriesData = rawData[yField] || rawData.series || seriesData;
        }
        // Case 4: Standard { categories, series } format
        else if (rawData && rawData.categories && rawData.series) {
            categories = Array.isArray(rawData.categories) ? rawData.categories : categories;
            seriesData = Array.isArray(rawData.series) ? rawData.series : seriesData;
        }

        // Override colors if provided in response
        if (Array.isArray(rawData.colors)) {
            barColors = rawData.colors;
        }

        // Handle empty or zero data
        if (seriesData.length === 0 || seriesData.every(v => v === 0)) {
            el.innerHTML = `<div class="text-center text-muted">${emptyMessage}</div>`;
            return;
        }

        // Clear container before rendering
        el.innerHTML = '';

        // ApexCharts configuration
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
            grid: {
                show: false,
                padding: { top: -20, bottom: -12, left: -10, right: 0 }
            },
            colors: barColors,
            dataLabels: { enabled: false },
            series: [{ data: seriesData }],
            legend: { show: false },
            xaxis: {
                categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: {
                        colors: labelColor,
                        fontSize: '13px'
                    }
                }
            },
            yaxis: {
                labels: { show: false }
            },
            tooltip: {
                y: {
                    formatter: val => `Rs. ${val.toLocaleString()}`
                }
            },
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

        // Add optional title if provided
        if (title) {
            revenueBarChartConfig.title = {
                text: title,
                align: 'center',
                style: { fontSize: '14px' }
            };
        }

        // Render chart
        const chart = new ApexCharts(el, revenueBarChartConfig);
        await chart.render();

    } catch (err) {
        console.error('Revenue Bar Chart Error:', err);
        el.innerHTML = '<div class="text-danger small">Data load failed</div>';
    }
}

/**
 * Renders a pie or donut chart with dynamic grouping
 */
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

    // Validate required parameters
    if (!containerId || !chartTitle || !endpoint || !labelField || !valueField) {
        console.error("Pie chart required parameters are missing.");
        return;
    }

    try {
        // Fetch data from API
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to retrieve pie chart data.');
        const data = await response.json();

        // Aggregate values by labelField
        const grouped = {};
        data.forEach(item => {
            const key = item[labelField];
            if (!key) return;
            grouped[key] = (grouped[key] || 0) + (Number(item[valueField]) || 0);
        });

        const labels = Object.keys(grouped);
        const values = Object.values(grouped);

        // ApexCharts configuration
        const options = {
            chart: {
                type: donut ? 'donut' : 'pie',
                height
            },
            series: values,
            labels,
            colors: colors.length > 0 ? colors : undefined,
            dataLabels: {
                enabled: showLabels,
                formatter: val => valuePrefix + val.toLocaleString() + valueSuffix,
                style: {
                    fontSize: '14px'
                },
                dropShadow: {
                    enabled: false
                }
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center'
            },
            tooltip: {
                y: {
                    formatter: val => valuePrefix + val.toLocaleString() + valueSuffix
                }
            },
            title: {
                text: chartTitle,
                align: 'center'
            },
            plotOptions: {
                pie: {
                    expandOnClick: true,
                    startAngle: -90,
                    customScale: 0.95
                }
            }
        };

        // Render chart
        const chart = new ApexCharts(document.querySelector("#" + containerId), options);
        await chart.render();
    } catch (error) {
        console.error('Pie chart rendering error:', error);
        document.querySelector("#" + containerId).innerHTML =
            `<div class="alert alert-danger m-3">Unable to load pie chart.</div>`;
    }
}

/**
 * Renders a donut chart with center label/value (used for statistics)
 */
async function renderOrderStatisticsChart(config) {
    const {
        containerId,
        chartTitle = 'Order Statistics',
        endpoint = null,
        data = null,
        colors = ['#00E396', '#008FFB', '#FEB019', '#FF4560'],
        height = 145,
        width = 110,
        donutSize = '75%',
        cardColor = '#fff',
        headingColor = '#566a7f',
        legendColor = '#a1acb8',
        centerLabel = 'Weekly',
        centerValue = ''
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

        // Fetch or use provided data
        if (endpoint) {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Failed to fetch order statistics data');
            const apiData = await response.json();

            if (Array.isArray(apiData)) {
                finalLabels = apiData.map(item => item.category || item.label || 'Unknown');
                finalSeries = apiData.map(item => Number(item.value || item.amount || 0));
            }
            else if (apiData.labels && apiData.series) {
                finalLabels = apiData.labels;
                finalSeries = apiData.series;
            }
        }
        else if (data) {
            if (Array.isArray(data)) {
                finalLabels = data.map(item => item.category || item.label || 'Unknown');
                finalSeries = data.map(item => Number(item.value || item.amount || 0));
            } else {
                finalLabels = data.labels || [];
                finalSeries = data.series || [];
            }
        }

        // Calculate center value if not provided
        const total = finalSeries.reduce((a, b) => a + b, 0);
        const centerVal = centerValue || (total ? Math.round(total / 100) + '%' : '0%');

        chartContainer.innerHTML = '';

        // ApexCharts configuration
        const orderChartConfig = {
            chart: {
                height,
                width,
                type: 'donut'
            },
            labels: finalLabels,
            series: finalSeries,
            colors,
            stroke: {
                width: 5,
                colors: [cardColor]
            },
            dataLabels: {
                enabled: false
            },
            legend: {
                show: false
            },
            grid: {
                padding: {
                    top: 0,
                    bottom: 0,
                    right: 15
                }
            },
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
                            name: {
                                offsetY: 17,
                                fontFamily: 'Public Sans'
                            },
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

/**
 * Renders a radial progress/mini gauge chart
 */
async function renderRadialMiniChart(config) {
    const {
        containerId,
        endpoint = null,
        valueField = 'value',
        maxValueField = 'maxValue',
        value = 0,
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

    // Fetch data if endpoint is provided
    if (endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('API error');
            const data = await response.json();

            // Flexible value extraction
            currentValue = Number(data[valueField] || data.current || data.value || data.amount || 0);
            currentMax = Number(data[maxValueField] || data.target || data.max || 100);
        } catch (err) {
            console.error("Radial chart data fetch error:", err);
            element.innerHTML = '<div class="text-danger small">Data not available</div>';
            return;
        }
    }

    const percentage = Math.min(100, Math.max(0, (currentValue / currentMax) * 100));

    // ApexCharts configuration
    const options = {
        series: [percentage],
        chart: {
            width: size,
            height: size,
            type: 'radialBar',
            sparkline: {
                enabled: true
            }
        },
        plotOptions: {
            radialBar: {
                startAngle: 0,
                endAngle: 360,
                hollow: {
                    margin: 2,
                    size: hollowSize
                },
                track: {
                    background: trackColor,
                    strokeWidth: '100%'
                },
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
        fill: {
            type: 'solid',
            colors: [currentValue > currentMax ? '#ea5455' : color]
        },
        stroke: {
            lineCap: 'round'
        },
        grid: {
            padding: {
                top: -10,
                bottom: -15,
                left: -10,
                right: -10
            }
        },
        states: {
            hover: { filter: { type: 'none' } },
            active: { filter: { type: 'none' } }
        }
    };

    if (showName && nameText) {
        options.plotOptions.radialBar.dataLabels.name.text = nameText;
    }

    try {
        const chart = new ApexCharts(element, options);
        await chart.render();
    } catch (err) {
        element.innerHTML = '<div class="text-danger small">Chart failed to load</div>';
    }
}

/**
 * Renders a stacked bar chart for total revenue trend
 */
async function renderTotalRevenueChart(config) {
    const {
        containerId,
        endpoint = null,
        seriesField = 'series',
        categoriesField = 'categories',
        xField = null,
        yField = null,
        fallbackSeries = [],
        fallbackCategories = [],
        colors = ['#7367f0', '#00cfe8'],
        height = 332,
        valuePrefix = '₹ ',
        valueSuffix = '',
        emptyMessage = 'No data available'
    } = config || {};

    if (!containerId) {
        console.warn("renderTotalRevenueChart: containerId missing");
        return;
    }

    const element = document.querySelector(`#${containerId}`);
    if (!element) {
        console.warn(`Element with id #${containerId} not found`);
        return;
    }

    let categories = fallbackCategories;
    let seriesData = fallbackSeries;

    if (endpoint) {
        try {
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            // 1. Sabse common ApexCharts format
            if (data[categoriesField] && data[seriesField]) {
                categories = Array.isArray(data[categoriesField]) ? data[categoriesField].map(String) : categories;
                seriesData = Array.isArray(data[seriesField]) ? data[seriesField] : seriesData;
            }
            // 2. Classic fallback names
            else if (data.categories && data.series) {
                categories = Array.isArray(data.categories) ? data.categories.map(String) : categories;
                seriesData = Array.isArray(data.series) ? data.series : seriesData;
            }
            // 3. Custom field names via xField / yField (array of objects)
            else if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
                if (xField && yField) {
                    categories = data.map(item => String(item[xField] ?? '–'));
                    seriesData = [{
                        name: 'Revenue',
                        data: data.map(item => Number(item[yField]) || 0)
                    }];
                }
                // Agar sirf ek field diya → guess karne ki koshish
                else if (xField) {
                    categories = data.map(item => String(item[xField] ?? '–'));
                }
            }
            // 4. Agar sirf ek array mila (series ya values)
            else if (Array.isArray(data)) {
                if (data.every(item => typeof item === 'number')) {
                    seriesData = [{ name: 'Revenue', data: data.map(Number) }];
                    categories = categories.length ? categories : data.map((_, i) => `Item ${i + 1}`);
                }
                else if (data.every(item => typeof item === 'object' && item !== null)) {
                    // Pehla key categories, baqi series maan lete hain
                    const keys = Object.keys(data[0]);
                    categories = data.map(item => String(item[keys[0]] ?? '–'));
                    seriesData = keys.slice(1).map(key => ({
                        name: key,
                        data: data.map(item => Number(item[key]) || 0)
                    }));
                }
            }
            // 5. Object jisme categories aur series ke naam kuch bhi ho sakte hain
            else if (typeof data === 'object' && data !== null) {
                // Pehla array wala key categories maan lete hain
                const catKey = Object.keys(data).find(k => Array.isArray(data[k]) && data[k].every(v => typeof v === 'string' || typeof v === 'number'));
                if (catKey) categories = data[catKey].map(String);

                // Doosra array wala key series maan lete hain
                const serKey = Object.keys(data).find(k => k !== catKey && Array.isArray(data[k]));
                if (serKey) {
                    if (Array.isArray(data[serKey][0])) {
                        seriesData = data[serKey].map((arr, i) => ({
                            name: `Series ${i + 1}`,
                            data: arr.map(Number)
                        }));
                    } else if (typeof data[serKey][0] === 'object') {
                        seriesData = data[serKey];
                    }
                }
            }

            // Final fallback
            categories = categories.length ? categories : fallbackCategories;
            seriesData = seriesData.length ? seriesData : fallbackSeries;

        } catch (err) {
            console.error('Total Revenue Fetch Error:', err);
            element.innerHTML = '<div class="text-danger small">Data load failed</div>';
            return;
        }
    }

    // Zero / empty data check
    const isEmpty = !seriesData.length ||
        seriesData.every(s => !s.data || s.data.every(v => v === 0 || isNaN(v)));

    if (isEmpty) {
        element.innerHTML = `<div class="text-center text-muted">${emptyMessage}</div>`;
        return;
    }

    // Formatter with prefix/suffix + K/M/B
    const formatValue = (val) => {
        if (typeof val !== 'number' || isNaN(val)) return valuePrefix + '0' + valueSuffix;

        const abs = Math.abs(val);
        const sign = val < 0 ? '-' : '';
        let num = abs;

        if (abs >= 1e9) num = (abs / 1e9).toFixed(1) + 'B';
        else if (abs >= 1e6) num = (abs / 1e6).toFixed(1) + 'M';
        else if (abs >= 1e3) num = (abs / 1e3).toFixed(1) + 'K';
        else num = abs.toFixed(0);

        return sign + valuePrefix + num + valueSuffix;
    };

    const options = {
        series: seriesData,
        chart: { height, type: 'bar', stacked: true, toolbar: { show: false } },
        plotOptions: {
            bar: { horizontal: false, columnWidth: '30%', borderRadius: 8 }
        },
        colors,
        dataLabels: { enabled: false },
        stroke: { width: 4, colors: ['#fff'], lineCap: 'round' },
        xaxis: {
            categories,
            labels: { style: { fontSize: '13px', fontFamily: 'Public Sans' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: formatValue,
                style: { fontSize: '13px', fontFamily: 'Public Sans' }
            }
        },
        grid: { strokeDashArray: 7, padding: { top: 0, bottom: -8, left: 20, right: 20 } },
        legend: { show: true, position: 'top', horizontalAlign: 'left', fontSize: '13px' },
        fill: { opacity: 1 },
        tooltip: { y: { formatter: formatValue } }
    };

    try {
        if (element.__apexChart) element.__apexChart.destroy();
        const chart = new ApexCharts(element, options);
        element.__apexChart = chart;
        await chart.render();
    } catch (err) {
        console.error('Render failed:', err);
        element.innerHTML = '<div class="text-danger small">Chart render failed</div>';
    }
}

/**
 * Renders browser statistics table (non-ApexCharts)
 */
function renderBrowserStatsTable(options) {
    fetch(options.endpoint)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById(options.tbodyId);
            tbody.innerHTML = "";
            data.forEach(item => {
                const visitsText = item.visits >= 1000 ?
                    (item.visits / 1000).toFixed(2) + "k" :
                    item.visits;

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

/**
 * Renders area chart for income/revenue trend
 * Supports flexible data formats using xField and yField
 */
async function renderIncomeChart(config) {
    const {
        chartSelector,
        endpoint,
        xField = null,
        yField = null,
        title = 'Monthly Revenue',
        xAxisTitle = 'Months',
        yAxisTitle = 'Revenue (Rs.)',
        valuePrefix = 'Rs. ',
        valueSuffix = '',
        colors = { primary: '#7367F0', white: '#fff' },
        height = 280,
        emptyMessage = 'No data available'
    } = config;

    if (!chartSelector || !endpoint || !xField || !yField) {
        console.error("renderIncomeChart: chartSelector, endpoint, xField and yField are required");
        return;
    }

    const chartEl = document.querySelector(chartSelector);
    if (!chartEl) return;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const rawData = await response.json();

        let categories = [];
        let values = [];

        // Flexible parsing for different data structures
        if (Array.isArray(rawData) && rawData.length > 0 && typeof rawData[0] === 'object') {
            categories = rawData.map(item => String(item[xField] ?? 'Unknown'));
            values = rawData.map(item => Number(item[yField]) || 0);
        }
        else if (rawData && (rawData.categories || rawData[xField])) {
            categories = rawData.categories || rawData[xField] || [];
            values = rawData.series || rawData[yField] || [];
        }
        else if (Array.isArray(rawData)) {
            values = rawData;
            categories = Array.from({ length: values.length }, (_, i) => `Item ${i + 1}`);
        }
        else if (typeof rawData === 'object' && rawData !== null) {
            categories = Object.keys(rawData);
            values = Object.values(rawData).map(Number);
        }

        if (categories.length === 0 || values.length === 0 || values.every(v => v === 0)) {
            chartEl.innerHTML = `<div class="text-center text-muted">${emptyMessage}</div>`;
            return;
        }

        // ApexCharts configuration
        const chartConfig = {
            series: [{ name: yAxisTitle, data: values }],
            chart: {
                height,
                type: 'area',
                toolbar: { show: false },
                parentHeightOffset: 0
            },
            title: {
                text: title,
                align: 'center',
                style: { fontSize: '16px' }
            },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            markers: {
                size: 5,
                colors: 'transparent',
                strokeColors: 'transparent',
                strokeWidth: 4,
                discrete: values.length > 0 ? [{
                    seriesIndex: 0,
                    dataPointIndex: values.length - 1,
                    fillColor: colors.white,
                    strokeColor: colors.primary,
                    size: 6,
                    radius: 8
                }] : [],
                hover: { size: 7 }
            },
            colors: [colors.primary],
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'light',
                    shadeIntensity: 0.6,
                    opacityFrom: 0.5,
                    opacityTo: 0.25,
                    stops: [0, 95, 100]
                }
            },
            grid: {
                borderColor: '#e7eef7',
                strokeDashArray: 8,
                padding: { top: -20, bottom: -8, left: 0, right: 8 }
            },
            xaxis: {
                categories,
                title: { text: xAxisTitle, style: { fontSize: '14px' } },
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { fontSize: '13px', colors: '#6e6b7b' } }
            },
            yaxis: {
                title: { text: yAxisTitle, style: { fontSize: '14px' } },
                labels: {
                    formatter: val => valuePrefix + val.toLocaleString() + valueSuffix,
                    style: { fontSize: '13px' }
                },
                min: Math.min(...values) - 5,
                max: Math.max(...values) + 5,
                tickAmount: 5
            },
            tooltip: {
                y: {
                    formatter: val => valuePrefix + val.toLocaleString() + valueSuffix
                }
            }
        };

        const chart = new ApexCharts(chartEl, chartConfig);
        await chart.render();
    } catch (error) {
        console.error('renderIncomeChart error:', error);
        chartEl.innerHTML = `<div class="text-center text-danger">Chart load failed: ${error.message}</div>`;
    }
}

/**
 * Renders a dynamic HTML table with data from API
 */
async function renderDataTable(config) {
    const {
        tableBodyId,
        endpoint,
        columns = [],
        emptyMessage = 'No data available',
        errorMessage = 'Unable to load data',
        beforeRender = null,
        afterRender = null
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