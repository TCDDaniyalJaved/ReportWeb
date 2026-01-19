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
