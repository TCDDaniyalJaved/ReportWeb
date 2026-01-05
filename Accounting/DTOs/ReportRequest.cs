using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Accounting.DTOs
{
    public class ReportRequest
    {
        [Required(ErrorMessage = "ReportName is required.")]
        public string ReportName { get; set; }  // Report key

        public Dictionary<string, object> Parameters { get; set; } = new(); // Dynamic parameters

        public List<string> GroupByFields { get; set; } = new(); // Optional grouping
    }
}
