DROP PROCEDURE [CustomerProfileReport]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [CustomerProfileReport]
	@DateFrom1 Varchar(10) = '01-01-1990',
	@DateTo1 Varchar(10) = '12-31-2050',
	@SPersonFrom Varchar(Max) = '',
	@SPersonTo Varchar(Max) = '',
	@AccountFrom Varchar(Max) = '',
	@AccountTo Varchar(Max) = '',
	@Start INT = 0,
    @Length INT = 10
	With Encryption
AS

BEGIN
	SET NOCOUNT ON

	Declare @DateFrom DateTime, @DateTo DateTime
	Set @DateFrom = Convert(DateTime , @DateFrom1)
	Set @DateTo = Convert(DateTime , @DateTo1)
	--Declare @DateFrom DateTime = Convert(DateTime,  @DateFrom1)
	--Declare @DateTo DateTime = Convert(DateTime, Convert(DateTime, Convert(Date, DateAdd(s, -1, DateAdd(mm, DateDiff(m, 0, @DateTo1) + 1, 0)))))
	Declare @QntyRnd Int = 0
	
	  If @SPersonTo = ''
		Begin
			Set @SPersonTo = @SPersonFrom
		End
		
		If @AccountTo = ''
		Begin
			Set @AccountTo = @AccountFrom
		End

	Select A.Name, S.Name SPerson, A.Address, A.Phone, A.Fax, A.Email, A.Descript, A.NTNNo , G.Name GroupName, N.Name Nature
    from Chart A
    Left Outer join Chart S On A.SPersonID = S.id
    Left Outer join Chart G On A.GroupID = G.id
    Left Outer join ChartActTypes N On A.NatureID = N.RefNo
	Where
		 ((Case When @AccountFrom = '' Then 0 End = 0) Or
			(Case When @AccountFrom <> '' Then A.Name End Between @AccountFrom And @AccountTo))
		And ((Case When @SPersonFrom = '' Then 0 End = 0) Or
			(Case When @SPersonFrom <> '' Then S.Name End Between @SPersonFrom And @SPersonTo)) 
		And A.NatureID = 1 And A.TypeID = 2
	Group By  A.Name, S.Name, A.Address, A.Phone, A.Fax, A.Email, A.Descript, A.NTNNo, G.Name, N.Name
	 ORDER BY A.Name 
	OFFSET @Start ROWS FETCH NEXT @Length ROWS ONLY;
	

	SET NOCOUNT OFF
END
GO
