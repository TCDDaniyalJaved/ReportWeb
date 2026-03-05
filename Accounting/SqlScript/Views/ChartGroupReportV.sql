

/****** Object:  View [dbo].[ChartGroupReportV]    Script Date: 2/17/2018 6:00:19 PM ******/
DROP VIEW [dbo].[ChartGroupReportV]
GO

/****** Object:  View [dbo].[ChartGroupReportV]    Script Date: 2/17/2018 6:00:19 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO






CREATE VIEW [dbo].[ChartGroupReportV]
AS

SELECT        0 ID, '' Name, 1 TypeID
Union All
SELECT        A.ID, A.Name, A.TypeID
FROM            Chart A
Where A.TypeID = 1 And A.GroupID <> 0
order by Name OFFSET 0 ROWS;








GO


