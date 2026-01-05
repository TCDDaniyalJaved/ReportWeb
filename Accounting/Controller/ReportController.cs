using Accounting.DTOs;
using Accounting.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Accounting.DTOs;
namespace Accounting.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpPost("GetData")]
        public async Task<IActionResult> GetData([FromBody] ReportRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _reportService.ExecuteReportAsync(request);

            if (!string.IsNullOrEmpty(result.Error))
                return BadRequest(new { error = result.Error });

            return Ok(result);
        }
    }
}
