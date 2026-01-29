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
    //[Authorize]

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

    public IActionResult ThrowTest()
    {
        throw new Exception("Test exception!");
    }
    public IActionResult UnderConstruction()
    {
        // Optional: set 500 status code
        Response.StatusCode = 503;
        return View(ViewPath("UnderConstruction"));
    }

    public IActionResult CommingSoon()
    {
        // Optional: set 500 status code
        //Response.StatusCode = 500;
        return View(ViewPath("CommingSoon"));
    }

    public IActionResult NotFound()
    {
        Response.StatusCode = 404; // Browser  404 
        //return View(); // Returns Views/Dashboard/NotFound.cshtml
        return View(ViewPath("NotFound"));

    }

    [HttpGet]
    public IActionResult GetWeeklyRevenue()
    {
        var data = new
        {
            categories = new List<string>
        {
            "M", "T", "W", "T", "F", "S", "S"
        },
            series = new List<int>
        {
            1200, 1800, 1500, 1300, 3200, 1700, 2000
        }
        };

        return Ok(data);
    }


    [HttpGet]
    public async Task<IActionResult> GetWeeklyRevenue2()
    {
        var data = await _context.AccountOpeningDviews
           .Select(x => new
           {
               x.VmonthName,
               x.TotalDebit,
           })
           .ToListAsync();

        // Group by Month
        var groupedData = data
       .GroupBy(x => x.VmonthName)
       .Select(g => new
       {
           Month = g.Key,
           TotalDebit = g.Sum(x => x.TotalDebit),
           Records = g.ToList()
       })
       .OrderBy(x => x.Month)
       .ToList();


        return Ok(groupedData);
    }
    [HttpGet]
    public async Task<IActionResult> GetWeeklyRevenue3()
    {
        var data = await _context.AccountOpeningDviews
            .Select(x => new
            {
                x.VmonthName, // full month name
                x.TotalDebit
            })
            .ToListAsync();

        // Group by Month
        var groupedData = data
            .GroupBy(x => x.VmonthName)
            .Select(g => new
            {
                Month = g.Key,
                TotalDebit = g.Sum(x => x.TotalDebit)
            })
            .OrderBy(x => x.Month) // optional: order alphabetically or by month number
            .ToList();

        // Prepare response with full month names
        var response = new
        {
            categories = groupedData.Select(x => x.Month).ToArray(), // full month names
            series = groupedData.Select(x => x.TotalDebit).ToArray()
        };

        return Ok(response);
    }


    public IActionResult GetIncomeData()
    {
        var data = new
        {
            series = new List<int> { 2100, 3000, 2200, 4200, 2600, 3500, 2900 }
        };

        return Ok(data);
    }
    [HttpGet]
    public IActionResult GetMonthlyRevenue()
    {
        var data = new
        {
            categories = new List<string>
        {
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        },
            series = new List<int>
        {
            5200, 6800, 6100, 7400, 8900, 6200,
            8100, 7700, 9300, 8800, 9600, 11200
        }
        };

        return Ok(data);
    }
    [HttpGet]
    public async Task<IActionResult> GetMonthlyRevenue2()
    {
        var data = await _context.ViewMonthlyRevenues
            .ToListAsync();

        return Ok(data);
    }

    public async Task<IActionResult> GetMonthlyRevenue3(string range = "1Y")
    {
        int currentYear = DateTime.Now.Year;
        int months = range switch
        {
            "1M" => 1,
            "6M" => 6,
            "1Y" => 12,
            "5Y" => 60,
            _ => int.MaxValue // MAX
        };

        var query = _context.ViewMonthlyRevenues
            .OrderByDescending(x => x.SalesYear)
            .ThenByDescending(x => x.MonthNumber);

        if (months != int.MaxValue)
        {
            query = (IOrderedQueryable<ViewMonthlyRevenue>)query.Take(months);
        }

        var data = await query
            .OrderBy(x => x.SalesYear)
            .ThenBy(x => x.MonthNumber)
            .Select(x => new
            {
                monthName = $"{x.MonthName} {x.SalesYear}",
                totalRevenue = x.TotalRevenue
            })
            .ToListAsync();

        return Ok(data);
    }


    public async Task<IActionResult> GetExpanseRevenue2()
    {
        var data = await _context.ViewMonthlyExpenses
            .ToListAsync();

        return Ok(data);
    }


    public async Task<IActionResult> GetProfitRevenue2()
    {
        var data = await _context.ViewMonthlyProfits
            .ToListAsync();

        return Ok(data);
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
    public async Task<IActionResult> GetAllData2(string from = null, string to = null)
    {
        var query = _context.AccountOpeningDviews.AsQueryable();

      
        if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out DateTime fromDate))
        {
            query = query.Where(x => x.Vdate >= fromDate);
        }

        if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out DateTime toDate))
        {
            
            toDate = toDate.Date.AddDays(1).AddTicks(-1);
            query = query.Where(x => x.Vdate <= toDate);
        }

       
        var data = await query
            .OrderBy(x => x.Vdate) 
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllData()
    {
        var data = await _context.AccountOpeningDviews
            .ToListAsync();

        return Ok(data);
    }


    [HttpGet]
    public IActionResult GetData()
    {
        var data = _context.AccountOpeningDviews
            .ToListAsync();

        return Ok(data);
    }



    [HttpGet]
    public async Task<IActionResult> GetAllDataVoucher2(string period = "Max")
    {

        // Get current date
        var today = DateTime.Today;
        DateTime? startDate = null;

        // Calculate start date based on period
        switch (period)
        {
            case "1D":
                startDate = today.AddDays(-1);
                break;
            case "5D":
                startDate = today.AddDays(-5);
                break;
            case "1M":
                startDate = today.AddMonths(-1);
                break;
            case "1Y":
                startDate = today.AddYears(-1);
                break;
            case "5Y":
                startDate = today.AddYears(-5);
                break;
            case "Max":
            default:
                startDate = null; // All data
                break;
        }

        // Base query
        var query = _context.AccountOpeningDviews.AsQueryable();

        // Apply date filter if startDate exists
        if (startDate.HasValue)
        {
            query = query.Where(x => x.Vdate >= startDate.Value);
        }

        // Fetch and process data
        var data = await query
            .Select(x => new
            {
                x.Accounts,
                x.Vdate,
                x.Remarks,
                x.Voucher,
                x.VmonthName,
                x.Vyear,
                x.TotalDebit,
                x.Credit,
                x.Debit,
                x.PersonId
            })
            .ToListAsync();

        // Group by Voucher
        var groupedData = data
            .GroupBy(x => x.Voucher)
            .Select(g => new
            {
                Voucher = g.Key,
                TotalDebit = g.Sum(x => x.TotalDebit ?? 0),
                TotalCredit = g.Sum(x => x.Credit ?? 0),
                Records = g.ToList()
            })
            .OrderBy(x => x.Voucher)
            .ToList();

        return Ok(groupedData);
    }
    [HttpGet]
    public async Task<IActionResult> GetAllDataVoucher()
    {
        // Fetch all data
        var data = await _context.AccountOpeningDviews
            .Select(x => new
            {
                x.Accounts,
                x.Vdate,
                x.Remarks,
                x.Voucher,
                x.VmonthName,
                x.Vyear,
                x.TotalDebit,
                x.Credit,
                x.Debit,
                x.PersonId
            })
            .ToListAsync();

        // Group by Voucher
        var groupedData = data
            .GroupBy(x => x.Voucher)
            .Select(g => new
            {
                Voucher = g.Key,
                TotalDebit = g.Sum(x => x.TotalDebit ?? 0),   // handle nulls
                TotalCredit = g.Sum(x => x.Credit ?? 0),     // handle nulls
                Records = g.ToList()
            })
            .OrderBy(x => x.Voucher) // optional: can order by date if needed
            .ToList();

        return Ok(groupedData);
    }

    public async Task<IActionResult> GetAllData4()
    {
        var data = await _context.AccountOpeningDviews
     .GroupBy(x => new { x.Vyear, x.Vmonth, x.VmonthName })
     .Select(g => new
     {
         Year = g.Key.Vyear,
         Month = g.Key.Vmonth,
         MonthName = g.Key.VmonthName,
         TotalDebit = g.Sum(x => x.Debit ?? 0),
         TotalCredit = g.Sum(x => x.Credit ?? 0),
         TotalRecords = g.Count()
     })
     .ToListAsync();

        return Ok(data);
    }
    public async Task<IActionResult> GetAllDataGraph()
    {
        var data = await _context.AccountOpeningGraphViews.ToListAsync();
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
    public IActionResult GetTotalRevenue5()
    {
        var result = new
        {
            categories1 = new List<string>
        {
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug"
        },
            series1 = new List<object>
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
            },

            new
            {
                name = DateTime.Now.Year - 2, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            },

             new
            {
                name = DateTime.Now.Year - 3, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            },
              new
            {
                name = DateTime.Now.Year - 4, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            },
                  new
            {
                name = DateTime.Now.Year - 5, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            },

                      new
            {
                name = DateTime.Now.Year - 6, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            },

                          new
            {
                name = DateTime.Now.Year - 7, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            },

                              new
            {
                name = DateTime.Now.Year - 8, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            },

                                  new
            {
                name = DateTime.Now.Year - 9, // Previous Year
                data = new List<int> { -13, -18, -9, -14, -5, -17, -15,-8 }
            }


        }
        };

        return Json(result);
    }



    public async Task<IActionResult> GetTotalRevenue6()
    {
        var data = _context.VwTotalRevenues
         .OrderBy(x => x.MonthOrder)
         .ToList();

        // Categories (Months)
        var categories = data
            .Select(x => x.MonthName)
            .Distinct()
            .ToList();

        // Series (Year wise)
        var series = data
            .GroupBy(x => x.Year)
            .OrderByDescending(g => g.Key)
            .Select(g => new
            {
                name = g.Key,   // Year
                data = g
                    .OrderBy(x => x.MonthOrder)
                    .Select(x => x.Amount)
                    .ToList()
            })
            .ToList();

        return Json(new
        {
            categories = categories,
            series = series
        });

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
        new { No = 1, Name = "Fire Fox", Icon = "firefox.png", Visits = 87240, Percentage = 38.12 },
        new { No = 2, Name = "Apple", Icon = "mac.png", Visits = 42680, Percentage = 28.23 },
        new { No = 3, Name = "Linux", Icon = "linux.png", Visits = 12580, Percentage = 14.82 },
        new { No = 4, Name = "Linkedin", Icon = "linkedin.png", Visits = 4130, Percentage = 12.72 },
        new { No = 5, Name = "Instagram", Icon = "instagram.png", Visits = 2210, Percentage = 7.11 },
        new { No = 6, Name = "Vue", Icon = "vue-label.png", Visits = 22350, Percentage = 15.13 }
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
    [HttpGet]
    public async Task<IActionResult> GetAllDataMonth2()
    {
        var data = await _context.AccountOpeningDviews
            .Select(x => new
            {
                x.Accounts,
                x.Vdate,
                x.Remarks,
                x.Voucher,
                x.VmonthName,
                x.Vyear,
                x.TotalDebit,
                x.Credit,
                x.Debit,
                x.PersonId,
            })
            .ToListAsync();

        // Group by Year and Month
        var groupedData = data
       .GroupBy(x => x.VmonthName)
       .Select(g => new
       {
           Month = g.Key,
           TotalDebit = g.Sum(x => x.TotalDebit),
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
