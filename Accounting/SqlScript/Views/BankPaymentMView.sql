USE [WebApp]
GO

/****** Object:  View [dbo].[BankPaymentMView]    Script Date: 12-13-2025 4:34:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[BankPaymentMView]
AS
/*
Select A.Id,  Convert(date,Max(A.VDate)) Date, IsNull(Max(A.Remarks),'') Remarks, Max(A.BookCode) BookCode,
		IsNull(Max(A.VoucherNo),'') VoucherNo, Max(A.MCode) MCode, A.Voucher, IsNull(A.CompanyID,0) CompanyID, Max(C.Name) Book, Sum(IsNull(B.Amount,0)) Amount,
		COUNT(B.PersonID) TotalSeqNo, ISNULL(Max(A.InputType),'') InputType
From BankPaymentM A 
Left Outer Join BankPaymentD B on A.Id = B.PersonID
		--And A.UserID = B.UserID
Left Outer Join Chart C on A.BookCode = C.Id
Group By A.CompanyID,A.Id, A.Voucher
Union All
Select A.Id,  Convert(date,Max(A.VDate)) Date, IsNull(Max(A.Remarks),'') Remarks, 0 BookCode,
		IsNull(Max(A.VoucherNo),'') VoucherNo, Max(A.MCode) MCode, A.Voucher, IsNull(A.CompanyID,0) CompanyID, Max(C.Name) Book, Sum(IsNull(B.Amount,0)) Amount,
		COUNT(B.PersonID) TotalSeqNo, ISNULL(Max(A.InputType),'') InputType
From BankPaymentM A 
Left Outer Join BankPaymentD B on A.Id = B.PersonID
		--And A.UserID = B.UserID
Left Outer Join Chart C on A.BookCode = C.Id
Group By A.CompanyID,A.Id, A.Voucher
*/
Select A.Id,  Convert(date,A.VDate) Date, IsNull(A.Remarks,'') Remarks, A.BookCode BookCode, 
		Format(A.VDate,'yyyy-MM-dd') VoucherNo, A.MCode MCode, A.Voucher, IsNull(A.CompanyID,0) CompanyID, C.Name Book, IsNull(B.Amount,0) Amount,
		1 TotalSeqNo, A.InputType InputType, Case When IsNull(A.Posted,0) = 1 then 'Posted' else 'Un-Posted' End PO, B.Cheque, A.Posted, CC.Prefix
From BankPaymentM A 
Left Outer Join BankPaymentD B on A.Id = B.PersonID
		--And A.UserID = B.UserID
Left Outer Join Chart C on B.ActCode = C.Id
left Outer Join Company CC on A.CompanyID = CC.Code

--Union All

--Select A.Id,  Convert(date,A.VDate) Date, IsNull(A.Remarks,'') Remarks, 0 BookCode,
--		Format(A.VDate,'yyyy-MM-dd') VoucherNo, A.MCode MCode, A.Voucher, IsNull(A.CompanyID,0) CompanyID, C.Name Book, IsNull(B.Amount,0) Amount,
--		1 TotalSeqNo, A.InputType InputType, Case When IsNull(A.Posted,0) = 1 then 'Posted' else 'Un-Posted' End PO,B.Cheque, A.Posted
--From BankPaymentM A 
--Left Outer Join BankPaymentD B on A.Id = B.PersonID
--		--And A.UserID = B.UserID
--Left Outer Join Chart C on B.ActCode = C.Id


GO


