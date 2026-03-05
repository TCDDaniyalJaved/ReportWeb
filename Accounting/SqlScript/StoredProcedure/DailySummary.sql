DROP PROCEDURE DailySummary
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE DailySummary
	@MenuID Int = 1, -- 1 = TB, 2 = AA, 3 = AS
	@DateFrom1 Varchar(10) = '01-01-1990',
	@DateTo1 Varchar(10) = '12-31-2050',
	@DivisionFrom Varchar(Max) = '',
--	@DivisionTo Varchar(Max) = '',
	@AccountFrom Varchar(Max) = '',
--	@AccountTo Varchar(Max) = '',
	@GroupFrom Varchar(Max) = '',
--	@GroupTo Varchar(Max) = '',
	@cUserID int = 0,
	@Start int =0,
	@Length int =10
	With Encryption
AS

BEGIN
	SET NOCOUNT ON

	Declare	@DateFrom DateTime, @DateTo DateTime, @cTypeID int
	Set @DateFrom = Convert(DateTime , @DateFrom1)
	Set @DateTo = Convert(DateTime , @DateTo1)
	Set @cTypeID = (Select TypeID From Users Where UserID = @cUserID)
	Declare	@IncludeOpening Int = 1
	Declare	@ReportTitle VarChar(50) = ''
	Declare	@ReportType Int = 0

	--If @DivisionTo = ''
	--Begin
	--	Set @DivisionTo = @DivisionFrom
	--End

	--If @GroupTo = ''
	--Begin
	--	Set @GroupTo = @GroupFrom
	--End
	
	--If @AccountTo = ''
	--Begin
	--	Set @AccountTo = @AccountFrom
	--End
	
	Set @ReportType = (Select IsNull(MenuType,0) from Menus Where MenuID = @MenuID)

	Set @ReportTitle = (Select IsNull(MenuName,0) from Menus Where MenuID = @MenuID)

	if @ReportType = 1
	begin
		Set @IncludeOpening = 1 
		--Set @DateFrom = (Select DateFrom From Period)
		Set @DateFrom = '1/1/1990'
