// Month-wise debit pie chart
renderPieChart({
    containerId: "monthpiechart",
    chartTitle: "Month Wise Debit",
    endpoint: "/Dashboards/getalldatamonth",
    labelField: "month",
    valueField: "totalDebit",
    valuePrefix: "Rs. ",
    colors: ["#FF9800", "#F44336", "#9C27B0", "#2196F3", "#4CAF50"]
});

// Ledger-wise debit & credit bar chart
renderGroupedBarChart({
    containerId: "ledgerChart",
    chartTitle: "Ledger-wise Debit & Credit",
    endpoint: "/Dashboards/getalldata",
    xField: "accounts",
    seriesConfig: [
        { name: "Debit", field: "totalDebit", color: "#2196F3" },
        { name: "Credit", field: "credit", color: "#F44336" }
    ],
    valuePrefix: "Rs. ",
    height: 420
});

// Ledger-wise debit & credit duplicate/main chart
renderGroupedBarChart({
    containerId: "ledgerChart1",
    chartTitle: "Ledger-wise Debit & Credit",
    endpoint: "/Dashboards/getalldata",
    xField: "accounts",
    seriesConfig: [
        { name: "Debit", field: "totalDebit", color: "#2196F3" },
        { name: "Credit", field: "credit", color: "#F44336" }
    ],
    valuePrefix: "Rs. ",
    height: 420
});

// Company-wise horizontal bar chart
renderGroupedBarChart({
    containerId: "companyChart",
    chartTitle: "Company-wise Debit & Credit",
    endpoint: "/Dashboards/getall",
    xField: "companyname",
    seriesConfig: [
        { name: "Debit", field: "debit", color: "#4CAF50" },
        { name: "Credit", field: "credit", color: "#FF5252" }
    ],
    horizontal: true,
    height: 420,
    valuePrefix: "Rs. ",
    yAxisTitle: "Company"
});

// Voucher type stacked bar chart
renderGroupedBarChart({
    containerId: "voucherChart",
    chartTitle: "Voucher Type-wise Summary",
    endpoint: "/Dashboards/getalldata",
    xField: "voucher",
    seriesConfig: [
        { name: "Debit", field: "debit", color: "#FF9800" },
        { name: "Credit", field: "credit", color: "#607D8B" }
    ],
    stacked: true,
    height: 420,
    valuePrefix: "Rs. "
});
renderRevenueBarChart({
    containerId: 'weekrevenueChart',
    data: {
        categories: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        series: [40, 95, 60, 45, 90, 50, 75],
        colors: ['#7367f0', '#7367f0', '#7367f0', '#7367f0', '#28c76f', '#7367f0', '#7367f0']
    }
});



// Account-wise debit pie chart
renderPieChart({
    containerId: "companyChart1",
    chartTitle: "Account Wise Debit",
    endpoint: "/Dashboards/getAllData",
    labelField: "accounts",
    valueField: "totalDebit",
    valuePrefix: "Rs. ",
    colors: ["#FF9800", "#F44336", "#9C27B0", "#2196F3", "#4CAF50"]
});

// Monthly debit & credit trend chart
renderGroupedBarChart({
    containerId: "monthlyTrendChart",
    chartTitle: "Monthly Debit & Credit Trend",
    endpoint: "/Dashboards/getalldatamonth",
    xField: "month",
    seriesConfig: [
        { name: "Debit", field: "totalDebit", color: "#2196F3" },
        { name: "Credit", field: "totalCredit", color: "#F44336" }
    ],
    valuePrefix: "Rs. ",
    height: 380,
    yAxisTitle: "Debit Credit"
});

