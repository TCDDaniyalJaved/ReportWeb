CREATE VIEW vw_TotalRevenue AS
SELECT 
    RevenueYear AS [Year],
    MonthName,
    Amount,
    MonthOrder
FROM YearlyRevenue;


