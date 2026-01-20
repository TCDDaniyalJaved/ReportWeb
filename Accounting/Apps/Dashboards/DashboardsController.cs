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
    //[HttpGet]
    //public async Task<IActionResult> GetOrderStatistics()
    //{
    //    var data = await _context.AccountOpeningMviews
    //        .ToListAsync();

    //    // Group by company name and calculate totals
    //    var result = data
    //        .GroupBy(x => x.Companyname)
    //        .Select(g => new
    //        {
    //            category = g.Key,
    //            value = g.Sum(x => (x.Debit + x.Credit)) // Total transactions per company
    //        })
    //        .OrderByDescending(x => x.value)
    //        .Take(4) // Top 4 companies
    //        .ToList();

    //    // Alternative: Separate debit and credit
    //    var result2 = data
    //        .GroupBy(x => x.Companyname)
    //        .Select(g => new
    //        {
    //            category = g.Key,
    //            debit = g.Sum(x => x.Debit),
    //            credit = g.Sum(x => x.Credit),
    //            total = g.Sum(x => (x.Debit + x.Credit))
    //        })
    //        .OrderByDescending(x => x.total)
    //        .Take(4)
    //        .ToList();

    //    return Ok(result);
    //}
    [HttpGet]
    public IActionResult GetWeeklyRevenue()
    {
        var data = new
        {
            categories = new List<string> { "M", "T", "W", "T", "F", "S", "S" },
            series = new List<int> { 40, 95, 60, 45, 90, 50, 75 },
            colors = new List<string>
        {
            "#7367f0", "#7367f0", "#7367f0", "#7367f0",
            "#28c76f", "#7367f0", "#7367f0"
        }
        };

        return Json(data);
    }

    [HttpGet]
    public async Task<IActionResult> GetOrderStatistics()
    {
        var data = new List<dynamic>
        {
            new { category = "BMW", value = 3154},
            new { category = "SM Mobile", value = 3154},
            new { category = "Vintage Solutions", value = 3154},
            new { category = "VM Mobile", value = 3154},
        };

        return Json(data);
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
    public async Task<IActionResult> GetWeeklyExpenseSummary()
    {
        var data = await _context.AccountOpeningDviews
            .ToListAsync();

        //  Total expense (Debit ka sum)
        var totalExpense = data.Sum(x => x.Debit ?? 0);

        var target = 25000;

        return Ok(new
        {
            currentExpense = totalExpense,
            target = target
        });
    }
    public IActionResult GetTotalRevenue()
    {
        var result = new
        {
            categories = new List<string>
        {
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug"
        },
            series = new List<object>
        {
            new
            {
                name = DateTime.Now.Year,   // Current Year
                data = new List<int> { 18, 7, 15, 29, 18, 12, 9 ,7}
            },
            new
            {
                name = DateTime.Now.Year - 1, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            }
        }
        };

        return Json(result);
    }

    public IActionResult GetBrowserStats()
    {
        var data = new List<dynamic>
        {
            new { No = 1, Name = "Chrome", Icon = "chrome.png", Visits = 8920, Percentage = 64.75 },
            new { No = 2, Name = "Safari", Icon = "safari.png", Visits = 1290, Percentage = 18.43 },
            new { No = 3, Name = "Firefox", Icon = "firefox.png", Visits = 328, Percentage = 8.37 },
            new { No = 4, Name = "Edge", Icon = "edge.png", Visits = 142, Percentage = 6.12 },
            new { No = 5, Name = "Opera", Icon = "opera.png", Visits = 82, Percentage = 2.12 },
            new { No = 6, Name = "UC Browser", Icon = "uc.png", Visits = 328, Percentage = 20.14 }
        };

        return Json(data);
    }

    public IActionResult GetCountryStats()
    {
        var data = new List<dynamic>
    {
        new { No = 1, Name = "USA", Icon = "usa.png", Visits = 87240, Percentage = 38.12 },
        new { No = 2, Name = "Brazil", Icon = "brazil.png", Visits = 42680, Percentage = 28.23 },
        new { No = 3, Name = "India", Icon = "india.png", Visits = 12580, Percentage = 14.82 },
        new { No = 4, Name = "Australia", Icon = "australia.png", Visits = 4130, Percentage = 12.72 },
        new { No = 5, Name = "France", Icon = "france.png", Visits = 2210, Percentage = 7.11 },
        new { No = 6, Name = "Canada", Icon = "canada.png", Visits = 22350, Percentage = 15.13 }
    };

        return Json(data);
    }

    public IActionResult GetOperatingSystemStats()
    {
        var data = new List<dynamic>
        {
            new { No = 1, Name = "Windows", Icon = "windows.png", Visits = 8920, Percentage = 61.12 },
            new { No = 2, Name = "Mac", Icon = "mac.png", Visits = 1290, Percentage = 18.43 },
            new { No = 3, Name = "Ubuntu", Icon = "ubuntu.png", Visits = 328, Percentage = 8.37 },
            new { No = 4, Name = "Chrome", Icon = "chrome.png", Visits = 142, Percentage = 6.12 },
            new { No = 5, Name = "Cent", Icon = "cent.png", Visits = 82, Percentage = 2.12 },
            new { No = 6, Name = "Linux", Icon = "linux.png", Visits = 328, Percentage = 20.14 }
        };

        return Json(data);
    }
    public IActionResult Dummy()
    {
        return View(ViewPath("Dummy"));
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
