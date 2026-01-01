USE webapp
IF OBJECT_ID('GetAccountOpeningReportData', 'P') IS NOT NULL
    DROP PROCEDURE GetAccountOpeningReportData;
GO
CREATE PROCEDURE GetAccountOpeningReportData
   @SearchValue NVARCHAR(100) = NULL 
AS
BEGIN
 
    SELECT 
        m.Id,
        Convert(Date, m.Date) Date,
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
        m.Voucher LIKE '%' + @SearchValue + '%' OR
        CAST(m.TotalSeqNo AS NVARCHAR) LIKE '%' + @SearchValue + '%' OR
        CAST(m.Date AS NVARCHAR) LIKE '%' + @SearchValue + '%' OR
        CAST(m.Companyname AS NVARCHAR) LIKE '%' + @SearchValue + '%' OR
        CAST(m.Debit AS NVARCHAR) LIKE '%' + @SearchValue + '%' OR
        CONVERT(NVARCHAR, m.Date, 120) LIKE '%' + @SearchValue + '%'
    ORDER BY m.Date DESC
END