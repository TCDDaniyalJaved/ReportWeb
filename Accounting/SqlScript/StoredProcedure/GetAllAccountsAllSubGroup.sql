

/****** Object:  StoredProcedure [dbo].[GetAllAccountsAllSubGroup]    Script Date: 2/17/2018 6:05:10 PM ******/
DROP PROCEDURE [dbo].[GetAllAccountsAllSubGroup]
GO

/****** Object:  StoredProcedure [dbo].[GetAllAccountsAllSubGroup]    Script Date: 2/17/2018 6:05:10 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO







CREATE PROCEDURE [dbo].[GetAllAccountsAllSubGroup]
	@NatureID int = 0
AS
	
	WITH HierarchalRecords (ID, Name, Name2, Descript, NatureID, GroupID, TypeID,[Address],Phone,Fax,Email,NTNNO,GSTNO,SPersonID)
	AS
	(
		SELECT P.ID, CAST(P.[Name] AS VARCHAR(1000)) Name,
			P.Name2, P.Descript, P.NatureID, P.GroupID, P.TypeID,
			P.[Address],P.Phone,P.Fax,P.Email,P.NTNNO,P.GSTNO, P.SPersonID
		FROM Chart P
		WHERE P.GroupID = 0
		UNION ALL
		SELECT C.ID, CAST(P.Name + ' :: ' + C.Name AS VARCHAR(1000)) Name,
			P.Name2, C.Descript, C.NatureID, C.GroupID, C.TypeID,
			C.[Address],C.Phone,C.Fax,C.Email,C.NTNNO,C.GSTNO, C.SPersonID
		FROM Chart C
		JOIN HierarchalRecords P
		ON C.GroupID = P.ID		
	)

	


	SELECT HR.*, AN.Name NatureName, ATT.Name TypeName, IsNull(CATT.Name,'') SPersonName
	FROM HierarchalRecords HR
	LEFT OUTER JOIN ChartActTypes AN ON AN.RefNo = HR.NatureID
	LEFT OUTER JOIN Dropdown ATT ON ATT.Id = HR.TypeID
	LEFT OUTER JOIN Chart CATT ON CATT.Id = HR.SPersonID
--	WHERE HR.NatureID = CASE WHEN @NatureID = 0 Then HR.NatureID Else @NatureID End
	WHERE AN.PageNo = CASE WHEN @NatureID = 0 Then AN.PageNo Else @NatureID End
	--ORDER BY HR.Name




GO


