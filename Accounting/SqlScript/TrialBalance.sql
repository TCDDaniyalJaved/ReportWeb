use WebApp
DROP PROCEDURE TrialBalanceReport
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE TrialBalanceReport
	@MenuID Int = 0,
	@DateFrom1 Varchar(10) = '01-01-1990',
	@DateTo1 Varchar(10) = '12-31-2050',
	@DivisionFrom Varchar(Max) = '',
	@DivisionTo Varchar(Max) = '',
	@AccountFrom Varchar(Max) = '',
	@AccountTo Varchar(Max) = '',
	@cUserID int = 0,
	@IsSummmary Tinyint = 1
	
AS

	--SET @tableHTML =   N'<th style="font-weight: bold"></th>'
	Declare	@DateFrom DateTime, @DateTo DateTime
	Set @DateFrom = Convert(DateTime , @DateFrom1)
	Set @DateTo = Convert(DateTime , @DateTo1)

	If @DivisionTo = ''
	Begin
		Set @DivisionTo = @DivisionFrom
	End

	If @AccountTo = ''
	Begin
		Set @AccountTo = @AccountFrom
	End

	Select A.*
	Into #ActTrans1
	--From RPTTrialBalance A
  From TrialBalance A




	Select 1 Code, A.VoucherNo, A.Date, A.ChqNo, A.ChqDate, A.ChqStatus, A.AccountID AccountID, A.AccountName,
		A.Description, A.Debit, A.Credit, A.SeqNo, A.InputType, A.OppName, A.GroupID, A.DivisionID, A. Division,
		Null DepartmentID, Null DepartmentName, A.Description2, A.FlockID, A.FlockName, A.VehicleNo, A.ItemName,
		A.Quantity, A.Pcs, A.Less, A.AvgWt, A.GrossWt, A.AdjWt, A.NetWt, A.Rate,A.CurrentDate
	Into #ActTrans2
	From #ActTrans1 A
	--Left Outer Join Chart B On B.Id = A.AccountID
	--Left Outer Join Chart BG On BG.Id = B.GroupID
	--Left Outer Join ChartActTypes C On C.RefNo = B.NatureID




	Where ((Case When @DivisionFrom = '' Then 0 End = 0) Or
		(Case When @DivisionFrom <> '' Then A.Division End Between @DivisionFrom And @DivisionFrom))
	And ((Case When @AccountFrom = '' Then 0 End = 0) Or
		(Case When @AccountFrom <> '' Then A.AccountName End Between @AccountFrom And @AccountTo))

		
	If @AccountFrom = '' And @IsSummmary <> 1
	Begin
		Delete From #ActTrans2
	End
	--Update #ActTrans2 Set DepartmentID = Null, DepartmentName = Null Where @DepartmentFrom = '' And Date < @DateFrom
		
	Select 1 As Type, Null Code, Null VoucherNo, Null Date, Null ChqNo, Null ChqDate, Null ChqStatus, A.AccountID,
		A.AccountName, 'Balance B/F As of: ' + Convert(Varchar(20) , @DateFrom ,107) Description,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) >= 0 Then (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) Debit,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) < 0 Then Abs(Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) Credit,
		0 SeqNo, Null InputType, 'Balance B/F As of: ' + Convert(Varchar(20) , @DateFrom ,107) OppName, (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) OppBalance,
		A.GroupID, A.DivisionID, A.Division, Null DepartmentID, Null DepartmentName,
		Null Description2, Null FlockID, Null FlockName, Null VehicleNo, Null ItemName, Null Quantity, Null Pcs, Null Less, Null AvgWt, Null GrossWt, Null AdjWt, Null NetWt, Null Rate,Max(A.CurrentDate) CurrentDate
		Into #ActTrans3
		From #ActTrans2 A
		Where A.Date < @DateFrom And @IsSummmary <> 1
