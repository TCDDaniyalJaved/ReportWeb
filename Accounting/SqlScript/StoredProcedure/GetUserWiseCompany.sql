use WebApp
/****** Object:  StoredProcedure [dbo].[GetUserWiseCompany]    Script Date: 2/17/2018 6:05:10 PM ******/
DROP PROCEDURE [dbo].[GetUserWiseCompany]
GO

/****** Object:  StoredProcedure [dbo].[GetUserWiseCompany]    Script Date: 2/17/2018 6:05:10 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO







CREATE PROCEDURE [dbo].[GetUserWiseCompany]
@cUserID int = 0
	
	
AS
--- 100 = Purchase Input ,101 Sales , 102 GatePass
Declare @TypeID int
Set @TypeID = (Select IsNull(TypeID, 0) From Users Where UserID = @cUserID);

with Temp1 (ID ,Name)
as
(

SELECT  A.Code ID, A.Name /*+ Space(1) + '(' + IsNull(A.Branch, '-') + ')'*/ Name
FROM  dbo.Company A
Where Code  In (Select A.CompanyID from  AccountOnRole A Left outer Join  UsersDetail B On A.USerID = B.USerID Where A.Lock = 1 And B.UserID = @cUserID)

)

Select 0 Code, '' Name
Where @TypeID <> 1 And (Select Count(ID) From Temp1) > 1
Union All
Select ID Code,Name
From Temp1 A

Order by Name









GO

