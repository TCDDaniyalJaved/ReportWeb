USE webapp
GO

IF OBJECT_ID('GetAccountOpeningReportData', 'P') IS NOT NULL
    DROP PROCEDURE GetAccountOpeningReportData;
GO

CREATE PROCEDURE GetAccountOpeningReportData
    @SearchValue NVARCHAR(100) = NULL,
    @OrderBy NVARCHAR(500) = 'm.Date DESC'  -- Default order (tumhara purana order)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Sql NVARCHAR(MAX);

    SET @Sql = N'
    SELECT
        m.Id,
        CONVERT(DATE, m.Date) AS Date,
        m.Remarks AS MasterRemarks,
        m.BookCode,
        m.Companyname,
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
        @SearchValue IS NULL OR
        m.Voucher LIKE ''%'' + @SearchValue + ''%'' OR
        CAST(m.TotalSeqNo AS NVARCHAR(50)) LIKE ''%'' + @SearchValue + ''%'' OR
        CAST(m.Date AS NVARCHAR(50)) LIKE ''%'' + @SearchValue + ''%'' OR
        m.Companyname LIKE ''%'' + @SearchValue + ''%'' OR
        CAST(m.Debit AS NVARCHAR(50)) LIKE ''%'' + @SearchValue + ''%'' OR
        CONVERT(NVARCHAR(50), m.Date, 120) LIKE ''%'' + @SearchValue + ''%''
    ORDER BY ' + @OrderBy + ';';

    EXEC sp_executesql @Sql,
        N'@SearchValue NVARCHAR(100)',
        @SearchValue;
END
GO