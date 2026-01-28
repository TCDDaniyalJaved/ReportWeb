

using System.ComponentModel.DataAnnotations;
using Accounting.Models.Validation;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Models
{

    #region Accounting Validation
    #region AccountOpening
    //AccountOpening
    //Master
    [ModelMetadataType(typeof(Validation.AccountOpeningMValidation))]
    public partial class AccountOpeningM
    {
    }
    //AccountOpening
    //Detail
    [ModelMetadataType(typeof(Validation.AccountOpeningDValidation))]
    public partial class AccountOpeningD
    {
    }
    #endregion
    #region Cash
    //CashPaymnet
    //Master
    [ModelMetadataType(typeof(Validation.CashPaymentMValidation))]
    public partial class CashPaymentM
    {
    }

    [ModelMetadataType(typeof(Validation.CashPaymentDValidation))]
    public partial class CashPaymentD
    {
    }
    //CashReceipt
    //Master
    [ModelMetadataType(typeof(Validation.CashReceiptMValidation))]
    public partial class CashReceiptM
    {
    }
    //CashReceipt
    //Detail
    [ModelMetadataType(typeof(Validation.CashReceiptDValidation))]
    public partial class CashReceiptD
    {
    }
    #endregion
    #region Bank

    //BankReceipt
    //Master
    [ModelMetadataType(typeof(Validation.BankReceiptMValidation))]
    public partial class BankReceiptM
    {
    }
    //BankReceipt
    //Detail
    [ModelMetadataType(typeof(Validation.BankReceiptDValidation))]
    public partial class BankReceiptD
    {
    }

    //BankPayment
    //Master
    [ModelMetadataType(typeof(Validation.BankPaymentMValidation))]
    public partial class BankPaymentM
    {
    }
    //BankPayment
    //Detail
    [ModelMetadataType(typeof(Validation.BankPaymentDValidation))]
    public partial class BankPaymentD
    {
    }
    #endregion
    #region GeneralJournal
    //GeneralJournal
    //Master
    [ModelMetadataType(typeof(Validation.GjournalMValidation))]
    public partial class GjournalM
    {
    }
    //GeneralJournal
    //Detail
    [ModelMetadataType(typeof(Validation.GjournalDValidation))]
    public partial class GjournalD
    {
    }
    #endregion

    #endregion

}
