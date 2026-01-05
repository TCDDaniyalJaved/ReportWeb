using System.Collections.Generic;

namespace Accounting.DTOs
{
    public class ReportResponse
    {
        public List<Dictionary<string, object>> Data { get; set; } = new();
        public int RecordsTotal { get; set; }
        public int RecordsFiltered { get; set; }
        public string Error { get; set; }
    }
}
