using Accounting.Models;
using Accounting.Services;
using Accounting.ViewModel;
using Microsoft.AspNetCore.Mvc;
using Base.Services;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Session;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using QuestPDF.Helpers;
using System;
using System.Collections.Generic;
using System.ComponentModel.Design;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Controllers
{
    public class TrialBalanceController : Controller
    {
        private readonly webappContext _context;
        private readonly webappContextProcedures _contextproc;
        private readonly HtmlToPdfGenerator _pdfGenerator;


        public TrialBalanceController(webappContext context, webappContextProcedures contextproc, HtmlToPdfGenerator pdfGenerator)
        {
            _context = context;
            _contextproc = contextproc;
            _pdfGenerator = pdfGenerator;
        }


        //[HttpGet]
        //[HttpPost]
        //public async Task<IActionResult> WorkingTrialBalancePDF_Quest(DateTime DateFrom1, DateTime DateTo1)
        //{
        //    // Data fetch (same as before)
        //    var data = await _context.RpttrialBalances
        //        .FromSqlRaw(@"EXEC dbo.TrialBalanceReport @MenuID, @DateFrom1, @DateTo1, @DivisionFrom, @DivisionTo, @AccountFrom, @AccountTo, @cUserID, @IsSummmary",
        //            new SqlParameter("@MenuID", 0),
        //            new SqlParameter("@DateFrom1", DateFrom1),
        //            new SqlParameter("@DateTo1", DateTo1),
        //            new SqlParameter("@DivisionFrom", "DEMO"),
        //            new SqlParameter("@DivisionTo", "DEMO"),
        //            new SqlParameter("@AccountFrom", ""),
        //            new SqlParameter("@AccountTo", ""),
        //            new SqlParameter("@cUserID", 0),
        //            new SqlParameter("@IsSummmary", 1))
        //        .ToListAsync();

        //    // Grouping
        //    var grouped = data
        //        .GroupBy(x => x.AccountName?.Split('>').FirstOrDefault()?.Trim() ?? "Unknown")
        //        .Select(g => new
        //        {
        //            MainHead = g.Key,
        //            Items = g.ToList(),
        //            TotalDebit = g.Sum(i => (decimal?)(i.Debit ?? 0)) ?? 0,
        //            TotalCredit = g.Sum(i => (decimal?)(i.Credit ?? 0)) ?? 0
        //        })
        //        .ToList();

        //    decimal grandDebit = grouped.Sum(g => g.TotalDebit);
        //    decimal grandCredit = grouped.Sum(g => g.TotalCredit);

        //    // QuestPDF Document
        //    var document = Document.Create(container =>
        //    {
        //        container.Page(page =>
        //        {
        //            page.Size(PageSizes.A4);
        //            page.Margin(30);
        //            page.PageColor(Colors.White);
        //            page.DefaultTextStyle(x => x.FontSize(12).FontFamily("Arial"));

        //            page.Header().Column(col =>
        //            {
        //                col.Item().AlignCenter().Text("DEMO").FontSize(20).Bold();
        //                col.Item().AlignCenter().Text("Working Trial Balance").FontSize(16);
        //                col.Item().Height(10);
        //                col.Item().Row(row =>
        //                {
        //                    row.RelativeItem().Text($"From: {DateFrom1:dd-MM-yyyy}");
        //                    row.RelativeItem().Text($"To: {DateTo1:dd-MM-yyyy}").AlignRight();
        //                });
        //                col.Item().Row(row =>
        //                {
        //                    row.RelativeItem().Text($"Printed Date: {DateTime.Now:dd/MM/yyyy}");
        //                    row.RelativeItem().Text($"Time: {DateTime.Now:hh:mm tt}").AlignRight();
        //                });
        //                col.Item().Text("Page 1 of 1").FontSize(11);
        //                col.Item().PaddingTop(10);
        //            });

        //            page.Content().Column(col =>
        //            {
        //                col.Item().Table(table =>
        //                {
        //                    table.ColumnsDefinition(columns =>
        //                    {
        //                        columns.ConstantColumn(250);
        //                        columns.RelativeColumn();
        //                        columns.RelativeColumn();
        //                    });

        //                    table.Header(header =>
        //                    {
        //                        header.Cell().Text("Account Name").Bold().FontSize(12);
        //                        header.Cell().Text("Debit / Receipt").Bold().AlignRight();
        //                        header.Cell().Text("Credit / Payment").Bold().AlignRight();

        //                        header.Cell().Border(1).BorderColor(Colors.Black);
        //                        header.Cell().Border(1).BorderColor(Colors.Black);
        //                        header.Cell().Border(1).BorderColor(Colors.Black);
        //                    });

        //                    foreach (var group in grouped)
        //                    {
        //                        foreach (var item in group.Items)
        //                        {
        //                            string displayName = item.AccountName.Contains(">")
        //                                ? "    " + item.AccountName.Split('>').Last().Trim()
        //                                : item.AccountName.Trim();

        //                            table.Cell().Element(CellStyle => CellStyle
        //                                .Border(1).BorderColor(Colors.Black)
        //                                .PaddingLeft(8))
        //                                .Text(displayName).Bold();

        //                            table.Cell().Element(CellStyle => CellStyle
        //                                .Border(1).BorderColor(Colors.Black)
        //                                .PaddingRight(8))
        //                                .Text(item.Debit > 0 ? $"{item.Debit.Value:#,##0.00}" : "-").AlignRight();

        //                            table.Cell().Element(CellStyle => CellStyle
        //                                .Border(1).BorderColor(Colors.Black)
        //                                .PaddingRight(8))
        //                                .Text(item.Credit > 0 ? $"{item.Credit.Value:#,##0.00}" : "-").AlignRight();
        //                        }

        //                        // Total Amount Row
        //                        table.Cell().Element(CellStyle => CellStyle.Border(1).BorderColor(Colors.Black))
        //                            .Text("Total Amount:").Bold().PaddingLeft(8);

        //                        table.Cell().Element(CellStyle => CellStyle
        //                            .Border(1).BorderColor(Colors.Black)
        //                            .BorderBottom(2))
        //                            .Text(group.TotalDebit.ToString("#,##0.00")).Bold().AlignRight().PaddingRight(8);

        //                        table.Cell().Element(CellStyle => CellStyle
        //                            .Border(1).BorderColor(Colors.Black)
        //                            .BorderBottom(2))
        //                            .Text(group.TotalCredit.ToString("#,##0.00")).Bold().AlignRight().PaddingRight(8);
        //                    }

        //                    // Grand Total
        //                    table.Cell().Text("Grand Total Amount:").Bold().PaddingLeft(8);
        //                    table.Cell().Element(CellStyle => CellStyle
        //                        .Border(1).BorderColor(Colors.Black)
        //                        .BorderBottom(4).BorderBottomColor(Colors.Black))
        //                        .Text(grandDebit.ToString("#,##0.00")).Bold().AlignRight().PaddingRight(8);

        //                    table.Cell().Element(CellStyle => CellStyle
        //                        .Border(1).BorderColor(Colors.Black)
        //                        .BorderBottom(4).BorderBottomColor(Colors.Black))
        //                        .Text(grandCredit.ToString("#,##0.00")).Bold().AlignRight().PaddingRight(8);
        //                });
        //            });

        //            page.Footer().AlignCenter().Text(x =>
        //            {
        //                x.CurrentPageNumber();
        //                x.Span(" / ");
        //                x.TotalPages();
        //            });
        //        });
        //    });

        //    var pdfBytes = document.GeneratePdf();

        //    var fileName = $"Working_Trial_Balance_{DateFrom1:ddMMyyyy}_to_{DateTo1:ddMMyyyy}.pdf";
        //    return File(pdfBytes, "application/pdf", fileName);
        //}

        [HttpPost]
        [HttpGet]
        public async Task<IActionResult> WorkingTrialBalancePDF(DateTime DateFrom1, DateTime DateTo1)
        {
            // --- 1. Stored Proc Params (same as before) ---
            var parameters = new[]
            {
                new SqlParameter("@MenuID", SqlDbType.BigInt)               { Value = 0 },
                new SqlParameter("@DateFrom1", SqlDbType.Date)              { Value = DateFrom1.Date },
                new SqlParameter("@DateTo1", SqlDbType.Date)                { Value = DateTo1.Date },
                new SqlParameter("@DivisionFrom", SqlDbType.NVarChar, 50)   { Value = "DEMO" },
                new SqlParameter("@DivisionTo", SqlDbType.NVarChar, 50)     { Value = "DEMO" },
                new SqlParameter("@AccountFrom", SqlDbType.NVarChar, 50)    { Value = "" },
                new SqlParameter("@AccountTo", SqlDbType.NVarChar, 50)      { Value = "" },
                new SqlParameter("@cUserID", SqlDbType.BigInt)              { Value = 0 },
                new SqlParameter("@IsSummmary", SqlDbType.Int)              { Value = 1 },
             };

            var data = await _context.RpttrialBalances
                .FromSqlRaw("EXEC dbo.TrialBalanceReport @MenuID, @DateFrom1, @DateTo1, @DivisionFrom, @DivisionTo, @AccountFrom, @AccountTo, @cUserID, @IsSummmary", parameters)
                .ToListAsync();

            // --- 2. Grouping (same logic) ---
            var grouped = data
                .GroupBy(x => x.AccountName?.Split('>')[0].Trim() ?? "Unknown")
                .Select(g => new
                {
                    MainHead = g.Key,
                    Items = g.ToList(),
                    TotalDebit = g.Sum(i => (decimal?)(i.Debit ?? 0)),
                    TotalCredit = g.Sum(i => (decimal?)(i.Credit ?? 0))
                })
                .ToList();

            decimal grandDebit = grouped.Sum(g => g.TotalDebit ?? 0);
            decimal grandCredit = grouped.Sum(g => g.TotalCredit ?? 0);

            // --- 3. HTML (redesigned to mimic screenshot) ---
            var blue = "#2F5597"; // screenshot-like blue
            var sb = new StringBuilder();
            sb.Append($@"<!DOCTYPE html>
                        <html>
                        <head>
                        <meta charset='utf-8' />
                        <style>
                            @page {{ margin: 40px 30px; }}
                            body {{ font-family: 'Arial', sans-serif; color:#222; font-size:12px; margin:0; }}
                            .container {{ padding: 10px 10px 30px 10px; }}
                            .header {{ color:{blue}; text-align:left; margin-bottom:10px; }}
                            .company {{ font-size:22px; font-weight:700; letter-spacing:0.5px; }}
                            .report-title {{ font-size:14px; margin-top:4px; color:{blue}; font-weight:600; }}
                            .info-row {{ margin-top:8px; display:flex; justify-content:space-between; align-items:center; }}
                            .info-box {{ border:1px solid #bfcfe8; padding:6px 8px; font-size:11px; color:#2b3b4f; min-width:220px; }}
                            .info-left {{ display:flex; gap:10px; align-items:center; }}
                            .meta-small {{ font-size:11px; color:#233a5b; }}
                            .page-info {{ font-size:11px; color:#233a5b; }}
                            table.report {{ width:100%; border-collapse:collapse; margin-top:12px; }}
                            table.report thead th {{ text-align:left; padding:10px 8px; background:transparent; color:{blue}; border-bottom:2px solid {blue}; font-weight:700; font-size:12px; }}
                            table.report tbody td {{ padding:8px 8px; border-bottom:1px solid #d8e4f5; vertical-align:top; }}
                            .acc-name {{ font-weight:700; color:#16325c; padding-left:4px; }}
                            .sub-acc {{ padding-left:22px; color:#123; font-weight:600; }}
                            .text-right {{ text-align:right; white-space:nowrap; }}
                            .total-row td {{ border-top: none; border-bottom: none; padding-top:6px; padding-bottom:6px; }}
                            .group-total td.label {{ font-weight:700; color:#16325c; }}
                            .underline-left {{ border-bottom:2px solid #bfcfe8; }}
                            .double-underline-right {{ border-bottom:3px double #16325c; }}
                            .thin-line {{ border-bottom:1px solid #d8e4f5; }}
                            .spacer-row td {{ border:none; height:12px; }}
                            .grand-total td {{ font-weight:800; color:#16325c; }}
                            /* ensure numbers line up at right */
                            .col-account {{ width:50%; }}
                            .col-debit {{ width:25%; }}
                            .col-credit {{ width:25%; }}
                            /* small caps label for total */
                            .tot-label {{ font-size:12px; text-transform:capitalize; }}
</style>
</head>
<body>
<div class='container'>
    <div class='header'>
        <div class='company'>DEMO</div>
        <div class='report-title'>Working Trial Balance</div>
    </div>

    <div class='info-row'>
        <div class='info-left'>
            <div class='info-box'>
                <strong>From:</strong> {DateFrom1:dd-MM-yyyy} &nbsp;&nbsp; <strong>To:</strong> {DateTo1:dd-MM-yyyy}
            </div>
            <div class='info-box'>
                <strong>Printed Date:</strong> {DateTime.Now:dd/MM/yyyy} &nbsp;&nbsp; <strong>Time:</strong> {DateTime.Now:hh:mmtt}
            </div>
        </div>
        <div class='page-info'>
            Page 1 of 1
        </div>
    </div>

    <table class='report' role='table'>
        <thead>
            <tr>
                <th class='col-account'>Account Name</th>
                <th class='col-debit text-right'>Debit / Receipt</th>
                <th class='col-credit text-right'>Credit / Payment</th>
            </tr>
        </thead>
        <tbody>");

            // --- 4. Rows per group ---
            foreach (var group in grouped)
            {
                // Group header (Main head)
                sb.Append($@"<tr>
            <td class='acc-name col-account'>{System.Net.WebUtility.HtmlEncode(group.MainHead)}</td>
            <td class='text-right col-debit'></td>
            <td class='text-right col-credit'></td>
        </tr>");

                foreach (var item in group.Items)
                {
                    string fullName = item.AccountName ?? "";
                    string displayName = fullName.Contains(">") ? fullName.Split('>').Last().Trim() : fullName.Trim();
                    bool isSub = fullName.Contains(">");

                    string nameClass = isSub ? "sub-acc" : "acc-name";
                    string debitText = (item.Debit.HasValue && item.Debit > 0) ? item.Debit.Value.ToString("#,##0.00") : "-";
                    string creditText = (item.Credit.HasValue && item.Credit > 0) ? item.Credit.Value.ToString("#,##0.00") : "-";

                    sb.Append($@"<tr>
                <td class='{nameClass} col-account'>{System.Net.WebUtility.HtmlEncode(displayName)}</td>
                <td class='text-right col-debit'>{debitText}</td>
                <td class='text-right col-credit'>{creditText}</td>
            </tr>");
                }

                // Group total row with underline look
                sb.Append($@"<tr class='total-row'>
            <td class='group-total label col-account tot-label'>Total Amount:</td>
            <td class='text-right group-total col-debit'><span style='display:inline-block; min-width:100px; border-bottom:2px solid #d9e6fb; padding-bottom:2px; font-weight:700;'>{(group.TotalDebit ?? 0M):#,##0.00}</span></td>
            <td class='text-right group-total col-credit'><span style='display:inline-block; min-width:100px; border-bottom:2px solid #d9e6fb; padding-bottom:2px; font-weight:700;'>{(group.TotalCredit ?? 0M):#,##0.00}</span></td>
        </tr>");

                // spacer
                sb.Append("<tr class='spacer-row'><td colspan='3'></td></tr>");
            }

            // Grand total with double underline on amounts (right side)
            sb.Append($@"<tr class='grand-total'>
        <td class='tot-label col-account'>Grand Total Amount:</td>
        <td class='text-right col-debit'><span style='display:inline-block; min-width:130px; border-bottom:4px double #16325c; padding-bottom:3px; font-weight:800;'>{grandDebit:#,##0.00}</span></td>
        <td class='text-right col-credit'><span style='display:inline-block; min-width:130px; border-bottom:4px double #16325c; padding-bottom:3px; font-weight:800;'>{grandCredit:#,##0.00}</span></td>
    </tr>");

            sb.Append(@"
        </tbody>
    </table>
</div>
</body>
</html>");

            // --- 5. Generate PDF (your existing service) ---
            var html = sb.ToString();
            var pdfBytes = _pdfGenerator.GeneratePdf(sb.ToString());
            var fileName = $"Working_Trial_Balance_{DateFrom1:ddMMyyyy}_to_{DateTo1:ddMMyyyy}.pdf"; return File(pdfBytes, "application/pdf", fileName);

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
            //  var myList = db.RPTAccountLedger(0, FDate.ToShortDateString(), TDate.ToShortDateString(), CompanyID, CompanyID, AccountID, AccountID, 0, 1).ToList();

            //    var users = await _context.RpttrialBalances
            //      .FromSqlRaw("EXEC dbo.TrialBalanceReport 0 ,'01-01-2001' , '01-01-2050' ,'DEMO', 'DEMO' ,'' , '' , 0 ,1")


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

                // Start with an IQueryable query
                //var query = await _context.RpttrialBalances
                //  .FromSqlRaw("EXEC dbo.TrialBalanceReport @MenuID, @DateFrom1, @DateTo1, @DivisionFrom, @DivisionTo, @AccountFrom, @AccountTo, @cUserID, @IsSummmary",
                //    MenuID, DateFrom1, DateTo1, DivisionFrom, DivisionTo, AccountFrom, AccountTo, cUserID, IsSummmary)
                //  .ToListAsync();

                var query = (from tempcustomer in await _context.RpttrialBalances
                                    .FromSqlRaw("EXEC dbo.TrialBalanceReport @MenuID, @DateFrom1, @DateTo1, @DivisionFrom, @DivisionTo, @AccountFrom, @AccountTo, @cUserID, @IsSummmary",
                                      MenuID, DateFrom1, DateTo1, DivisionFrom, DivisionTo, AccountFrom, AccountTo, cUserID, IsSummmary)
                                    .ToListAsync()
                             select tempcustomer);

                // Apply search filtering
                if (!string.IsNullOrEmpty(searchValue))
                {
                    query = query.Where(m => m.AccountName.Contains(searchValue));
                }

                // Set a default column if columnName is empty or null
                if (string.IsNullOrEmpty(columnName))
                {
                    columnName = "ID"; // Default to primary key or another default column
                }

                // Apply sorting dynamically
                if (!string.IsNullOrEmpty(columnName))
                {
                    query = sortColumnDirection == "asc"
                        ? query.OrderBy(e => EF.Property<object>(e, columnName))
                        : query.OrderByDescending(e => EF.Property<object>(e, columnName));
                }

                // Get total records count before pagination
                int recordsTotal = query.Count();

                var data = query.ToList();
                // Apply pagination
                //var data = pageSize == -1
                //    ? query.ToList()  // Fetch all records if "All" is selected
                //    : query.Skip(skip).Take(pageSize).ToList(); // Apply pagination otherwise

                // Return JSON response
                var jsonData = new { draw = draw, recordsFiltered = recordsTotal, recordsTotal = recordsTotal, data = data };
                return Ok(jsonData);
            }
            catch (Exception ex)
            {
                // Log the exception for debugging
                // Consider using a logging framework, e.g., Serilog, NLog, etc.
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