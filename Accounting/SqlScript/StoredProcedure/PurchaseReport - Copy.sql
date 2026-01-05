DROP PROCEDURE IF EXISTS PurchaseReport
GO

CREATE PROCEDURE PurchaseReport
(
    @DateFrom DATE = '1990-01-01',
    @DateTo   DATE = '2050-12-31',
    @DivisionName VARCHAR(100) = NULL,
    @AccountName  VARCHAR(100) = NULL,
    @ItemName     VARCHAR(100) = NULL,
    @GroupMode TINYINT = 1
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        -- ===== GROUP COLUMNS =====
        CASE WHEN @GroupMode IN (1,4,5) THEN CC.Name END AS Company,
        CASE WHEN @GroupMode IN (2,4,5) THEN A.Date END AS TranDate,
        CASE WHEN @GroupMode IN (3,5)   THEN IM.Name END AS ItemName,

        -- ===== AGGREGATES =====
        SUM(B.Quantity)   AS TotalQty,
        SUM(B.Amount)     AS TotalAmount,
        SUM(B.NetAmount)  AS NetAmount,
        COUNT(*)          AS TotalRows
    FROM PPInvoiceM A
    INNER JOIN PPInvoiceD B ON A.ID = B.RefID
    LEFT JOIN Chart C   ON A.PartyID = C.Id
    LEFT JOIN Item IM  ON B.ItemID = IM.ID
    LEFT JOIN Unit U   ON IM.UnitID = U.ID
    LEFT JOIN Company CC ON A.CompanyID = CC.Code
    WHERE
        A.Date BETWEEN @DateFrom AND @DateTo
        AND (@DivisionName IS NULL OR CC.Name = @DivisionName)
        AND (@AccountName  IS NULL OR C.Name = @AccountName)
        AND (@ItemName     IS NULL OR IM.Name = @ItemName)
    GROUP BY
        CASE WHEN @GroupMode IN (1,4,5) THEN CC.Name END,
        CASE WHEN @GroupMode IN (2,4,5) THEN A.Date END,
        CASE WHEN @GroupMode IN (3,5)   THEN IM.Name END
    ORDER BY
        Company,
        TranDate,
        ItemName;

END
GO
