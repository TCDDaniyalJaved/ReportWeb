using Accounting.Helpers;
using Accounting.Models;
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
public class TrialBalanceController : Controller
{
    #region Dependencies

    private readonly webappContext _context;
    private readonly webappContextProcedures _contextprocedure;
    private readonly Base.Services.HtmlToPdfGenerator _pdfGenerator;

    #endregion

    private static readonly string BasePath = "Apps/Accounting/TrialBalance";

    #region Helpers

    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";

    #endregion

    #region Constructor

    public TrialBalanceController(
        webappContext context,
        webappContextProcedures contextprocedure,
        Base.Services.HtmlToPdfGenerator pdfGenerator)
    {
        _context = context;
        _contextprocedure = contextprocedure;
        _pdfGenerator = pdfGenerator;
    }

    #endregion

    #region Views
    [Authorize]
    public IActionResult List()
    {
        return View(ViewPath("Index"));
    }
    #endregion


    #region GetData
    public async Task<IActionResult> GetData(DateTime TDate)
    {
        try
        {
            var MenuID = new SqlParameter("@MenuID", SqlDbType.BigInt) { Value = 0 };
            var DateFrom1 = new SqlParameter("@DateFrom1", SqlDbType.Date) { Value = DateTime.Parse("03-01-2024") };
            var DateTo1 = new SqlParameter("@DateTo1", SqlDbType.Date) { Value = DateTime.Parse("12-18-2025") };
            var DivisionFrom = new SqlParameter("@DivisionFrom", SqlDbType.NVarChar, 50) { Value = "DEMO" };
            var DivisionTo = new SqlParameter("@DivisionTo", SqlDbType.NVarChar, 50) { Value = "DEMO" };
            var AccountFrom = new SqlParameter("@AccountFrom", SqlDbType.NVarChar, 50) { Value = "" };
            var AccountTo = new SqlParameter("@AccountTo", SqlDbType.NVarChar, 50) { Value = "" };
            var cUserID = new SqlParameter("@cUserID", SqlDbType.BigInt) { Value = 0 };
            var IsSummmary = new SqlParameter("@IsSummmary", SqlDbType.Int) { Value = 1 };

            var users = await _context.RpttrialBalances
                .FromSqlRaw("EXEC dbo.TrialBalanceReport @MenuID, @DateFrom1, @DateTo1, @DivisionFrom, @DivisionTo, @AccountFrom, @AccountTo, @cUserID, @IsSummmary",
                            MenuID, DateFrom1, DateTo1, DivisionFrom, DivisionTo, AccountFrom, AccountTo, cUserID, IsSummmary)
                .ToListAsync();

            return Json(new { data = users });
        }
        catch (Exception)
        {
            throw;
        }
    }
    #endregion

}

