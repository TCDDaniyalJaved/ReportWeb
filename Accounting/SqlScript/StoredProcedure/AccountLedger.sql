DROP PROCEDURE AccountLedger
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE AccountLedger
	@MenuID Int = 0,
	@DateFrom1 Varchar(10) = '01-01-1990',
	@DateTo1 Varchar(10) = '12-31-2050',
	@DivisionFrom Varchar(Max) = '',
	--@DivisionTo Varchar(Max) = '',
	@AccountFrom Varchar(Max) = '',
	@AccountTo Varchar(Max) = '',
	@AmountTypeFrom Varchar(Max) = 'Both',
--	@AmountTypeTo Varchar(Max) = 'Both',
	@IncludeOpeningFrom Varchar(Max) = 'YES',
--	@IncludeOpeningTo Varchar(Max) = 'YES',
	@ReportSummaryTo Varchar(Max) = 'Detail',
	@cUserID int = 0,
	@SearchValue Varchar(Max) = NULL ,
	@OrderBy NVARCHAR(50) = NULL, -- New parameter
	@Start INT = 0,
    @Length INT = 10

	With Encryption
AS

BEGIN
	SET NOCOUNT ON

	Declare	@DateFrom DateTime, @DateTo DateTime, @cTypeID int
	Set @DateFrom = Convert(DateTime , @DateFrom1)
	Set @DateTo = Convert(DateTime , @DateTo1)
	Set @cTypeID = (Select TypeID From Users Where UserID = @cUserID)

	--If @DivisionTo = ''
	--Begin
	--	Set @DivisionTo = @DivisionFrom
	--End

	--If @AccountTo = ''
	--Begin
	--	Set @AccountTo = @AccountFrom
	--End

	Select A.*
	Into #ActTrans1
	From AccountingEntries A
	Where A.Posted in(1,0)

	if @ReportSummaryTo = 'Detail'
	Begin

	 Delete from #ActTrans1 Where InputType = 'SI' And Posted = 1
	End
	else
	Begin
	Delete from #ActTrans1 Where InputType = 'SI' And Posted = 0

	End


	If @cUserID <> 0 And @cTypeID = 1
	Begin
		Delete From #ActTrans1 Where AccountID Not In (Select  A.AccountID from  AccountOnRole A Left outer Join  UsersDetail B On A.USerID = B.USerID Where A.Lock = 1 And B.UserID = @cUserID)
	End


	--If @cUserID <> 0
	--Begin
	--	Delete From #ActTrans1 Where AccountID Not In (Select  A.AccountID from  AccountOnRole A Left outer Join  UsersDetail B On A.USerID = B.USerID Where A.Lock = 1 And B.UserID = @cUserID)
	--End

	/*And ((Case When @GroupFrom = '' Then 0 End = 0) Or
		(Case When @GroupFrom <> '' Then HR.AccountName End Like '%' + @GroupFrom + '%'))
	And ((Case When @DivisionFrom = '' Then 0 End = 0) Or
		(Case When @DivisionFrom <> '' Then A.Division End Between @DivisionFrom And @DivisionFrom))*/

	/*If @DivisionFrom = ''
	Begin
		Update #ActTrans1 Set DivisionID = 1, Division = 'MERGE COMPANIES'
	End*/

	Select A.Code, A.VoucherNo, A.Date, A.ChqNo, A.ChqDate, A.ChqStatus, A.AccountID AccountID, B.Name AccountName,
		A.Description, A.Debit, A.Credit, A.SeqNo, A.InputType, A.OppName, B.GroupID, A.DivisionID, A.Division,
		A.DepartmentID, Null DepartmentName, A.Description2, A.FlockID, A.FlockName, A.VehicleNo, A.ItemName,
		A.Quantity, A.Pcs, A.Less, A.AvgWt, A.GrossWt, A.AdjWt, A.NetWt, A.Rate,A.CurrentDate, A.CreateDate
	Into #ActTrans2
	From #ActTrans1 A
	Left Outer Join Chart B On B.Id = A.AccountID
	Left Outer Join Chart BG On BG.Id = B.GroupID
	Left Outer Join ChartActTypes C On C.RefNo = B.NatureID
	Where ((Case When @DivisionFrom = '' Then 0 End = 0) Or
		(Case When @DivisionFrom <> '' Then A.Division End Between @DivisionFrom And @DivisionFrom))
	And ((Case When @AccountFrom = '' Then 0 End = 0) Or
		(Case When @AccountFrom <> '' Then B.Name End Between @AccountFrom And @AccountFrom))
	And ((Case When @AccountTo = '' Then 0 End = 0) Or
		(Case When @AccountTo <> '' Then BG.Name End Between @AccountTo And @AccountTo))
		And ((@SearchValue IS NULL) OR
		(A.VoucherNo LIKE '%' + @SearchValue + '%') OR
		(B.Name LIKE '%' + @SearchValue + '%')OR
		(A.OppName LIKE '%' + @SearchValue + '%'))

	--Update #ActTrans2 Set DepartmentID = Null, DepartmentName = Null Where @DepartmentFrom = '' And Date < @DateFrom
		
	Select 1 As Type, Null Code, Null VoucherNo, Null Date, Null ChqNo, Null ChqDate, Null ChqStatus, A.AccountID,
		A.AccountName, Null Description,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) >= 0 Then (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) Debit,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) < 0 Then Abs(Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) Credit,
		0 SeqNo, Null InputType, 'Balance B/F As of: ' + Convert(Varchar(20) , @DateFrom ,107) OppName, (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) OppBalance,
		A.GroupID, A.DivisionID, A.Division, Null DepartmentID, Null DepartmentName,
		Null Description2, Null FlockID, Null FlockName, Null VehicleNo, Null ItemName, Null Quantity, Null Pcs, Null Less, Null AvgWt, Null GrossWt, Null AdjWt, Null NetWt, Null Rate,Max(A.CurrentDate) CurrentDate,
		Null CreateDate
		Into #ActTrans3
		From #ActTrans2 A
		Where A.Date < @DateFrom And @IncludeOpeningFrom = 'YES'