// Current month overview donut charts
renderOrderStatisticsChart({
    containerId: "orderStatisticsChart",
    chartTitle: "Order Statistics",
    endpoint: "/Dashboards/GetOrderStatistics",
    colors: ['#71DC37', '#696CFF', '#8491A2', '#03C2EB'],
    height:200,
    width: 200,
    centerLabel: 'Weekly',
});
renderOrderStatisticsChart({
    containerId: "orderStatisticsChart1",
    chartTitle: "Order Statistics",
    endpoint: "/Dashboards/GetOrderStatistics",
    colors: ['#00E396', '#008FFB', '#FEB019', '#FF4560'],
    height: 300,
    width: 300,
    centerLabel: 'Weekly'
});

renderTotalRevenueChart({
    containerId: 'RevenueChart',
    endpoint: '/Dashboards/GetTotalRevenue',
    colors: [config.colors.primary, config.colors.info]
});

// Weekly expense radial mini chart
renderRadialMiniChart({
    containerId: "weeklyExpenseRadial",
    endpoint: "/Dashboards/GetWeeklyExpenseSummary",
    valueField: "currentExpense",
    maxValueField: "target",
    prefix: "",
    size: 70,
    hollowSize: "45%",
    strokeWidth: 10,
    nameText: "Spent",
    showName: false
});

renderDataTable({
    tableBodyId: 'browserStatsBody',
    endpoint: '/Dashboards/GetBrowserStats',
    columns: [
        {
            field: 'no'
        },
        {
            field: 'name',
            formatter: (value, row) => `
                  <div class="d-flex align-items-center">
                      <img src="/img/icons/brands/${row.icon}" height="24" class="me-3">
                      <span class="text-heading">${value}</span>
                  </div>
              `
        },
        {
            field: 'visits',
            formatter: val =>
                val >= 1000 ? (val / 1000).toFixed(2) + 'k' : val
        },
        {
            field: 'percentage',
            formatter: (val, row) => `
                  <div class="d-flex justify-content-between align-items-center gap-4">
                      <div class="progress w-100" style="height:10px;">
                          <div class="progress-bar ${row.color}"
                               style="width:${val}%"></div>
                      </div>
                      <small class="fw-medium">${val}%</small>
                  </div>
              `
        }
    ]
});


renderDataTable({
    tableBodyId: 'WindowsOpeartingStatsBody',
    endpoint: '/Dashboards/GetOperatingSystemStats',
    columns: [
        {
            field: 'no'
        },
        {
            field: 'name',
            formatter: (value, row) => `
                  <div class="d-flex align-items-center">
                      <img src="/img/icons/brands/${row.icon}" height="24" class="me-3">
                      <span class="text-heading">${value}</span>
                  </div>
              `
        },
        {
            field: 'visits',
            formatter: val =>
                val >= 1000 ? (val / 1000).toFixed(2) + 'k' : val
        },
        {
            field: 'percentage',
            formatter: (val, row) => `
                  <div class="d-flex justify-content-between align-items-center gap-4">
                      <div class="progress w-100" style="height:10px;">
                          <div class="progress-bar ${row.color}"
                               style="width:${val}%"></div>
                      </div>
                      <small class="fw-medium">${val}%</small>
                  </div>
              `
        }
    ]
});


renderDataTable({
    tableBodyId: 'CountryStatsBody',
    endpoint: '/Dashboards/GetCountryStats',
    columns: [
        {
            field: 'no'
        },
        {
            field: 'name',
            formatter: (value, row) => `
                  <div class="d-flex align-items-center">
                      <img src="/img/icons/brands/${row.icon}" height="24" class="me-3">
                      <span class="text-heading">${value}</span>
                  </div>
              `
        },
        {
            field: 'visits',
            formatter: val =>
                val >= 1000 ? (val / 1000).toFixed(2) + 'k' : val
        },
        {
            field: 'percentage',
            formatter: (val, row) => `
                  <div class="d-flex justify-content-between align-items-center gap-4">
                      <div class="progress w-100" style="height:10px;">
                          <div class="progress-bar ${row.color}"
                               style="width:${val}%"></div>
                      </div>
                      <small class="fw-medium">${val}%</small>
                  </div>
              `
        }
    ]
});