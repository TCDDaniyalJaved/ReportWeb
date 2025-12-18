using Accounting.Models.Validation;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
namespace Accounting.Models.Validation
{

    public class ChartValidation
    {

        [Required(ErrorMessage = "Account name must not be blank")]
        [DisplayName("Name")]
        [UniqueName]
        public string Name { get; set; }

        [DisplayName("Description")]
        public string Descript { get; set; }

        [Required(ErrorMessage = "Nature name must not be blank")]

        [DisplayName("Nature")]
        public int NatureId { get; set; }

        [DisplayName("Asset Template")]
        public int AssetTempId { get; set; }

        [Required(ErrorMessage = "This field is required")]
        [DisplayName("Company")]
        public int CompanyId { get; set; }

        [DisplayName("Sub Of")]
        public int GroupId { get; set; }

        [DisplayName("Type")]
        public int TypeId { get; set; }
    }

    //Master
    public class AccountOpeningMValidation
    {
        [Required(ErrorMessage = "Company isss required.")]
        [Display(Name = "Company")]
        public int CompanyId { get; set; }
    }

    // Detail

    //[RequireOneOfDebitOrCredit(ErrorMessage = "Either Debit or Credit must have a value.")]
    public class AccountOpeningDValidation
    {
        [Required(ErrorMessage = "Account isss required.")]
        [Display(Name = "Account")]
        public int ActCode { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Debit must be zero or positive.")]
        public decimal? Debit { get; set; } = 0;

        [Range(0, double.MaxValue, ErrorMessage = "Credit must be zero or positive.")]
        public decimal? Credit { get; set; } = 0;

        [Required(ErrorMessage = "Remarks are required.")]
        [MaxLength(16, ErrorMessage = "Remarks cannot exceed 16 characters.")]
        public string? Remarks { get; set; }
    }




    //Master
    public class CashPaymentMValidation
    {
        [Required(ErrorMessage = "PartyId isss required.")]
        [Display(Name = "PartyId")]
        public int PartyId { get; set; }
        [Required(ErrorMessage = "PartyId isss required.")]
        [MaxLength(250, ErrorMessage = "Remarks cannot exceed 250 characters.")]
        public string? Note { get; set; }
    }

    // Detail

    //[RequireOneOfDebitOrCredit(ErrorMessage = "Either Debit or Credit must have a value.")]
    public class CashPaymentDValidation
    {
        [Required(ErrorMessage = "Account isss required.")]
        [Display(Name = "Account")]
        public int ActCode { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Debit must be zero or positive.")]
        public decimal? Debit { get; set; } = 0;

        [Range(0, double.MaxValue, ErrorMessage = "Credit must be zero or positive.")]
        public decimal? Credit { get; set; } = 0;

        [Required(ErrorMessage = "Remarks are required.")]
        [MaxLength(4, ErrorMessage = "Remarks cannot exceed 4 characters.")]
        public string? Remarks { get; set; }
    }

}