using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Accounting.Models;
using Microsoft.AspNetCore.Mvc.Rendering;
using Accounting.ViewModel;
using Microsoft.AspNetCore.Session;
using Microsoft.Data.SqlClient;
using System.Data;
using Microsoft.Identity.Client;
using System.ComponentModel.Design;
using System.Globalization;
using Accounting.Models;

namespace AspnetCoreMvcFull.Controllers
{
  public class TrialBalanceController : Controller
  {
    private readonly webappContext _context;
    private readonly webappContextProcedures _contextproc;

    public TrialBalanceController(webappContext context, webappContextProcedures contextproc)
    {
      _context = context;
      _contextproc = contextproc;
    }


    public async Task<IActionResult> Index()
    {
      var fromDate = "01/01/2024";
      ViewBag.fromDate = fromDate;

      var currentDate = DateTime.UtcNow.ToString("yyyy-MM-dd");
      ViewBag.CurrentDate = currentDate;
      var MenuID = new SqlParameter("@MenuID", SqlDbType.BigInt) { Value = 0 };
      var DateFrom1 = new SqlParameter("@DateFrom1", SqlDbType.Date) { Value = DateTime.Parse("03-01-2024") };
      var DateTo1 = new SqlParameter("@DateTo1", SqlDbType.Date) { Value = DateTime.Parse("12-12-2050") };
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




      return View();
    }
    [HttpPost]
    public async Task<IActionResult> GetData2()
    {
      try
      {
        var draw = Request.Form["draw"].FirstOrDefault();
        var start = Request.Form["start"].FirstOrDefault();
        var length = Request.Form["length"].FirstOrDefault();
        var sortColumnIndex = Request.Form["order[0][column]"].FirstOrDefault();
        var sortColumnDirection = Request.Form["order[0][dir]"].FirstOrDefault();
        var searchValue = Request.Form["search[value]"].FirstOrDefault();

        int pageSize = length != null ? Convert.ToInt32(length) : 10;
        int skip = start != null ? Convert.ToInt32(start) : 0;

        // Fetch sortable column name safely
        var columnName = Request.Form[$"columns[{sortColumnIndex}][name]"].FirstOrDefault();

        var MenuID = new SqlParameter("@MenuID", SqlDbType.BigInt) { Value = 0 };
        var DateFrom1 = new SqlParameter("@DateFrom1", SqlDbType.Date) { Value = DateTime.ParseExact("03-01-2024", "MM-dd-yyyy", CultureInfo.InvariantCulture) };
        var DateTo1 = new SqlParameter("@DateTo1", SqlDbType.Date) { Value = DateTime.ParseExact("12-31-2050", "MM-dd-yyyy", CultureInfo.InvariantCulture) };
        var DivisionFrom = new SqlParameter("@DivisionFrom", SqlDbType.NVarChar, 50) { Value = "DEMO" };
        var DivisionTo = new SqlParameter("@DivisionTo", SqlDbType.NVarChar, 50) { Value = "DEMO" };
        var AccountFrom = new SqlParameter("@AccountFrom", SqlDbType.NVarChar, 50) { Value = "" };
        var AccountTo = new SqlParameter("@AccountTo", SqlDbType.NVarChar, 50) { Value = "" };
        var cUserID = new SqlParameter("@cUserID", SqlDbType.BigInt) { Value = 0 };
        var IsSummmary = new SqlParameter("@IsSummmary", SqlDbType.Int) { Value = 1 };
        var query = (from tempcustomer in await _context.RpttrialBalances
                            .FromSqlRaw("EXEC dbo.TrialBalanceReport @MenuID, @DateFrom1, @DateTo1, @DivisionFrom, @DivisionTo, @AccountFrom, @AccountTo, @cUserID, @IsSummmary",
                              MenuID, DateFrom1, DateTo1, DivisionFrom, DivisionTo, AccountFrom, AccountTo, cUserID, IsSummmary)
                            .ToListAsync()
                            select tempcustomer);

        if (!string.IsNullOrEmpty(searchValue))
        {
          query = query.Where(m => m.AccountName.Contains(searchValue));
        }

        if (string.IsNullOrEmpty(columnName))
        {
          columnName = "ID"; 
        }

        if (!string.IsNullOrEmpty(columnName))
        {
          query = sortColumnDirection == "asc"
              ? query.OrderBy(e => EF.Property<object>(e, columnName))
              : query.OrderByDescending(e => EF.Property<object>(e, columnName));
        }

        int recordsTotal = query.Count();

        var data = query.ToList();
        // Return JSON response
        var jsonData = new { draw = draw, recordsFiltered = recordsTotal, recordsTotal = recordsTotal, data = data };
        return Ok(jsonData);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "An error occurred while processing your request.", error = ex.Message });
      }

    }

    [HttpPost]
    public IActionResult Find()
    {
     
      return PartialView("_Create", new RpttrialBalance()); 
    }

    public async Task<IActionResult> GetData(DateTime TDate)
    {
      try
      {
        var MenuID = new SqlParameter("@MenuID", SqlDbType.BigInt) { Value = 0 };
        var DateFrom1 = new SqlParameter("@DateFrom1", SqlDbType.Date) { Value = DateTime.Parse("03-01-2024") };
        var DateTo1 = new SqlParameter("@DateTo1", SqlDbType.Date) { Value = DateTime.Parse(TDate.ToString()) };
        // var DateTo1 = new SqlParameter("@DateTo1", SqlDbType.Date) { Value = DateTime.Parse("12-31-2050") };
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

        // Return data in the format that your frontend expects
        return Json(new { data = users });
      }
      catch (Exception)
      {
        throw;
      }
    }



  }
}