--		Set @ReportTitle = 'TB'
	end

	if @ReportType = 2
	begin
		Set @IncludeOpening = 0
	--	Set @ReportTitle = 'AA'
	end

	if @ReportType = 3
	begin
		Set @IncludeOpening = 1
	--	Set @DateFrom = '1/1/1990'
	end

	Select A.DivisionID, A.Date, A.AccountID, A.Debit, A.Credit
	Into #ActTrans1
	From AccountingEntries A
	Where A.Posted = 1

	If @cUserID <> 0 And @cTypeID = 1
	Begin
		Delete From #ActTrans1 Where AccountID Not In (Select  A.AccountID from  AccountOnRole A Left outer Join  UsersDetail B On A.UserID = B.UserID Where A.Lock = 1 And B.UserID = @cUserID)
	End

	--If @cUserID <> 0
	--Begin
	--	Delete From #ActTrans1 Where AccountID Not In (Select  A.AccountID from  AccountOnRole A Left outer Join  UsersDetail B On A.UserID = B.UserID Where A.Lock = 1 And B.UserID = @cUserID)
	--End

	Select 1 As Type, A.DivisionID, Null Date, A.AccountID,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) >= 0 Then (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) OPDebit,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) < 0 Then Abs(Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) OPCredit,
		0 Debit, 0 Credit
		Into #ActTrans2
		From #ActTrans1 A
		Where A.Date < @DateFrom
			And @IncludeOpening = 1
		Group By A.DivisionID, A.AccountID
		Having (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) <> 0
	Union All
	Select 2 As Type, A.DivisionID, A.Date, A.AccountID, 0 OPDebit, 0 OPCredit, A.Debit, A.Credit
		From #ActTrans1 A
		Where A.Date Between @DateFrom And @DateTo


	
	Select @ReportType MenuID, @DateFrom DateFrom, @DateTo DateTo, @ReportTitle ReportTitle, A.DivisionID, CP.Name DispDivisionName, CG.Id GroupID, IsNull(CG.Name, '<Undefine Group>') GroupName, A.AccountID, CH.Name AccountName,
		Sum(A.OPDebit) OPDebit, Sum(A.OPCredit) OPCredit, (Sum(A.OPDebit) - Sum(A.OPCredit)) OPBalance,
		--Sum(A.Debit) Debit, Sum(A.Credit) Credit,
		(Case When (Sum(A.Debit) - Sum(A.Credit)) >= 0 Then (Sum(A.Debit) - Sum(A.Credit)) Else 0 End) Debit,
		(Case When (Sum(A.Debit) - Sum(A.Credit)) < 0 Then Abs(Sum(A.Debit) - Sum(A.Credit)) Else 0 End) Credit,
		(Sum(A.OPDebit) + Sum(A.Debit)) CRDebit,
		(Sum(A.OPCredit) + Sum(A.Credit)) CRCredit, abs(Sum(A.OPDebit) - Sum(A.OPCredit)) - (Sum(A.Debit) - Sum(A.Credit)) CRBalance, E.Type
	Into #FinalTrans
	From #ActTrans2 A
	Left Outer Join Company CP On CP.Code = A.DivisionID
	Left Outer Join Chart CH On CH.Id = A.AccountID
	Left Outer Join Chart CG On CG.Id = CH.GroupID
	Left Outer Join ChartActTypes E On E.RefNo = CH.NatureID
	Where ((Case When @DivisionFrom = '' Then 0 End = 0) Or
		(Case When @DivisionFrom <> '' Then CP.Name End Between @DivisionFrom And @DivisionFrom))
	And ((Case When @AccountFrom = '' Then 0 End = 0) Or
		(Case When @AccountFrom <> '' Then CH.Name End Between @AccountFrom And @AccountFrom))
	And ((Case When @GroupFrom = '' Then 0 End = 0) Or
		(Case When @GroupFrom <> '' Then CG.Name End Between @GroupFrom And @GroupFrom))
	And @ReportType = 1
	Group By A.DivisionID, CP.Name, E.Type, CG.Id, CG.Name, A.AccountID, CH.Name
	Having (Sum(A.OPDebit) - Sum(A.OPCredit)) - (Sum(A.Debit) - Sum(A.Credit))  <> 0
	Union All
	Select @ReportType MenuID, @DateFrom DateFrom, @DateTo DateTo, @ReportTitle ReportTitle, A.DivisionID, CP.Name DispDivisionName, CG.Id GroupID, IsNull(CG.Name, '<Undefine Group>') GroupName, A.AccountID, CH.Name AccountName,
		Sum(A.OPDebit) OPDebit, Sum(A.OPCredit) OPCredit, (Sum(A.OPDebit) - Sum(A.OPCredit)) OPBalance,
		Sum(A.Debit) Debit, Sum(A.Credit) Credit,
		--(Case When (Sum(A.Debit) - Sum(A.Credit)) >= 0 Then (Sum(A.Debit) - Sum(A.Credit)) Else 0 End) Debit,
		--(Case When (Sum(A.Debit) - Sum(A.Credit)) < 0 Then Abs(Sum(A.Debit) - Sum(A.Credit)) Else 0 End) Credit,
		(Sum(A.OPDebit) + Sum(A.Debit)) CRDebit,
		(Sum(A.OPCredit) + Sum(A.Credit)) CRCredit, 
		
		((Sum(A.OPDebit) - Sum(A.OPCredit)) + (Sum(A.Debit)) - Sum(A.Credit)) CRBalance, E.Type
	From #ActTrans2 A
	Left Outer Join Company CP On CP.Code = A.DivisionID
	Left Outer Join Chart CH On CH.Id = A.AccountID
	Left Outer Join Chart CG On CG.Id = CH.GroupID
	Left Outer Join ChartActTypes E On E.RefNo = CH.NatureID
	Where ((Case When @DivisionFrom = '' Then 0 End = 0) Or
		(Case When @DivisionFrom <> '' Then CP.Name End Between @DivisionFrom And @DivisionFrom))
	And ((Case When @AccountFrom = '' Then 0 End = 0) Or
		(Case When @AccountFrom <> '' Then CH.Name End Between @AccountFrom And @AccountFrom))
	And ((Case When @GroupFrom = '' Then 0 End = 0) Or
		(Case When @GroupFrom <> '' Then CG.Name End Between @GroupFrom And @GroupFrom))
	And @ReportType <> 1
	Group By A.DivisionID, CP.Name, E.Type, CG.Id, CG.Name, A.AccountID, CH.Name
	--Having ((Sum(A.OPDebit) - Sum(A.OPCredit)) + (Sum(A.Debit)) - Sum(A.Credit)) <> 0
	Having ((Sum(A.OPDebit) - Sum(A.OPCredit)) <> 0) Or (Sum(A.Debit) - Sum(A.Credit)) <> 0


		--Select A.MenuID, A.DateFrom, A.DateTo, '' ReportTitle, A.DivisionID, A.DispDivisionName, A.GroupID, A.GroupName, A.AccountID, A.AccountName,
	--	A.OPDebit, A.OPCredit, A.OPBalance,	A.Debit, A.Credit, A.CRDebit, A.CRCredit, A.CRBalance,CH.NatureID, A.Type
	--From #FinalTrans A
	--Left Outer Join Chart CH On CH.Id = A.AccountID
	--Where CH.NatureID <> 1
	----Order By A.DispDivisionName, A.Type, A.GroupName, A.AccountName

		Select A.MenuID, A.DateFrom, A.DateTo, '' ReportTitle, A.DivisionID, A.DispDivisionName, A.GroupID, A.GroupName, A.AccountID, A.AccountName,
		A.OPDebit, A.OPCredit, A.OPBalance,	A.Debit, A.Credit, A.CRDebit, A.CRCredit, A.CRBalance
	From #FinalTrans A
	Left Outer Join Chart CH On CH.Id = A.AccountID
	Where CH.NatureID not in (1,4,17,16)
	--Order By A.DispDivisionName, A.Type, A.GroupName, A.AccountName


	Union ALl
	Select 2, @DateFrom, @DateTo, I.Name ReportTitle,A.CompanyID DivisionID,C.Name ,
	B.LocationID,L.Name, A.PartyID ,Max(CC.Name) AccountName,0,0,0 ,Round(Convert(float, Sum(B.Pcs)) / Max(B.Packing), 4) Debit,
	Sum( Round(B.Amount,2)) ExAmt, Sum( Round(B.Amount,2)) ,Sum( Round(B.Amount,2)),0


	FROM SInvoiceD B 
	Left OUter JOIN SInvoiceM A ON A.ID = B.RefID
	Left Outer Join Company C on A.CompanyID = C.Code
	Left Outer Join Item I on B.ItemID = I.ID
	Left OUter JOIN Chart CC ON A.PartyID = cc.Id
	Left OUter JOIN Unit U ON B.UnitID = U.Id
	Left OUter JOIN Location L ON B.LocationID = L.Id
	Where A.Date = @DateTo
	Group by A.CompanyID, C.Name,A.PartyID,B.LocationID, I.Name, L.Name
		Union ALl
	Select 2, @DateFrom, @DateTo, I.Name ReportTitle,A.CompanyID DivisionID,C.Name ,
	B.LocationID,L.Name, A.PartyID ,Max(CC.Name) AccountName,0,0,0 ,Round(Convert(float, Sum(B.Pcs)) / Max(B.Packing), 4) *-1 Debit,
	Sum( Round(B.Amount,2)) *-1 ExAmt, Sum( Round(B.Amount,2)) ,Sum( Round(B.Amount,2)),0


	FROM SReturnD B 
	Left OUter JOIN SReturnM A ON A.ID = B.RefID
	Left Outer Join Company C on A.CompanyID = C.Code
	Left Outer Join Item I on B.ItemID = I.ID
	Left OUter JOIN Chart CC ON A.PartyID = cc.Id
	Left OUter JOIN Unit U ON B.UnitID = U.Id
	Left OUter JOIN Location L ON B.LocationID = L.Id
	Where A.Date = @DateTo
	Group by A.CompanyID, C.Name,A.PartyID,B.LocationID, I.Name, L.Name
	Order by 7,18,9,11
	OFFSET @Start ROWS FETCH NEXT @Length ROWS ONLY;

	SET NOCOUNT OFF
END
GO
