USE [WebApp]
GO

/****** Object:  View [dbo].[BankReceiptDView]    Script Date: 12-13-2025 12:56:58 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE VIEW [dbo].[BankReceiptDView]
AS

Select A.*,  CC.Name Accounts, IsNull(C.Name,'') CostCenterName
from BankReceiptD A
Left Outer Join Chart CC On A.ActCode = CC.Id
Left Outer Join Chart C On A.CostID = C.Id

GO


