--			And (Case When @IncludeOpening = 'YES' Then 0 End = 0)
		Group By A.AccountID, A.AccountName, A.GroupID, A.DivisionID, A.Division--, A.DepartmentID, A.DepartmentName
		--Having (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) <> 0
	Union All
	Select 2 As Type, A.Code, A.VoucherNo, A.Date, A.ChqNo, A.ChqDate, A.ChqStatus, A.AccountID, A.AccountName, A.Description,
		IsNull(A.Debit, 0) Debit, IsNull(A.Credit, 0) Credit, A.SeqNo, A.InputType, A.OppName, 0 OppBalance, A.GroupID, A.DivisionID, A.Division,
		A.DepartmentID, A.DepartmentName,
		A.Description2, A.FlockID, A.FlockName, A.VehicleNo, A.ItemName, A.Quantity, A.Pcs, A.Less, A.AvgWt, A.GrossWt, A.AdjWt, A.NetWt, A.Rate, --A.CurrentDate
		Cast(DateAdd(dd, 0, DateDiff(dd, 0, A.Date)) + Space(1) + DateAdd(Day, - DateDiff(Day, 0, A.CurrentDate), A.CurrentDate) As DateTime)
		From #ActTrans2 A
		Where A.Date Between @DateFrom And @DateTo And @IsSummmary <> 1
	Union All
	Select 1 As Type, Null Code, Null VoucherNo, Max(A.Date) Date, Null ChqNo, Null ChqDate, Null ChqStatus, A.AccountID,
		A.AccountName, Null Description,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) >= 0 Then (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) Debit,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) < 0 Then Abs(Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) Credit,
		0 SeqNo, Null InputType, Null OppName, (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) OppBalance,
		A.GroupID, A.DivisionID, A.Division, Null DepartmentID, Null DepartmentName,
		Null Description2, Null FlockID, Null FlockName, Null VehicleNo, Null ItemName, Null Quantity, Null Pcs, Null Less, Null AvgWt, Null GrossWt, Null AdjWt, Null NetWt, Null Rate,Max(A.CurrentDate) CurrentDate
		From #ActTrans2 A
		Where A.Date <= @DateTo And @IsSummmary = 1
		Group By A.AccountID, A.AccountName, A.GroupID, A.DivisionID, A.Division--, A.DepartmentID, A.DepartmentName
		Having (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) <> 0
		
	Select T.*, Row_Number() Over (Order By T.AccountID, T.CurrentDate) RowNum Into #ActTrans31 From #ActTrans3 T
			
	Select A.AccountID,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) >= 0 Then (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) SumDebit,
		(Case When (Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) < 0 Then Abs(Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Else 0 End) SumCredit
		Into #ActTrans4
		From #ActTrans31 A
		Group By A.AccountID


		Update #ActTrans31 Set Debit = Null Where Debit = 0
		Update #ActTrans31 Set Credit = Null Where Credit = 0

		--Delete From RPTTrialBalance
		--Insert Into RPTTrialBalance
		Select C.Id GroupID, /*IsNull(D.GroupID, -1) + ' - ' +*/ IsNull(C.Name, '<Undefine Group>') + ' :: ' + C2.Name GroupName,
			A.Type, A.VoucherNo, A.Date, A.ChqNo, A.ChqDate, A.ChqStatus, A.AccountID, /*'HTMLLINK' + */ C2.Name AccountName, Upper(A.OppName)Description,
			Upper(A.OppName) OppName, Convert(Float,Sum(A.Debit)) Debit, Convert(Float,Sum(A.Credit)) Credit, Convert(int, A.RowNum) SeqNo, A.InputType, Convert(Float,Sum(A.OppBalance)) OppBalance, Null ReferenceNo,
			A.Division DispDivisionName, A.DivisionID, 1 Period,
			Convert(Float,Max(B.SumDebit)) SumDebit, Convert(Float,Max(B.SumCredit)) SumCredit,
			A.Description2, A.FlockID, A.FlockName, A.VehicleNo, A.ItemName, A.Quantity, A.Pcs, A.Less, A.AvgWt, A.GrossWt, A.AdjWt, A.NetWt, A.Rate,A.CurrentDate,
			Convert(Float,Sum(Sum(IsNull(A.Debit, 0)) - Sum(IsNull(A.Credit, 0))) Over (Order By A.RowNum)) Balance
			--Into RPTTrialBalance
			Into #Final
			From #ActTrans31 A
			Left Outer Join #ActTrans4 B On B.AccountID = A.AccountID
			Left Outer Join Chart C On C.Id = A.GroupID
			Left Outer Join Chart C2 On C2.Id = A.AccountID
			Left Outer Join ChartActTypes E On E.RefNo = C2.NatureID
			Group By A.Type, A.VoucherNo, A.Date, A.ChqNo, A.ChqDate, A.ChqStatus, A.AccountID, A.AccountName, A.Description,
				A.SeqNo, A.InputType, A.OppName, C.Id, C.Name, C2.Name, A.DivisionID, A.Division, A.DepartmentID, A.DepartmentName,
				A.Description2, A.FlockID, A.FlockName, A.VehicleNo, A.ItemName, A.Quantity, A.Pcs, A.Less, A.AvgWt, A.GrossWt, A.AdjWt, A.NetWt, A.Rate,A.CurrentDate,
				A.RowNum
              Union All
	Select 1 GroupID, /*IsNull(D.GroupID, -1) + ' - ' +*/ IsNull(C.Name, '<Undefine Group>') + ' :: ' + C2.Name  GroupName,
			1 Type, '' VoucherNo, Null Date, Null ChqNo, Null ChqDate, Null ChqStatus, A.AccountID,  'TOTAL ' AccountName, 'TOTAL' Description,
			Null OppName, Convert(Float,Sum(A.Debit)) Debit, Convert(Float,Sum(A.Credit))  Credit, 99999999 SeqNo, Null InputType, Null  OppBalance, Null ReferenceNo,
			A.Division DispDivisionName, A.DivisionID, 1 Period,
			sum(B.SumDebit) SumDebit, sum(B.SumCredit) SumCredit,
			Null Description2, Null FlockID, Null FlockName, Null VehicleNo, Null ItemName, Null Quantity, Null Pcs, Null Less, Null AvgWt, Null GrossWt, Null AdjWt, Null NetWt, Null Rate, Null CurrentDate,
			Null Balance
			From #ActTrans31 A
			Left Outer Join #ActTrans4 B On B.AccountID = A.AccountID
			Left Outer Join Chart C On C.Id = A.GroupID
			Left Outer Join Chart C2 On C2.Id = A.AccountID
			Left Outer Join ChartActTypes E On E.RefNo = C2.NatureID
			Where @IsSummmary = 0
			Group By C.Id, C.Name, C2.Name, A.DivisionID, A.Division, A.AccountID, A.AccountName --, A.Type
	
		Union All
		Select Null GroupID, IsNull(C.Name, '<Undefine Group>') GroupName,
			0 Type, Null VoucherNo, Null Date, Null ChqNo, Null ChqDate, Null ChqStatus, C.Id AccountID, IsNull(C.Name, '<Undefine Group>') AccountName, Null Description,
			Null OppName, Null Debit, Null Credit, C.Id SeqNo, Null InputType, Null  OppBalance, Null ReferenceNo,
			A.Division DispDivisionName, A.DivisionID, 1 Period,
			Max(B.SumDebit) SumDebit, Max(B.SumCredit) SumCredit,
			Null Description2, Null FlockID, Null FlockName, Null VehicleNo, Null ItemName, Null Quantity, Null Pcs, Null Less, Null AvgWt, Null GrossWt, Null AdjWt, Null NetWt, Null Rate, Null CurrentDate,
			Null Balance
			From #ActTrans31 A
			Left Outer Join #ActTrans4 B On B.AccountID = A.AccountID
			Left Outer Join Chart C On C.Id = A.GroupID
			Left Outer Join Chart C2 On C2.Id = A.AccountID
			Left Outer Join ChartActTypes E On E.RefNo = C2.NatureID
			Where @IsSummmary = 1
			Group By C.Id, C.Name, A.DivisionID, A.Division
		Union All
		Select  Null GroupID, IsNull(C.Name, '<Undefine Group>') + ' TOTAL AMOUNT' GroupName,
			2 Type, Null VoucherNo, Null Date, Null ChqNo, Null ChqDate, Null ChqStatus, C.Id AccountID, 'TOTAL AMOUNT' AccountName, Null Description,
			Null OppName, Sum(A.Debit) Debit, Sum(A.Credit) Credit, C.Id + 999999 SeqNo, Null InputType, Null  OppBalance, Null ReferenceNo,
			A.Division DispDivisionName, A.DivisionID, 1 Period,
			Max(B.SumDebit) SumDebit, Max(B.SumCredit) SumCredit,
			Null Description2, Null FlockID, Null FlockName, Null VehicleNo, Null ItemName, Null Quantity, Null Pcs, Null Less, Null AvgWt, Null GrossWt, Null AdjWt, Null NetWt, Null Rate, Null CurrentDate,
			Null Balance
			From #ActTrans31 A
			Left Outer Join #ActTrans4 B On B.AccountID = A.AccountID
			Left Outer Join Chart C On C.Id = A.GroupID
			Left Outer Join Chart C2 On C2.Id = A.AccountID
			Left Outer Join ChartActTypes E On E.RefNo = C2.NatureID
			Where @IsSummmary = 1
			Group By C.Id, C.Name, A.DivisionID, A.Division
			
		Union All
		Select Null GroupID, 'ZZZZZ DIFFERENCE ZZZZZ' GroupName,
			3 Type, Null VoucherNo, Null Date, Null ChqNo, Null ChqDate, Null ChqStatus, 9999998 AccountID, 'DIFFERENCE' AccountName, Null Description,
			Null OppName, Case When Sum(A.Debit) - Sum(A.Credit) < 0 Then Sum(A.Debit) - Sum(A.Credit) Else Null End Debit, Case When Sum(A.Debit) - Sum(A.Credit) > 0 Then Abs(Sum(A.Debit) - Sum(A.Credit)) Else Null End Credit, 9999998 SeqNo, Null InputType, Null  OppBalance, Null ReferenceNo,
			A.Division DispDivisionName, A.DivisionID, 1 Period,
			Max(B.SumDebit) SumDebit, Max(B.SumCredit) SumCredit,
			Null Description2, Null FlockID, Null FlockName, Null VehicleNo, Null ItemName, Null Quantity, Null Pcs, Null Less, Null AvgWt, Null GrossWt, Null AdjWt, Null NetWt, Null Rate, Null CurrentDate,
			Null Balance
			From #ActTrans31 A
			Left Outer Join #ActTrans4 B On B.AccountID = A.AccountID
			Left Outer Join Chart C On C.Id = A.GroupID
			Left Outer Join Chart C2 On C2.Id = A.AccountID
			Left Outer Join ChartActTypes E On E.RefNo = C2.NatureID
			Where @IsSummmary = 1
			Group By A.DivisionID, A.Division
			Having Sum(A.Debit) - Sum(A.Credit) <> 0
		Union All
		Select Null GroupID, 'ZZZZZ GRAND TOTAL ZZZZZ' GroupName,
			4 Type, Null VoucherNo, Null Date, Null ChqNo, Null ChqDate, Null ChqStatus, 9999999 AccountID, 'GRAND TOTAL' AccountName, Null Description,
			Null OppName, Sum(A.Debit) + Case When Sum(A.Debit) - Sum(A.Credit) < 0 Then Sum(A.Debit) - Sum(A.Credit) Else 0 End Debit, Sum(A.Credit) + Case When Sum(A.Debit) - Sum(A.Credit) > 0 Then Sum(A.Debit) - Sum(A.Credit) Else 0 End Credit, 9999999 SeqNo, Null InputType, Null  OppBalance, Null ReferenceNo,
			A.Division DispDivisionName, A.DivisionID, 1 Period,
			Max(B.SumDebit) SumDebit, Max(B.SumCredit) SumCredit,
			Null Description2, Null FlockID, Null FlockName, Null VehicleNo, Null ItemName, Null Quantity, Null Pcs, Null Less, Null AvgWt, Null GrossWt, Null AdjWt, Null NetWt, Null Rate, Null CurrentDate,
			Null Balance
			From #ActTrans31 A
			Left Outer Join #ActTrans4 B On B.AccountID = A.AccountID
			Left Outer Join Chart C On C.Id = A.GroupID
			Left Outer Join Chart C2 On C2.Id = A.AccountID
			Left Outer Join ChartActTypes E On E.RefNo = C2.NatureID
			Where @IsSummmary = 1
			Group By A.DivisionID, A.Division	
			Order By GroupName, AccountName,  Date, CurrentDate--;

	  --  WITH HierarchalRecords(Id, GroupID, GroupName, Type, VoucherNo, Date, ChqNo, ChqDate, ChqStatus, AccountID, AccountName, Description, OppName, Debit, Credit, SeqNo, InputType, OppBalance, ReferenceNo,
			--DispDivisionName, DivisionID, Period,
			--SumDebit, SumCredit,
			--Description2, FlockID, FlockName, VehicleNo, ItemName, Quantity, Pcs, Less, AvgWt, GrossWt, AdjWt, NetWt, Rate, CurrentDate,
			--Balance)
	  --  AS
   --   (
			--Select Convert(int, Row_Number() Over (Order By GroupName, AccountName)) Id, *
			----Into PLedger
			--From #Final
			----Order By GroupName, AccountName,  Date, CurrentDate--,A.SeqNo
   --   )
      --Delete From RPTTrialBalance
      --Insert Into RPTTrialBalance
    --  Select *, Convert(int, Row_Number() Over (Order By AccountName)) Id, AccountName--, Max(IsNull(SumDebit, 0)) Debit, Max(IsNull(SumCredit, 0)) Credit
    --		Select Convert(int, Row_Number() Over (Order By GroupName, AccountName)) Id, *
    --From #Final
    	--	Order By GroupName, AccountName,  Date, CurrentDate--,A.SeqNo

    Select Convert(int, Row_Number() Over (Order By GroupName, AccountName)) Id, AccountName, Sum(Debit) Debit, Sum(Credit) Credit, GroupName,
    Type,AccountID,AdjWt,ChqNo,AvgWt,DivisionID,ChqDate,ChqStatus,CurrentDate,Description,Description2,DispDivisionName,FlockID,
    FlockName,GrossWt,GroupID,InputType,ItemName,Less,NetWt,OppBalance,OppName,Pcs,Period,Quantity,Rate,ReferenceNo,SeqNo,
    VehicleNo,VoucherNo,Date

      From #Final
    Group By GroupName, AccountName, Type,AccountID,AdjWt,ChqNo,AvgWt,DivisionID,ChqDate,ChqStatus,CurrentDate
    ,Description,Description2,DispDivisionName,FlockID,FlockName,GrossWt,GroupID,InputType,ItemName,Less,NetWt,OppBalance,OppName,Pcs,Period,Quantity,Rate,ReferenceNo
   ,SeqNo,VehicleNo,VoucherNo, Date

		Order By GroupName, AccountName


   

		--Select *
		--From TrialBalance

GO
