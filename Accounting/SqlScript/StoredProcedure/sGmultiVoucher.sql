USE WebApp
GO

/****** Object:  StoredProcedure [dbo].[AccountOpeningVoucher]    Script Date: 2/17/2018 6:07:17 PM ******/
DROP PROCEDURE [dbo].[AccountOpeningVoucher]
GO

/****** Object:  StoredProcedure [dbo].[AccountOpeningVoucher]    Script Date: 2/17/2018 6:07:17 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO












CREATE PROCEDURE [dbo].[AccountOpeningVoucher]
	@CompanyID int = 0,
	@Id int = 0
AS
	
	
	Select A.Id Code, Voucher RefNo, Convert(DateTime,A.VDate) Date, B.ActCode AccountID, CC.Name AccountName, B.Remarks [Description] , B.Debit,B.Credit, 0 SeqNo, A.InputType, Co.Name DisplayCompany
from AccountOpeningM A
Left Outer join  AccountOpeningD B On A.Id = B.PersonID
Left Outer join  Chart C On A.BookCode = C.Id
Left Outer join  Chart CC On B.ActCode = CC.Id
Left Outer Join Company Co On A.CompanyID = Co.Code
Where A.CompanyID = @CompanyID And A.Id = @Id --And A.BookCode <> B.ActCode
	


	









GO


