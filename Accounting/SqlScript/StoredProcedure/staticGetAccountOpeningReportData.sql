USE webapp
GO

IF OBJECT_ID('GetAccountOpeningReportData_Static', 'P') IS NOT NULL
    DROP PROCEDURE GetAccountOpeningReportData_Static;
GO
CREATE PROCEDURE GetAccountOpeningReportData_Static
    @SearchValue NVARCHAR(100) = NULL,
    @Companyname NVARCHAR(100) = NULL,
    @OrderBy NVARCHAR(50) = NULL,  -- 'DateAsc', 'DateDesc', 'CompanyAsc'
    @Start INT = 0,
    @Length INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        m.Id,
        m.Companyname,
        m.VoucherNo,
        m.Date,
        m.Voucher,
        45 as Amount,
        m.TotalSeqNo,
        d.TotalDebit,
        d.Credit AS DetailCredit,
        m.Remarks,
        d.Accounts AS LedgerName,
        m.Debit,
        m.Credit
    FROM AccountOpeningMView m
    INNER JOIN AccountOpeningDView d ON m.Id = d.PersonID
    WHERE
        (@SearchValue IS NULL OR
         m.Voucher LIKE '%' + @SearchValue + '%' OR
         d.Accounts LIKE '%' + @SearchValue + '%')
      AND (@Companyname IS NULL OR m.Companyname = @Companyname)
    ORDER BY
        CASE WHEN @OrderBy = 'Companyname' THEN m.Companyname END ASC,
        CASE WHEN @OrderBy = 'DateAsc' THEN m.Date END ASC,
        CASE WHEN @OrderBy = 'DateDesc' OR @OrderBy IS NULL THEN m.Date END DESC
    OFFSET @Start ROWS FETCH NEXT @Length ROWS ONLY;
END

go
