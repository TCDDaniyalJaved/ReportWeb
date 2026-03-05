DROP PROCEDURE  [StockSale]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE  [StockSale]
	@MenuID Int = 1,
	@DateFrom1 Varchar(10) = '01-01-1990',
	@DateTo1 Varchar(10) = '12-31-2050',
	@DivisionFrom Varchar(Max) = '',
--	@DivisionTo Varchar(Max) = '',
	@CategoryFrom Varchar(Max) = '',
--	@CategoryTo Varchar(Max) = '',
	@ItemFrom Varchar(Max) = '',
--	@ItemTo Varchar(Max) = '',
	@LocationFrom Varchar(Max) = '',
--	@LocationTo Varchar(Max) = '',	
	@ZBalanceFrom varchar(100) = 'Yes',
--	@ZBalanceTo varchar(100) = 'Yes',
	@ShowImageFrom varchar(100) = 'No',
--	@ShowImageTo varchar(100) = 'No',
	@ReportTag varchar(100) = '',
	@ROrderTag Varchar(5) = '',
	@IsStock Money = 0,
	@Start int =0,
	@Length INT = 10

	WITH ENCRYPTION
AS
BEGIN
	SET NOCOUNT ON

	Declare @Type tinyint 
	if @MenuID <> 1
Begin
Set @Type = (Select IsNull(MenuType,0) from Menus Where MenuID = @MenuID)
End

 -- If @DivisionTo = ''
	--Begin
	--	Set @DivisionTo = @DivisionFrom
	--End

	

 -- If @ItemTo = ''
	--Begin
	--	Set @ItemTo = @ItemFrom
	--End

 -- If @LocationTo = ''
	--Begin
	--	Set @LocationTo = @LocationFrom
	--End

	--  If @CategoryTo = ''
	--Begin
	--	Set @CategoryTo = @CategoryFrom
	--End


	Declare	@DateFrom DateTime, @DateTo DateTime
	Set @DateFrom = Convert(DateTime , @DateFrom1)
	Set @DateTo = Convert(DateTime , @DateTo1)

	Declare @MDivisionID Int, @MDivision VarChar(100)
	Declare @DivisionID int
	Select @DivisionID = Code from Company where Name = @DivisionFrom
	Select @MDivisionID = Code, @MDivision = Name From Company Where Code = @DivisionID


			Select A.ID ItemID , D.LocationID , Max(D.Rate) MaxRate
		into	#itemSRate
		 from Item A
		 Left Outer Join SInvoiceD D on A.Id = D.itemID			
			Group by A.ID, D.LocationID
			Having Max(D.Rate) is Not Null
			


		Select RefID itemID , Max(Quantity3) DefRate  
		Into #ItemDetail
		from ItemDetail  Group by RefID

	Select 1 Type, T.RefCompanyID DivisionID, T.RefID Code, SR.IDRefNo Voucher,
		T.RefType InputType, Convert(DateTime, Convert(Date, SR.IDate)) Date, T.RefItemID ItemID,
		T.RefLocationID LocationID, IM.UnitID, IsNull(R.Title3, '') + ', @' + Convert(VarChar(15), Convert(Decimal(10,2),T.CostRate), 1) + ' Container # '+ IsNull(TT.DRefNo,'') Describe,
		T.Qnty RecQty, T.CostRate RecRate, (T.Qnty * T.CostRate) RecAmt, 0 IssQty, 0 IssRate, 0 IssAmt, R.SeqNo,
		0 IRecQty, 0 IRecRate, 0 IRecAmt, 0 IIssQty, 0 IIssRate, 0 IIssAmt, 0 FOCQty, 0 FOCRate, 0 FOCAmt
	Into #Temp
	 From StockCosting T
	Left Outer Join StockReferences R On R.RefType = T.RefType
	Left Outer Join GetTranRefNos SR On SR.RefDivisionID = T.RefCOmpanyID
		And SR.RefType = T.RefType
		And SR.RefID = T.RefID
	Left Outer Join (Select ID, InputType, DRefNo from IOpeningM Union ALl Select ID, InputType, PRefNo from PInvoiceM  ) TT on T.RRefID = TT.Id And T.RRefType = TT.InputType
	Left Outer Join Item IM On IM.ID = T.RefItemID
	Left Outer Join Category CT On CT.ID = IM.CategoryID
	--Where T.IsAdd = 1  And  AccountID2 = 0
	Where T.AccountID <> 0 	And T.IsAdd = 1 	And T.RefType <> 'IA'
	-- And T.AccountID <> CT.WIPActID
	Union All
	Select 2 Type, T.RefCompanyID DivisionID, T.RefID Code, SR.IDRefNo Voucher,
		T.RefType InputType, Convert(DateTime, Convert(Date, SR.IDate)) Date, T.RefItemID ItemID,
		T.RefLocationID, IM.UnitID, IsNull(R.Title3, '') + ', @' + Convert(VarChar(15), Convert(Decimal(10,2),T.CostRate), 1) + ' ,' + SR2.IDRefNo+ ' Container # '+ IsNull(TT.DRefNo,'') Describe,
		0 RecQty, 0 RecRate, 0 RecAmt, T.Qnty IssQty, T.CostRate IssRate, (T.Qnty * T.CostRate) IssAmt, R.SeqNo,
		0 IRecQty, 0 IRecRate, 0 IRecAmt, 0 IIssQty, 0 IIssRate, 0 IIssAmt, 0 FOCQty, 0 FOCRate, 0 FOCAmt
	From StockCosting T
	Left Outer Join StockReferences R On R.RefType = T.RefType
	Left Outer Join GetTranRefNos SR On SR.RefDivisionID = T.RefCompanyID
		And SR.RefType = T.RefType
		And SR.RefID = T.RefID
