using Accounting.DTOs;
using System.Threading.Tasks;

namespace Accounting.Services
{
    public interface IReportService
    {
        Task<ReportResponse> ExecuteReportAsync(ReportRequest request);
    }
}
