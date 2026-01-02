DROP PROCEDURE IF EXISTS [PurchaseReport]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [PurchaseReport]
    @DateFrom1 Varchar(10) = '01-01-1990',  -- mm-dd-yyyy
    @DateTo1 Varchar(10) = '12-31-2050',    -- mm-dd-yyyy
    @DivisionFrom Varchar(Max) = '',
    @AccountFrom Varchar(Max) = '',
    @ItemFrom Varchar(Max) = '',
    @CategoryFrom Varchar(Max) = '',
    @LocationFrom Varchar(Max) = ''
WITH ENCRYPTION
AS
BEGIN
    SET NOCOUNT ON;

    -- Convert date parameters safely using mm-dd-yyyy format
    DECLARE @DateFrom DateTime, @DateTo DateTime;
    SET @DateFrom = CONVERT(DateTime, @DateFrom1, 101);  -- 101 = mm/dd/yyyy
    SET @DateTo   = CONVERT(DateTime, @DateTo1, 101);

    -- Get Division info
    DECLARE @DivisionID int, @MDivisionID int, @MDivision VarChar(100);
    SELECT @DivisionID = Code FROM Company WHERE Name = @DivisionFrom;
    SELECT @MDivisionID = Code, @MDivision = Name FROM Company WHERE Code = @DivisionID;

    -- Fetch Purchase Invoice details
    SELECT 
        A.InputType AS SInputType, 
        A.CompanyID, 
        A.PartyID, 
        CONVERT(DateTime, A.Date) AS InvDate, 
        RIGHT('000000' + CONVERT(VARCHAR(6), A.RefNo), 6) AS RefNo, 
        NULL AS STaxNo, 
        '' AS RefID, 
        B.ItemId, 
        B.Pcs, 
        B.Quantity AS Qnty, 
        B.Quantity AS Qnty2, 
        B.Unit, 
        B.Rate, 
        ROUND(B.Amount, 2) AS ExAmt, 
        B.Packing,
        B.ComPerc,
        B.CommAmt,
        B.NetAmount,
        0 AS TaxAmount,
        0 AS TaxAmt2,
        0 AS WhTaxAmount
    INTO #CurSales1
    FROM PPInvoiceD B
    LEFT OUTER JOIN PPInvoiceM A ON A.ID = B.RefID;

    -- Final Select with filters
    SELECT 
        A.SInputType, 
        RIGHT('000000' + CONVERT(VARCHAR(6), A.CompanyID), 6) AS CompanyID, 
        CC.Name AS CompanyName, 
        C.Name AS PartyName, 
        A.InvDate, 
        A.RefNo, 
        A.STaxNo, 
        '' AS RefID,    
        IM.Name AS ItemName,        
        A.Pcs, 
        A.Qnty, 
        A.Qnty2, 
        UU.Name AS Unit, 
        A.Rate, 
        A.ExAmt, 
        0 AS TaxAmt, 
        A.TaxAmt2,
        0 AS WHTax,
        A.NetAmount AS InAmt,
        A.Packing,
        A.ComPerc,
        A.CommAmt,
        A.NetAmount,
        2 AS QntyRnd
    FROM #CurSales1 A
    LEFT OUTER JOIN Chart C ON A.PartyID = C.Id
    LEFT OUTER JOIN Item IM ON IM.ID = A.ItemID
    LEFT OUTER JOIN Unit UU ON IM.UnitID = UU.ID
    LEFT OUTER JOIN Company CC ON A.CompanyID = CC.Code
    WHERE A.InvDate BETWEEN @DateFrom AND @DateTo
      AND ((@DivisionFrom = '') OR (CC.Name = @DivisionFrom))
      AND ((@AccountFrom = '') OR (C.Name = @AccountFrom))
      AND ((@ItemFrom = '') OR (IM.Name = @ItemFrom))
    ORDER BY A.RefNo;

    SET NOCOUNT OFF;
END
GO