Left Outer Join (Select ID, InputType, DRefNo from IOpeningM Union ALl Select ID, InputType, PRefNo from PInvoiceM  ) TT on T.RRefID = TT.Id And T.RRefType = TT.InputType
	Left Outer Join GetTranRefNos SR2 On SR2.RefDivisionID = T.RefCompanyID
		And SR2.RefType = T.IRefType
		And SR2.RefID = T.IRefID
	Left Outer Join Item IM On IM.ID = T.RefItemID
	Left Outer Join Category CT On CT.ID = IM.CategoryID
	Where T.IsAdd = 0 And T.RefType <> 'IA' --And T.AccountID2 <> CT.WIPActID
	Union All
	Select 1 Type, T.RefCompanyID DivisionID, T.RefID Code, SR.IDRefNo Voucher,
		T.RefType InputType, Convert(DateTime, Convert(Date, SR.IDate)) Date, T.RefItemID ItemID,
		T.RefLocationID LocationID, IM.UnitID, IsNull(R.Title3, '') + ', @' + Convert(VarChar(15), Convert(Decimal(10,2),T.CostRate), 1) + ' ,' + SR2.IDRefNo + ' ,' + LO.Name + ' Container # '+ IsNull(TT.DRefNo,'')  Describe,
		0 RecQty, 0 RecRate, 0 RecAmt, 0 IssQty, 0 IssRate, 0 IssAmt, R.SeqNo,
		T.Qnty IRecQty, T.CostRate IRecRate, (T.Qnty * T.CostRate) IRecAmt, 0 IIssQty, 0 IIssRate, 0 IIssAmt, 0 FOCQty, 0 FOCRate, 0 FOCAmt

	 From StockCosting T
	Left Outer Join StockReferences R On R.RefType = T.RefType
	Left Outer Join GetTranRefNos SR On SR.RefDivisionID = T.RefCOmpanyID
		And SR.RefType = T.RefType
		And SR.RefID = T.RefID
