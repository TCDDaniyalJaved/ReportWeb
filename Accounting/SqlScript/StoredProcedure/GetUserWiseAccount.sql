
/****** Object:  StoredProcedure [dbo].[GetUserWiseAccount]    Script Date: 2/17/2018 6:05:10 PM ******/
DROP PROCEDURE [dbo].[GetUserWiseAccount]
GO

/****** Object:  StoredProcedure [dbo].[GetUserWiseAccount]    Script Date: 2/17/2018 6:05:10 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO







CREATE PROCEDURE [dbo].[GetUserWiseAccount]
@cUserID int = 0,
@NatureID int = 0
	
	
AS
--- 100 = Purchase Input ,101 Sales , 102 GatePass


with Temp1 (ID ,Name)
as
(
SELECT 0 ID, '' Name
--Where 2 = (Select TypeID from USers Where UserID = @cUserID)
Union All
SELECT  A.ID, A.Name
FROM  dbo.Chart A
Where  TypeID = 2 And NatureID In(1,2,9,3,10)
And 100 = @NatureID
--And ID  In (Select A.AccountID from  AccountOnRole A Left outer Join  UsersDetail B On A.USerID = B.USerID Where A.Lock = 1 And B.UserID = @cUserID)
Union All
SELECT  A.ID, A.Name  Name
FROM  dbo.Chart A
Left Outer Join Chart C on A.SPersonID = C.ID
Where  A.TypeID = 2 And A.NatureID not In (2, 3, 4, 6, 7, 8, 12, 13, 14, 16, 17, 18, 19, 20, 22, 23)
And  101 = @NatureID
--And ID  In (Select A.AccountID from  AccountOnRole A Left outer Join  UsersDetail B On A.USerID = B.USerID Where A.Lock = 1 And B.UserID = @cUserID)
Union All
SELECT  A.ID, A.Name
FROM  dbo.Chart A
Where  TypeID = 2
And 102 = @NatureID
--And ID  In (Select A.AccountID from  AccountOnRole A Left outer Join  UsersDetail B On A.USerID = B.USerID Where A.Lock = 1 And B.UserID = @cUserID)
Union All
SELECT  A.ID, A.Name
FROM  dbo.Chart A
Where  A.TypeID = 2 And A.NatureID In (2, 3, 23)
And 103 = @NatureID
Union All
SELECT  A.ID, A.Name
FROM  dbo.Chart A
Where  A.TypeID = 2 --And A.NatureID Not In (1, 9)
And 104 = @NatureID
Union All
Select ID,Name From Chart Where 
 ((Case When @NatureID = 0 Then 0 End = 0) Or
		(Case When @NatureID <> 0 Then NatureID End = @NatureID))
		And  TypeID =2
Union All
SELECT  A.ID, A.Name  Name
FROM  dbo.Chart A
Left Outer Join Chart C on A.SPersonID = C.ID
Where  A.TypeID = 2 And A.NatureID = 1 And A.GroupID = 10032
And  105 = @NatureID
)


Select ID ,Name
From Temp1 A

Order by Name



GO


