// Models/AccountOpeningReportViewModel.cs
using System;
using System.Collections.Generic;

namespace Accounting.Models
{
    public class AccountOpeningReportViewModel
    {
        public List<GroupedLedger> GroupedData { get; set; } = new List<GroupedLedger>();
        public decimal GrandTotalDebit { get; set; }
        public decimal GrandTotalCredit { get; set; }
    }

    public class GroupedLedger
    {
        public string LedgerName { get; set; } = "";
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public List<LedgerEntry> Entries { get; set; } = new List<LedgerEntry>();
    }

    public class LedgerEntry
    {
        public string VoucherNo { get; set; } = "";
        public DateTime Date { get; set; }
        public string CompanyName { get; set; } = "";
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public string Remarks { get; set; } = "";
    }
}