Left Outer Join (Select ID, InputType, DRefNo from IOpeningM Union ALl Select ID, InputType, PRefNo from PInvoiceM  ) TT on T.RRefID = TT.Id And T.RRefType = TT.InputType
	Left Outer Join Item IM On IM.ID = T.RefItemID
	Left Outer Join Category CT On CT.ID = IM.CategoryID
	Left Outer Join GetTranRefNos SR2 On SR2.RefDivisionID = T.RefCompanyID
		And SR2.RefType = T.RRefType
		And SR2.RefID = T.RRefID
	Left Outer Join DChallanD D On D.Id = T.RefSeqNo And T.RefType = 'IA'
	Left Outer Join Location LO On LO.ID = D.LocationID
	Where T.AccountID <> 0 	And T.IsAdd = 1
	And T.RefType = 'IA'
	
	Union All
	Select 2 Type, T.RefCompanyID DivisionID, T.RefID Code, SR.IDRefNo Voucher,
		T.RefType InputType, Convert(DateTime, Convert(Date, SR.IDate)) Date, T.RefItemID ItemID,
		T.RefLocationID, IM.UnitID, IsNull(R.Title3, '') + ', @' + Convert(VarChar(15), Convert(Decimal(10,2),T.CostRate), 1) + ' ,' + SR2.IDRefNo + ' ,' + LO.Name+ ' Container # '+ IsNull(TT.DRefNo,'')  Describe,
		0 RecQty, 0 RecRate, 0 RecAmt, 0 IssQty, 0 IssRate, 0 IssAmt, R.SeqNo,
		0 IRecQty, 0 IRecRate, 0 IRecAmt, T.Qnty IIssQty, T.CostRate IIssRate, (T.Qnty * T.CostRate) IIssAmt, 0 FOCQty, 0 FOCRate, 0 FOCAmt
	From StockCosting T
	Left Outer Join StockReferences R On R.RefType = T.RefType
	Left Outer Join GetTranRefNos SR On SR.RefDivisionID = T.RefCompanyID
		And SR.RefType = T.RefType
		And SR.RefID = T.RefID
