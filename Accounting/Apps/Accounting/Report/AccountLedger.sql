

CREATE OR ALTER PROCEDURE sp_LedgerReport
(
    @CompanyId   INT,
    @AccountId   INT,
    @Status      VARCHAR(20),  -- 'All', 'DebitOnly', 'CreditOnly'
    @FromDate    DATE,
    @ToDate      DATE
)
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH LedgerData AS
    (
        SELECT
            l.Date,
            l.VoucherNo,
            l.Narration,
            l.Debit,
            l.Credit
        FROM Ledger l
        WHERE 
            l.CompanyId = @CompanyId
            AND l.AccountId = @AccountId
            AND l.Date BETWEEN @FromDate AND @ToDate
    ),

    Filtered AS
    (
        SELECT *
        FROM LedgerData
        WHERE
            (@Status = 'All')
            OR (@Status = 'DebitOnly' AND Debit > 0)
            OR (@Status = 'CreditOnly' AND Credit > 0)
    )

    SELECT 
        *,
        SUM(Debit - Credit) OVER (ORDER BY Date, VoucherNo ROWS UNBOUNDED PRECEDING) AS RunningBalance
    FROM Filtered
    ORDER BY Date, VoucherNo;
END
