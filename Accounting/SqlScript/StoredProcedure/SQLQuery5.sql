USE webapp
GO

IF OBJECT_ID('GetAccountOpeningReportData', 'P') IS NOT NULL
    DROP PROCEDURE GetAccountOpeningReportData;
GO

CREATE PROCEDURE GetAccountOpeningReportData
(
    @SearchValue NVARCHAR(100) = NULL,
    @GroupMode TINYINT = 1
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        -- Group columns (NULL jab use nahi honge)
        CASE WHEN @GroupMode IN (1,4,5) THEN m.Companyname END AS Company,
        CASE WHEN @GroupMode IN (2,4,5) THEN CONVERT(DATE, m.Date) END AS TranDate,
        CASE WHEN @GroupMode IN (3,5)   THEN m.Voucher END AS Voucher,

        -- Detail data
        m.Id,
        m.Remarks AS MasterRemarks,
        m.BookCode,
        m.VoucherNo,
        m.MCode,
        m.CompanyID,
        m.Book,
        m.TotalSeqNo,
        m.InputType,
        m.Accounts AS MasterAccounts,
        m.Prefix,

        d.Accounts AS LedgerName,
        d.Remarks AS DetailRemarks,
        d.Cheque,
        d.UserID,
        d.PersonID,

        -- Aggregates (group level)
        SUM(m.Debit)  AS TotalDebit,
        SUM(m.Credit) AS TotalCredit
    FROM AccountOpeningMView m
    INNER JOIN AccountOpeningDView d 
        ON m.Id = d.PersonID
    WHERE
        @SearchValue IS NULL OR
        m.Voucher LIKE '%' + @SearchValue + '%' OR
        m.Companyname LIKE '%' + @SearchValue + '%' OR
        CAST(m.TotalSeqNo AS NVARCHAR(50)) LIKE '%' + @SearchValue + '%'
    GROUP BY
        CASE WHEN @GroupMode IN (1,4,5) THEN m.Companyname END,
        CASE WHEN @GroupMode IN (2,4,5) THEN CONVERT(DATE, m.Date) END,
        CASE WHEN @GroupMode IN (3,5)   THEN m.Voucher END,

        -- Required for non-aggregated columns
        m.Id, m.Remarks, m.BookCode, m.VoucherNo, m.MCode,
        m.CompanyID, m.Book, m.TotalSeqNo, m.InputType,
        m.Accounts, m.Prefix,
        d.Accounts, d.Remarks, d.Cheque, d.UserID, d.PersonID
    ORDER BY
        Company,
        TranDate,
        Voucher;
END
GO
