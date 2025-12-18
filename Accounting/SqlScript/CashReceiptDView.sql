USE [WebApp]
GO

/****** Object:  View [dbo].[CashReceiptDView]    Script Date: 12-15-2025 3:48:51 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE VIEW [dbo].[CashReceiptDView]
AS

select 
  C.Id ,C.Refid,C.Description, N.Name AccountName , C.Amount
	from CashReceiptD  C
left outer join Chart N on N.id =C.Accountid

GO


