using Accounting.Models.Validation;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
namespace Accounting.Models.Validation
{

    #region Accounting Validation
    #region AccountOpening
    //AccountOpening
    //Master
    public class AccountOpeningMValidation
    {
        [DisplayName("Company")]
        [Required(ErrorMessage = "Please select Company")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Company")]
        public int? CompanyId { get; set; }
    }
    //AccountOpening
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
    #endregion
    #region CashPayment
    //CashPayment
    //Master
    public class CashPaymentMValidation
    {
        [DisplayName("Book")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Book")]
        [Required(ErrorMessage = "Please select Book")]
        public int? BookCode { get; set; }
    }
    //CashPayment
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
    #endregion
    #region CashReceipt
    //CashReceipt
    //Master
    public class CashReceiptMValidation
    {
        [DisplayName("Book")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Book")]
        [Required(ErrorMessage = "Please select Book")]
        public int? BookCode { get; set; }
    }
    //CashReceipt
    // Detail

    public class CashReceiptDValidation
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

    #endregion
    #region BankReceipt
    //BankReceipt
    //Master
    public class BankReceiptMValidation
    {
        [DisplayName("Book")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Book")]
        [Required(ErrorMessage = "Please select Book")]
        public int? BookCode { get; set; }
    }
    //BankReceipt
    // Detail

    public class BankReceiptDValidation
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
    #endregion
    #region BankPayment
    //BankPayment
    //Master
    public class BankPaymentMValidation
    {
        [DisplayName("Book")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Book")]
        [Required(ErrorMessage = "Please select Book")]
        public int? BookCode { get; set; }
    }
    //BankPayment
    // Detail

    public class BankPaymentDValidation
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
    #endregion
    #region GeneralJournal
    //GeneralJournal
    //Master
    public class GjournalMValidation
    {
        [DisplayName("Company")]
        [Required(ErrorMessage = "Please select Company")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select Company")]
        public int? CompanyId { get; set; }
    }
    //GeneralJournal
    // Detail

    public class GjournalDValidation
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

    #endregion
    #endregion

}
