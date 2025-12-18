using Accounting.Models;

namespace Accounting.ViewModel
{
    public class WorkingTrialBalanceViewModel
    {
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public List<TrialBalanceGroup> Data { get; set; }
        public decimal GrandDebit { get; set; }
        public decimal GrandCredit { get; set; }
        public string PrintedDate { get; set; }
        public string PrintedTime { get; set; }
    }

    public class TrialBalanceGroup
    {
        public string MainHead { get; set; }
        public List<TrialBalanceItem> Items { get; set; }
        public decimal? TotalDebit { get; set; }
        public decimal? TotalCredit { get; set; }
    }

    public class TrialBalanceItem
    {
        public string AccountName { get; set; }
        public decimal? Debit { get; set; }
        public decimal? Credit { get; set; }
    }
}