--			And (Case When @IncludeOpening = 'YES' Then 0 End = 0)
		Group By A.AccountID, A.AccountName, A.GroupID, A.DivisionID, A.Division--, A.DepartmentID, A.DepartmentName
		--Having (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) <> 0
	Union All
	Select 2 As Type, A.Code, A.VoucherNo, A.Date, A.ChqNo, A.ChqDate, A.ChqStatus, A.AccountID, A.AccountName, A.Description,
		IsNull(A.Debit, 0) Debit, IsNull(A.Credit, 0) Credit, A.SeqNo, A.InputType, A.OppName, 0 OppBalance, A.GroupID, A.DivisionID, A.Division,
		A.DepartmentID, A.DepartmentName,
		A.Description2, A.FlockID, A.FlockName, A.VehicleNo, A.ItemName, A.Quantity, A.Pcs, A.Less, A.AvgWt, A.GrossWt, A.AdjWt, A.NetWt, A.Rate,A.CurrentDate, A.CreateDate
		From #ActTrans2 A
		Where A.Date Between @DateFrom And @DateTo
	
	Select A.AccountID,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) >= 0 Then (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) SumDebit,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) < 0 Then Abs(Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) SumCredit
		Into #ActTrans4
		From #ActTrans3 A
		Group By A.AccountID



		Select C.Id GroupID, /*IsNull(D.GroupID, -1) + ' - ' +*/ IsNull(C.Name, '<Undefine Group>') GroupName,
			A.Type, A.VoucherNo, A.Date, A.ChqNo, A.ChqDate, A.ChqStatus, A.AccountID, C2.Name AccountName, A.Description,
			Upper(A.OppName) OppName, Sum(A.Debit) Debit, Sum(A.Credit) Credit, A.SeqNo, A.InputType, Sum(A.OppBalance) OppBalance, Null ReferenceNo,
			A.Division DispDivisionName, A.DivisionID, 1 Period,
			Max(B.SumDebit) SumDebit, Max(B.SumCredit) SumCredit,
			A.Description2, A.FlockID, A.FlockName, A.VehicleNo, A.ItemName, A.Quantity, A.Pcs, A.Less, A.AvgWt, A.GrossWt, A.AdjWt, A.NetWt, A.Rate,A.CurrentDate
			From #ActTrans3 A
			Left Outer Join #ActTrans4 B On B.AccountID = A.AccountID
			Left Outer Join Chart C On C.Id = A.GroupID
			Left Outer Join Chart C2 On C2.Id = A.AccountID
			Left Outer Join ChartActTypes E On E.RefNo = C2.NatureID
			Group By A.Type, A.VoucherNo, A.Date, A.ChqNo, A.ChqDate, A.ChqStatus, A.AccountID, A.AccountName, A.Description,
				A.SeqNo, A.InputType, A.OppName, C.Id, C.Name, C2.Name, A.DivisionID, A.Division, A.DepartmentID, A.DepartmentName,
				A.Description2, A.FlockID, A.FlockName, A.VehicleNo, A.ItemName, A.Quantity, A.Pcs, A.Less, A.AvgWt, A.GrossWt, A.AdjWt, A.NetWt, A.Rate,A.CurrentDate, A.CreateDate
			Having ((Case When @AmountTypeFrom = 'DEBIT ONLY' Then Sum(A.Debit) End <> 0) OR
				(Case When @AmountTypeFrom = 'CREDIT ONLY' Then Sum(A.Credit) End <> 0) OR
				(Case When @AmountTypeFrom = 'BOTH' Then 0 End = 0))
			ORDER BY
			    CASE WHEN @OrderBy = 'Groupname' THEN C.Name END ASC,
				CASE WHEN @OrderBy = 'Accountname' THEN C2.Name END ASC,
				CASE WHEN @OrderBy = 'OppName' THEN A.OppName END ASC
		 OFFSET @Start ROWS FETCH NEXT @Length ROWS ONLY;

	SET NOCOUNT OFF
END
GO
