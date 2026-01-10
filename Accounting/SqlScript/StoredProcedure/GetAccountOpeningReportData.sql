USE webapp
GO

IF OBJECT_ID('GetAccountOpeningReportData', 'P') IS NOT NULL
    DROP PROCEDURE GetAccountOpeningReportData;
GO

CREATE PROCEDURE GetAccountOpeningReportData
    @SearchValue NVARCHAR(100) = NULL,
    @GroupByOrder NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Default ordering
    DECLARE @OrderBy NVARCHAR(MAX) = 'm.Date DESC';

    -- If a custom order is specified, use it
    IF @GroupByOrder IS NOT NULL
    BEGIN
        IF CHARINDEX('Companyname', @GroupByOrder) > 0 SET @OrderBy = 'm.Companyname';
        IF CHARINDEX('Date', @GroupByOrder) > 0 SET @OrderBy = 'm.Date';
        IF CHARINDEX('Voucher', @GroupByOrder) > 0 SET @OrderBy = 'm.Voucher';
        IF CHARINDEX('TotalSeqNo', @GroupByOrder) > 0 SET @OrderBy = 'm.TotalSeqNo';
    END

    -- Main query with simplified conditions
    SELECT 
        m.Id,
        CONVERT(date, m.Date) AS Date,
        m.Remarks AS MasterRemarks,
        m.BookCode,
        m.Companyname,
        45 AS Amount,
        m.VoucherNo,
        m.MCode,
        m.Voucher,
        m.CompanyID,
        m.Book,
        m.Debit AS MasterDebit,
        m.Credit AS MasterCredit,
        m.TotalSeqNo,
        m.InputType,
        m.Accounts AS MasterAccounts,
        m.Prefix,
        d.Accounts AS LedgerName,
        d.TotalDebit,
        d.Credit AS DetailCredit,
        d.Debit AS DetailDebit,
        d.Remarks AS DetailRemarks,
        d.Cheque,
        d.UserID,
        d.PersonID
    FROM AccountOpeningMView m
    INNER JOIN AccountOpeningDView d ON m.Id = d.PersonID
    WHERE 
        (@SearchValue IS NULL OR
         m.Voucher LIKE '%' + @SearchValue + '%' OR
         CAST(m.TotalSeqNo AS NVARCHAR) LIKE '%' + @SearchValue + '%' OR
         m.Companyname LIKE '%' + @SearchValue + '%' OR
         CAST(m.Debit AS NVARCHAR) LIKE '%' + @SearchValue + '%' OR
         CONVERT(NVARCHAR, m.Date, 120) LIKE '%' + @SearchValue + '%')
    ORDER BY 
        CASE WHEN @OrderBy = 'm.Companyname' THEN m.Companyname END,
        CASE WHEN @OrderBy = 'm.Date' THEN m.Date END,
        CASE WHEN @OrderBy = 'm.Voucher' THEN m.Voucher END,
        CASE WHEN @OrderBy = 'm.TotalSeqNo' THEN m.TotalSeqNo END;
END
GO