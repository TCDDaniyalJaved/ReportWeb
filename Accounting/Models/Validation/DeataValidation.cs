using Accounting.Models.Validation;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
namespace Accounting.Models.Validation
{

    //Master
    public class AccountOpeningMValidation
    {
        [DisplayName("Company")]
        [Required(ErrorMessage = "Please select Company")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Company")]
        public int? CompanyId { get; set; }
    }

    // Detail

    public class AccountOpeningDValidation
    {
        [DisplayName("Account")]
        [Required(ErrorMessage = "Please select Account")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Account")]
        public int? ActCode { get; set; }

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
        [DisplayName("Book")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Book")]
        [Required(ErrorMessage = "Please select Book")]
        public int? BookCode { get; set; }
    }

    // Detail

    public class CashPaymentDValidation
    {
        [DisplayName("Account")]
        [Required(ErrorMessage = "Please select Account")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Account")]
        public int? ActCode { get; set; }
        [Required(ErrorMessage = "Amount is required.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Please Insert Amount")]
        [DisplayFormat(DataFormatString = "{0:#,##0.00}", ApplyFormatInEditMode = true)]
        public decimal Amount { get; set; }
    }

}