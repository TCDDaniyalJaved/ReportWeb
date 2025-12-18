USE [WebApp]
GO

/****** Object:  View [dbo].[GernalJournalDView]    Script Date: 12-13-2025 6:34:43 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[GernalJournalDView]
AS

SELECT 
    CC.Name AS Accounts,
    GM.Voucher,
    SUM(A.Debit) AS TotalDebit ,A.Credit,A.Debit,A.Remarks,A.Cheque,A.UserID,A.PersonID
FROM GernalJournalD A
LEFT OUTER JOIN Chart CC ON A.ActCode = CC.Id
LEFT OUTER JOIN GernalJournalM GM ON A.PersonID = GM.Id
GROUP BY CC.Name, GM.Voucher,A.Credit,A.Debit,A.Remarks,A.Cheque,A.UserID,A.PersonID







--select * from GernalJournalD






GO


