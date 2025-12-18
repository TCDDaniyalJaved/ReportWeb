namespace Accounting.ViewModel
{
    public class AccountOpeningVoucherDto
    {
        public int Code { get; set; }
        public string RefNo { get; set; }
        public DateTime Date { get; set; }
        public int AccountID { get; set; }
        public string AccountName { get; set; }
        public string Description { get; set; }
        public decimal? Debit { get; set; }
        public decimal? Credit { get; set; }
        public int SeqNo { get; set; }
        public string InputType { get; set; }
        public string DisplayCompany { get; set; }
    }
}
