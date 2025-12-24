using Accounting.Helpers;
using Accounting.Models;
using Dapper;
using Accounting.Services;
using Accounting.Services.Pdf;
using Accounting.ViewModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using System.Data;

namespace Accounting.Controllers;

[Authorize]
[Route("Accounting/[controller]/[action]")]
public class PurchaseReportController : Controller
{
    #region Dependencies

    private readonly webappContext _context;
    private readonly webappContextProcedures _contextprocedure;
    private readonly Base.Services.HtmlToPdfGenerator _pdfGenerator;
    private readonly IConfiguration _configuration;

    #endregion

    private static readonly string BasePath = "Apps/Accounting/PurchaseReport";

    #region Helpers

    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";

    #endregion

    #region Constructor

    public PurchaseReportController(
        webappContext context,
        webappContextProcedures contextprocedure,
        Base.Services.HtmlToPdfGenerator pdfGenerator,
        IConfiguration configuration)
    {
        _context = context;
        _contextprocedure = contextprocedure;
        _pdfGenerator = pdfGenerator;
        _configuration = configuration;

    }

    #endregion

    #region Views
    [Authorize]
    public IActionResult List()
    {
        return View(ViewPath("Index"));
    }

    [Authorize]

    public IActionResult Demo()
    {
        return View(ViewPath("Demo"));
    }
    #endregion

    #region GetData
    [HttpGet]
    public async Task<IActionResult> GetPurchaseReport()
    {
        try
        {
            // 1️ Get connection string from appsettings.json
            var connectionString = _configuration.GetConnectionString("Default");

            // 2️ Open SQL connection
            using var conn = new SqlConnection(connectionString);
            await conn.OpenAsync();

            // 3️ Execute stored procedure using Dapper
            var result = await conn.QueryAsync(
                "dbo.PurchaseReport", // Stored Procedure name
                new
                {
                    DateFrom1 = "01-01-1990",
                    DateTo1 = "12-31-2050",
                    DivisionFrom = "",  // Optional
                    AccountFrom = "",   // Optional
                    ItemFrom = "",      // Optional
                    CategoryFrom = (string?)null,
                    LocationFrom = (string?)null
                },
                commandType: CommandType.StoredProcedure
            );

            // 4️ Return JSON
            return Json(new { data = result });
        }
        catch (Exception ex)
        {
            // Handle error
            return StatusCode(500, new { error = ex.Message });
        }
    }
    #endregion

}

