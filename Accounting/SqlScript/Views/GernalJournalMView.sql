USE [WebApp]
GO

/****** Object:  View [dbo].[GernalJournalMView]    Script Date: 12-13-2025 6:34:54 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[GernalJournalMView]
AS 

Select A.Id,  Convert(date,Max(A.VDate)) Date, IsNull(Max(A.Remarks),'') Remarks, Max(A.BookCode) BookCode,CM.Name as Companyname,
		IsNull(Max(A.VoucherNo),'') VoucherNo, Max(A.MCode) MCode, A.Voucher, IsNull(A.CompanyID,0) CompanyID, Max(C.Name) Book, Sum(IsNull(B.Debit,0)) Debit, Sum(IsNull(B.Credit,0)) Credit,
		COUNT(B.PersonID) TotalSeqNo, ISNULL(Max(A.InputType),'') InputType ,'accounts' AS Accounts  ,CM.Prefix
From GernalJournalM A 
Left Outer Join GernalJournalD B on A.Id = B.PersonID
--	And A.UserID = B.UserID
Left Outer Join Chart C on A.BookCode = C.Id
--LEFT OUTER JOIN Chart CC ON B.ActCode = CC.Id
left outer join Company CM on A.CompanyID=CM.Code
Group By A.CompanyID,A.Id, A.Voucher,CM.Name,CM.Prefix,B.Debit
Order by A.CompanyID,2, A.Voucher OFFSET 0 ROWS;


--Select A.Id,  Convert(date,Max(A.VDate)) Date, IsNull(Max(A.Remarks),'') Remarks, Max(A.BookCode) BookCode,
--		IsNull(Max(A.VoucherNo),'') VoucherNo, Max(A.MCode) MCode, A.Voucher, CM.Name as CompanyID, Max(C.Name) Book, Sum(IsNull(B.Debit,0)) Debit, Sum(IsNull(B.Credit,0)) Credit,
--		COUNT(B.PersonID) TotalSeqNo, ISNULL(Max(A.InputType),'') InputType,CC.Name AS Accounts
--From GernalJournalM A 
--Left Outer Join AccountOpeningD B on A.Id = B.PersonID
----	And A.UserID = B.UserID
--Left Outer Join Chart C on A.BookCode = C.Id
--LEFT OUTER JOIN Chart CC ON B.ActCode = CC.Id
--left outer join Company CM on A.CompanyID=CM.Code
--Group By A.CompanyID,A.Id, A.Voucher,CC.Name,CM.Name
--Order by A.CompanyID,2, A.Voucher OFFSET 0 ROWS;















GO


