use webapp

IF OBJECT_ID('GetAccountOpeningReportData', 'P') IS NOT NULL
    DROP PROCEDURE GetAccountOpeningReportData;
GO

CREATE PROCEDURE GetAccountOpeningReportData
    @VoucherNo      NVARCHAR(100) = NULL,
    @CompanyName    NVARCHAR(100) = NULL,
    @DateFrom       DATE = NULL,
    @DateTo         DATE = NULL,
    @MCode          NVARCHAR(50) = NULL,
    @BookCode       NVARCHAR(50) = NULL,
    @Book           NVARCHAR(100) = NULL,        -- naya filter
    @TotalSeqNo     INT = NULL,                  -- naya filter (exact ya range ke liye From/To bhi bana sakte hain)
    @AmountFrom     DECIMAL(18,2) = NULL,        -- Master Debit/Credit ke liye range
    @AmountTo       DECIMAL(18,2) = NULL,
    @SearchValue    NVARCHAR(100) = NULL,        -- global search
    @OrderByColumn  NVARCHAR(50) = 'Date',       -- allowed: Date, VoucherNo, Companyname, TotalSeqNo
    @OrderByDir     NVARCHAR(4) = 'DESC'         -- ASC or DESC
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        m.Id,
        CONVERT(VARCHAR(10), m.Date, 23) AS Date,
        m.Remarks AS MasterRemarks,
        m.BookCode,
        m.Companyname,
        m.VoucherNo,
        m.MCode,
        45 AS Amount,
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
        (@VoucherNo IS NULL OR m.Voucher LIKE '%' + @VoucherNo + '%')
        AND (@CompanyName IS NULL OR m.Companyname LIKE '%' + @CompanyName + '%')
        AND (@DateFrom IS NULL OR m.Date >= @DateFrom)
        AND (@DateTo IS NULL OR m.Date <= @DateTo)
        AND (@MCode IS NULL OR m.MCode LIKE '%' + @MCode + '%')
        AND (@BookCode IS NULL OR m.BookCode LIKE '%' + @BookCode + '%')
        AND (@Book IS NULL OR m.Book LIKE '%' + @Book + '%')                      -- naya
        AND (@TotalSeqNo IS NULL OR m.TotalSeqNo = @TotalSeqNo)                   -- naya (exact match)
        AND (@AmountFrom IS NULL OR m.Debit >= @AmountFrom OR m.Credit >= @AmountFrom)  -- naya
        AND (@AmountTo IS NULL OR m.Debit <= @AmountTo OR m.Credit <= @AmountTo)        -- naya
        AND (@SearchValue IS NULL OR (
            m.Voucher LIKE '%' + @SearchValue + '%' OR
            CAST(m.TotalSeqNo AS NVARCHAR(50)) LIKE '%' + @SearchValue + '%' OR
            m.Companyname LIKE '%' + @SearchValue + '%' OR
            CAST(m.Debit AS NVARCHAR(50)) LIKE '%' + @SearchValue + '%' OR
            CAST(m.Credit AS NVARCHAR(50)) LIKE '%' + @SearchValue + '%' OR
            CONVERT(NVARCHAR(50), m.Date, 120) LIKE '%' + @SearchValue + '%'
        ))
    ORDER BY
        CASE WHEN @OrderByColumn = 'Date' AND @OrderByDir = 'DESC' THEN m.Date END DESC,
        CASE WHEN @OrderByColumn = 'Date' AND @OrderByDir = 'ASC' THEN m.Date END ASC,
        CASE WHEN @OrderByColumn = 'VoucherNo' AND @OrderByDir = 'DESC' THEN m.VoucherNo END DESC,
        CASE WHEN @OrderByColumn = 'VoucherNo' AND @OrderByDir = 'ASC' THEN m.VoucherNo END ASC,
        CASE WHEN @OrderByColumn = 'Companyname' AND @OrderByDir = 'DESC' THEN m.Companyname END DESC,
        CASE WHEN @OrderByColumn = 'Companyname' AND @OrderByDir = 'ASC' THEN m.Companyname END ASC,
        CASE WHEN @OrderByColumn = 'TotalSeqNo' AND @OrderByDir = 'DESC' THEN m.TotalSeqNo END DESC,
        CASE WHEN @OrderByColumn = 'TotalSeqNo' AND @OrderByDir = 'ASC' THEN m.TotalSeqNo END ASC,
        m.Date DESC  -- default fallback
    ;
END
GO