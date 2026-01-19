using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using DocumentFormat.OpenXml.InkML;
using Microsoft.EntityFrameworkCore;
using DocumentFormat.OpenXml.Bibliography;

namespace Accounting.Apps;

public class DashboardsController : Controller
{
    private webappContext _context;

    public  DashboardsController(webappContext context)
    {
        _context = context;
    }

    private static readonly string BasePath = "Apps/Dashboards";

    // Helper function to build path
    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";


    public class AccountChartViewModel
    {
        public string Accounts { get; set; }

        public string Voucher { get; set; }

        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }

    }
    public class DemoViewModel
    {
        public List<AccountChartViewModel> AccountWise { get; set; } = new();
        public List<AccountChartViewModel> VoucherWise { get; set; } = new();
    }
    [Authorize]

    public IActionResult Index()
    {
        return View(ViewPath("Index"));
    }
    // OrderStatisticsController.cs
    [HttpGet]
    public async Task<IActionResult> GetOrderStatistics()
    {
        var data = await _context.AccountOpeningMviews
            .ToListAsync();

        // Group by company name and calculate totals
        var result = data
            .GroupBy(x => x.Companyname)
            .Select(g => new
            {
                category = g.Key,
                value = g.Sum(x => (x.Debit + x.Credit)) // Total transactions per company
            })
            .OrderByDescending(x => x.value)
            .Take(4) // Top 4 companies
            .ToList();

        // Alternative: Separate debit and credit
        var result2 = data
            .GroupBy(x => x.Companyname)
            .Select(g => new
            {
                category = g.Key,
                debit = g.Sum(x => x.Debit),
                credit = g.Sum(x => x.Credit),
                total = g.Sum(x => (x.Debit + x.Credit))
            })
            .OrderByDescending(x => x.total)
            .Take(4)
            .ToList();

        return Ok(result);
    }
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Fetch all data from AccountOpeningMView
        var data = await _context.AccountOpeningMviews
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet]
  

    [HttpGet]
    public async Task<IActionResult> GetAllData()
    {
        var data = await _context.AccountOpeningDviews
            .ToListAsync();

        return Ok(data);
    }


    [HttpGet]
    public async Task<IActionResult> GetAllDataMonth()
    {
        var data = await _context.AccountOpeningMviews
            .Select(x => new
            {
                x.Id,
                x.Date,
                x.Remarks,
                x.BookCode,
                x.VoucherNo,
                x.Voucher,
                x.CompanyId,
                x.Book,
                x.Debit,
                x.Credit,
                x.TotalSeqNo,
                x.InputType,
                x.Accounts,
                x.Prefix
            })
            .ToListAsync();

        // Group by Year and Month
        var groupedData = data
       .GroupBy(x => x.Date)
       .Select(g => new
       {
           Month = g.Key,
           TotalDebit = g.Sum(x => x.Debit),
           TotalCredit = g.Sum(x => x.Credit),
           Records = g.ToList()
       })
       .OrderBy(x => x.Month)
       .ToList();

        return Ok(groupedData);
    }





    public IActionResult Demo()
    { 
        return View(ViewPath("Demo"));
    }
    [Authorize]
    public IActionResult CRM()
    {
        return View(ViewPath("CRM"));

    }
}
