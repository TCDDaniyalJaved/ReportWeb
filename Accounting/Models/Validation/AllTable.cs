

using System.ComponentModel.DataAnnotations;
using Accounting.Models.Validation;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Models
{
    [ModelMetadataType(typeof(Validation.AccountOpeningMValidation))]
    public partial class AccountOpeningM
    {
    }

    [ModelMetadataType(typeof(Validation.AccountOpeningDValidation))]
    public partial class AccountOpeningD
    {
    }

    [ModelMetadataType(typeof(Validation.CashPaymentMValidation))]
    public partial class CashPaymentM
    {
    }

    [ModelMetadataType(typeof(Validation.CashPaymentDValidation))]
    public partial class CashPaymentD
    {
    }



}
