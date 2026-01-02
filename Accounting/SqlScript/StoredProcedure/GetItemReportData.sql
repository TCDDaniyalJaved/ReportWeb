USE webapp;
GO

-- Agar procedure pehle se exist karta hai, to delete kar do
IF OBJECT_ID('GetItemReportData', 'P') IS NOT NULL
    DROP PROCEDURE GetItemReportData;
GO

-- Procedure create kar rahe hain
CREATE PROCEDURE GetItemReportData
   @SearchValue NVARCHAR(100) = NULL 
AS
BEGIN
    SELECT 
        m.Id,
        m.Name,
        m.Description,
        m.Status,
        d.Name AS CategoryName
    FROM Item m
    INNER JOIN Category d ON m.CategoryID = d.Id
    WHERE @SearchValue IS NULL
       OR m.Name LIKE '%' + @SearchValue + '%'
       OR m.Status LIKE '%' + @SearchValue + '%'
       OR m.Description LIKE '%' + @SearchValue + '%'
       OR d.Name LIKE '%' + @SearchValue + '%';
END
GO