Left Outer Join (Select ID, InputType, DRefNo from IOpeningM Union ALl Select ID, InputType, PRefNo from PInvoiceM  ) TT on T.RRefID = TT.Id And T.RRefType = TT.InputType
	Left Outer Join GetTranRefNos SR2 On SR2.RefDivisionID = T.RefCompanyID
		And SR2.RefType = T.IRefType
		And SR2.RefID = T.IRefID
	Left Outer Join DChallanD D On D.Id = T.RefSeqNo And T.RefType = 'IA'
	Left Outer Join Location LO On LO.ID = D.TLocationID
	Left Outer Join Item IM On IM.ID = T.RefItemID
	Left Outer Join Category CT On CT.ID = IM.CategoryID
	Where T.IsAdd = 0
		And T.RefType = 'IA'
	Union All
	Select 2 Type, T.RefCompanyID DivisionID, T.RefID Code, SR.IDRefNo Voucher,
		T.RefType InputType, Convert(DateTime, Convert(Date, SR.IDate)) Date, T.RefItemID ItemID,
		T.RefLocationID, IM.UnitID, IsNull(R.Title3, '') + ', @' + Convert(VarChar(15), Convert(Decimal(10,2),T.CostRate), 1) + ' ,' + SR2.IDRefNo+ ' Container # '+ IsNull(TT.DRefNo,'')   Describe,
		0 RecQty, 0 RecRate, 0 RecAmt, 0 IssQty, 0 IssRate, 0 IssAmt, R.SeqNo,
		0 IRecQty, 0 IRecRate, 0 IRecAmt, 0 IIssQty, 0 IIssRate, 0 IIssAmt, T.Qnty FOCQty, T.CostRate FOCRate, (T.Qnty * T.CostRate) FOCAmt
	From StockCosting T
	Left Outer Join StockReferences R On R.RefType = T.RefType
	Left Outer Join GetTranRefNos SR On SR.RefDivisionID = T.RefCompanyID
		And SR.RefType = T.RefType
		And SR.RefID = T.RefID
	Left Outer Join (Select ID, InputType, DRefNo from IOpeningM Union ALl Select ID, InputType, PRefNo from PInvoiceM  ) TT on T.RRefID = TT.Id And T.RRefType = TT.InputType
	Left Outer Join GetTranRefNos SR2 On SR2.RefDivisionID = T.RefCompanyID
		And SR2.RefType = T.IRefType
		And SR2.RefID = T.IRefID	
	Left Outer Join Item IM On IM.ID = T.RefItemID
	Left Outer Join Category CT On CT.ID = IM.CategoryID
	Where T.IsAdd = 0
		And T.RefType = 'FOC'

	Select 0 Type, A.DivisionID, A.ItemID, Null Date, 
		'Balance B/F: ' + Convert(Varchar(15), @DateFrom, 107) Descript,
		(Case When ((Sum(A.RecQty) + Sum(A.IRecQty)) - (Sum(A.IssQty) + Sum(A.IIssQty))) > 0 Then ((Sum(A.RecQty) + Sum(A.IRecQty)) - (Sum(A.IIssQty)+ Sum(A.IssQty))) Else 0 End) RecQty, 
		(Case When ((Sum(A.RecQty) + Sum(A.IRecQty)) - (Sum(A.IssQty)+ Sum(A.IIssQty))) < 0 Then Abs((Sum(A.RecQty)+ Sum(A.IRecQty)) - (Sum(A.IIssQty)+ Sum(A.IssQty))) Else 0 End) IssQty, 
		Null Rate, A.LocationID, Null SeqNo, 
		Null LinkRefNo, Null RefNo, Null UnitID, Null InputType, Null DispRefNo, 
		((Sum(A.RecQty) + Sum(A.IRecQty)) - (Sum(A.IssQty) + Sum(A.IIssQty))) Opening, Sum(A.RecQty) - Sum(A.IssQty) PurchQty, Null PurchRef,
		((Sum(A.RecAmt) + Sum(A.IRecAmt)) - (Sum(A.IssAmt) + Sum(A.IIssAmt))) OpeningAmt,
		(Case When ((Sum(A.RecAmt) + Sum(A.IRecAmt)) - (Sum(A.IssAmt) + Sum(A.IIssAmt))) > 0 Then ((Sum(A.RecAmt)+ Sum(A.IRecAmt)) - (Sum(A.IssAmt) + Sum(A.IIssAmt))) Else 0 End) RecAmt, 
		(Case When ((Sum(A.RecAmt)+ Sum(A.IRecAmt)) - (Sum(A.IssAmt)+ Sum(A.IIssAmt)) ) < 0 Then Abs((Sum(A.RecAmt) + Sum(A.IRecAmt)) - (Sum(A.IssAmt)+ Sum(A.IIssAmt))) Else 0 End) IssAmt,
		0 IRecQty, 
		0 IIssQty, 
		0 IRecAmt, 
		0 IIssAmt,
		0 FOCQty,
		0 FOCRate,
		0 FOCAmt
	Into #Final
	From #Temp A
	Where A.Date < @DateFrom
	Group By A.DivisionID, A.ItemID, A.LocationID
	Union All
	Select A.Type, A.DivisionID, A.ItemID, A.Date, A.Describe Descript, A.RecQty, A.IssQty, Abs(A.RecRate - A.IssRate) Rate,
		A.LocationID, A.SeqNo, A.Voucher LinkRefNo, A.Code RefNo, A.UnitID, A.InputType, A.Voucher DispRefNo, 0 Opening,
		0 PurchQty, '' PurchRef, 0 OpeningAmt, A.RecAmt, A.IssAmt, A.IRecQty, A.IIssQty, A.IRecAmt, A.IIssAmt, A.FOCQty, A.FOCRate, A.FOCAmt
	From #Temp A
	Where A.Date Between @DateFrom And @DateTo

	Select A.DivisionID, A.ItemID, A.LocationID, Sum((A.RecQty ) - (A.IssQty )) Balance, 
		Sum((A.RecQty ) * A.Rate) / (Case when Sum(A.RecQty ) = 0 Then 1 Else Sum(A.RecQty) End) AvgRate
	Into #Avg
	From #Final A
	Group By A.DivisionID, A.ItemID, A.LocationID

	

	Select Max(A.Type) Type, A.DivisionID, DV.Name CompanyName, A.ItemID,
		/*CT.Name + ' :: ' + */ MAx(B.Name)  ItemName,
		Max(A.Date) Date, Max(Upper(A.Descript)) Descript, Sum(A.RecQty ) RecQty, Sum(A.IssQty) IssQty, 
		IsnUll(Max(IST.MaxRate),Max(ISD.DefRate)) Rate, A.LocationID, max(A.SeqNo) SeqNo, 
		Max(A.RefNo) RefNo, Max(A.LinkRefNo) LinkRefNo, Max(A.InputType) InputType, Max(A.DispRefNo) DispRefNo,
		Sum( A.Opening) Opening, 2 QntyRnd, 
		Sum(A.PurchQty) PurchQty, Max(A.PurchRef) PurchRef, 0 AvgRate, 0 Balance,
		Max(LB.Name) LocationName, Null CategoryName, Max(UT.Name)  DepartmentName, @ZBalanceFrom IsBalance,
		Null NetAmount, Null ReorderQnty, Null ReorderLevel, Null Variance, Null OrderID,
			(Sum(A.RecQty) + SUm(A.IRecQty)) - (Sum(A.IssQty) + Sum(A.IIssQty)) OpeningAmt, 0 RecAmt, 0 IssAmt, Null ImageLocation, null IsImage,
		Sum(A.IRecQty) IRecQty,Sum(A.IIssQty) IIssQty,0 IRecAmt,0 IIssAmt, Sum(A.FOCQty) FOCQty,Sum( A.FOCRate) FOCRate, 0 FOCAmt,
		(Sum(A.RecQty) + SUm(A.IRecQty)) - (Sum(A.IssQty) + Sum(A.IIssQty)) TBalance
	Into #Final2
	From #Final A
	Left Outer Join #Avg H On H.DivisionID = A.DivisionID
		And H.ItemID = A.ItemID
		And H.LocationID = A.LocationID
	Left Outer Join Item B On B.ID = A.ItemID
	Left Outer Join #itemSRate IST on A.ItemID = IST.ItemID
		And A.LocationID = IST.LocationID
	Left Outer Join #ItemDetail ISD on A.ItemID = ISD.ItemID
	Left Outer Join Location LB On LB.ID = A.LocationID
	Left Outer Join Unit UT On UT.ID = B.UnitID
	--Left Outer Join ItemNature C On C.Code = B.INatureID
	Left Outer Join Category CT On CT.ID = B.CategoryID
	
	Left Outer Join Company DV On DV.Code = A.DivisionID
	Where ((Case When @DivisionFrom = '' Then 0 End = 0) Or
		(Case When @DivisionFrom <> '' Then DV.Name End Between @DivisionFrom And @DivisionFrom))
	And ((Case When @CategoryFrom = '' Then 0 End = 0) Or
		(Case When @CategoryFrom <> '' Then CT.Name End = @CategoryFrom ))
	And ((Case When @ItemFrom = '' Then 0 End = 0) Or
		(Case When @ItemFrom <> '' Then  B.Name End = @ItemFrom ))
	And ((Case When @LocationFrom = '' Then 0 End = 0) Or
		(Case When @LocationFrom <> '' Then  LB.Name End = @LocationFrom ))
		
	Group by  	A.DivisionID, DV.Name 	 ,A.LocationID , A.ItemID
		
	
		
	/*And ((Case When @ZBalanceFrom = 'YES' Then 0 End = 0) Or
		(Case When @ZBalanceFrom = 'NO' Then IsNull(H.Balance, 0) End <> 0))*/

	--Update #Final2 Set RecAmt = 0, IssAmt = 0 Where Balance = 0

	Select A.*, A.IsBalance IsValuation
	From #Final2 A
	--Where A.TBalance <> 0
	/*Where ((Case When @ZBalanceFrom = 'BOTH' Then 0 End = 0) Or
		(Case When @ZBalanceFrom = 'YES' Then A.IsBalance End = 0) Or
		(Case When @ZBalanceFrom = 'NO' Then A.IsBalance End <> 0))*/
	Order By A.CompanyName,  A.ItemName, A.Date--, A.Type, A.DispRefNo
	OFFSET @Start ROWS FETCH NEXT @Length ROWS ONLY;

	SET NOCOUNT OFF
END
GO
