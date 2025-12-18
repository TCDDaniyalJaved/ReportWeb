USE [WebApp]
GO

/****** Object:  View [dbo].[CashPaymentMView]    Script Date: 12-15-2025 3:42:55 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- Check if the view exists, drop it if it does
IF EXISTS (SELECT * FROM sys.views WHERE name = 'CashPaymentMView')
BEGIN
    DROP VIEW [dbo].[CashPaymentMView]
    PRINT 'Existing view dropped.'
END
GO

-- Create the new view
CREATE VIEW [dbo].[CashPaymentMView]
AS
SELECT 
    C.Id,
    Convert(Date, C.Date) AS Date,
    N.Name AS Clientname,
    C.Subtotal AS Total,
    C.Subtotal AS Balance,
    Convert(Date, C.Date) AS due_date,
    C.InvoiceNumber as Voucher, 
    CC.Prefix,
    1 AS action
FROM CashPaymentM C
LEFT OUTER JOIN Chart N ON N.id = C.PartyID
LEFT OUTER JOIN Company CC ON CC.Code = C.DivisionID
GO

-- Success message after view creation
SELECT 'Operation completed successfully. The view [dbo].[CashPaymentMView] is now available.' AS Message

GO
