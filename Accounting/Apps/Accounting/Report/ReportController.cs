using Accounting.DTOs;
using Accounting.Helpers;
using Accounting.Models;
using Accounting.Services;
using Accounting.Services.Pdf;
using Dapper;
using DocumentFormat.OpenXml.Office.Word;
using DocumentFormat.OpenXml.Spreadsheet;
using Humanizer.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.Elfie.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using QuestPDF.Fluent;
using System.Configuration;
using System.Data;
using System.Data;
using System.Data.SqlClient;
using System.IO.Compression;
using System.Security.Claims;

namespace Accounting.Apps;


[Authorize]
[Route("Accounting/[controller]/[action]")]
public class ReportController : Controller
{
    #region Dependencies

    private readonly webappContext _context;
    private readonly webappContextProcedures _contextprocedure;
    private readonly IConfiguration _configuration;
    private readonly Base.Services.HtmlToPdfGenerator _pdfGenerator;


    #endregion
    private static readonly string BasePath = "Apps/Accounting/Report";
    #region Helpers

    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";

    #endregion
    #region Constructor

    public ReportController(
        webappContext context,
        webappContextProcedures contextprocedure,
        IConfiguration configuration,
        Base.Services.HtmlToPdfGenerator pdfGenerator
        )
    {
        _context = context;
        _contextprocedure = contextprocedure;
        _configuration = configuration;
        _pdfGenerator = pdfGenerator;

    }

    #endregion
    #region Views
    [Authorize]

    public IActionResult customerprofile(int id)
    {
        return View(ViewPath("customerprofile"));
    }
    [Authorize]

    public IActionResult WorkingTrialBalance(int id)
    {
        return View(ViewPath("WorkingTrialBalance"));
    }

    [Authorize]

    public IActionResult AccountSummary(int id)
    {
        return View(ViewPath("AccountSummary"));
    }
    [Authorize]

    public IActionResult AccountActivity(int id)
    {
        return View(ViewPath("AccountActivity"));
    }

    [Authorize]

    public IActionResult DailySummaryReport(int id)
    {
        return View(ViewPath("DailySummaryReport"));
    }

    [Authorize]

    public IActionResult StockSaleRate(int id)
    {
        return View(ViewPath("StockSaleRate"));
    }
    [Authorize]

    public IActionResult Ledger(int id)
    {
        return View(ViewPath("Ledger"));
    }

    #endregion
    #region Helper
    public class ReportRequest
    {
        public string CustomSearch { get; set; }
        public List<string> GroupByFields { get; set; } = new();

        public List<string> Account { get; set; } = new();

        public List<string> GroupName { get; set; } = new();

        public string fromDate { get; set; }
        public string toDate { get; set; }

        public int Start { get; set; } // offset
        public int Length { get; set; } // page size
        public Dictionary<string, List<string>> Filters { get; set; } = new();



    }

    #endregion
    #region GetDataCustomerProfile
    [HttpPost]
    public JsonResult GetDataCustomerProfile(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("CustomerProfileReport", con);
            cmd.CommandType = CommandType.StoredProcedure;



            //string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null;
            //var order = "";
            //cmd.Parameters.AddWithValue("@OrderBy", order);
            //cmd.Parameters.AddWithValue("@OrderBy", orderBy == null ? (object)DBNull.Value : orderBy);
            //var comapnyname = "best mobile";
            //cmd.Parameters.AddWithValue("@Companyname", comapnyname);
            //cmd.Parameters.AddWithValue("@Companyname", request.Account == null || !request.Account.Any() ? (object)DBNull.Value : string.Join(",", request.Account));
            //System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


            int start = request.Start >= 0 ? request.Start : 0;
            int length = request.Length > 0 ? request.Length : 10;
            cmd.Parameters.AddWithValue("@Start", start);
            cmd.Parameters.AddWithValue("@Length", length);
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < r.FieldCount; i++)
                    {
                        row[r.GetName(i)] = r.IsDBNull(i) ? "" : r.GetValue(i);
                    }
                    data.Add(row);
                }
            }
        }
        return Json(new
        {
            data,
            recordsTotal = data.Count + request.Start, // total so far
            recordsFiltered = data.Count + request.Start // filtered count so far
        });
    }
    #endregion


    #region WorkingTrialBalance
    [HttpPost]
    public JsonResult WorkingTrialBalance(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("AccountSummary", con);
            cmd.CommandType = CommandType.StoredProcedure;



            //string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null;
            //var order = "";
            //cmd.Parameters.AddWithValue("@OrderBy", order);
            //cmd.Parameters.AddWithValue("@OrderBy", orderBy == null ? (object)DBNull.Value : orderBy);
            //var comapnyname = "best mobile";
            //cmd.Parameters.AddWithValue("@Companyname", comapnyname);
            //cmd.Parameters.AddWithValue("@Companyname", request.Account == null || !request.Account.Any() ? (object)DBNull.Value : string.Join(",", request.Account));
            //System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


            int start = request.Start >= 0 ? request.Start : 0;
            int length = request.Length > 0 ? request.Length : 10;
            cmd.Parameters.AddWithValue("@Start", start);
            cmd.Parameters.AddWithValue("@Length", length);
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < r.FieldCount; i++)
                    {
                        row[r.GetName(i)] = r.IsDBNull(i) ? "" : r.GetValue(i);
                    }
                    data.Add(row);
                }
            }
        }
        return Json(new
        {
            data,
            recordsTotal = data.Count + request.Start, // total so far
            recordsFiltered = data.Count + request.Start // filtered count so far
        });
    }
    #endregion

    #region AccountSummary
    [HttpPost]
    public JsonResult AccountSummary(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("AccountSummary", con);
            cmd.CommandType = CommandType.StoredProcedure;



            //string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null;
            //var order = "";
            //cmd.Parameters.AddWithValue("@OrderBy", order);
            //cmd.Parameters.AddWithValue("@OrderBy", orderBy == null ? (object)DBNull.Value : orderBy);
            //var comapnyname = "best mobile";
            //cmd.Parameters.AddWithValue("@Companyname", comapnyname);
            //cmd.Parameters.AddWithValue("@Companyname", request.Account == null || !request.Account.Any() ? (object)DBNull.Value : string.Join(",", request.Account));
            //System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


            int start = request.Start >= 0 ? request.Start : 0;
            int length = request.Length > 0 ? request.Length : 10;
            cmd.Parameters.AddWithValue("@Start", start);
            cmd.Parameters.AddWithValue("@Length", length);
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < r.FieldCount; i++)
                    {
                        row[r.GetName(i)] = r.IsDBNull(i) ? "" : r.GetValue(i);
                    }
                    data.Add(row);
                }
            }
        }
        return Json(new
        {
            data,
            recordsTotal = data.Count + request.Start, // total so far
            recordsFiltered = data.Count + request.Start // filtered count so far
        });
    }
    #endregion
    #region AccountActivity
    [HttpPost]
    public JsonResult AccountActivity(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("AccountSummary", con);
            cmd.CommandType = CommandType.StoredProcedure;



            //string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null;
            //var order = "";
            //cmd.Parameters.AddWithValue("@OrderBy", order);
            //cmd.Parameters.AddWithValue("@OrderBy", orderBy == null ? (object)DBNull.Value : orderBy);
            //var comapnyname = "best mobile";
            //cmd.Parameters.AddWithValue("@Companyname", comapnyname);
            //cmd.Parameters.AddWithValue("@Companyname", request.Account == null || !request.Account.Any() ? (object)DBNull.Value : string.Join(",", request.Account));
            //System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


            int start = request.Start >= 0 ? request.Start : 0;
            int length = request.Length > 0 ? request.Length : 10;
            cmd.Parameters.AddWithValue("@Start", start);
            cmd.Parameters.AddWithValue("@Length", length);
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < r.FieldCount; i++)
                    {
                        row[r.GetName(i)] = r.IsDBNull(i) ? "" : r.GetValue(i);
                    }
                    data.Add(row);
                }
            }
        }
        return Json(new
        {
            data,
            recordsTotal = data.Count + request.Start, // total so far
            recordsFiltered = data.Count + request.Start // filtered count so far
        });
    }
    #endregion


    #region DailySummaryReport
    [HttpPost]
    public JsonResult DailySummaryReport(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("DailySummary", con);
            cmd.CommandType = CommandType.StoredProcedure;



            //string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null;
            //var order = "";
            //cmd.Parameters.AddWithValue("@OrderBy", order);
            //cmd.Parameters.AddWithValue("@OrderBy", orderBy == null ? (object)DBNull.Value : orderBy);
            //var comapnyname = "best mobile";
            //cmd.Parameters.AddWithValue("@Companyname", comapnyname);
            //cmd.Parameters.AddWithValue("@Companyname", request.Account == null || !request.Account.Any() ? (object)DBNull.Value : string.Join(",", request.Account));
            //System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


            int start = request.Start >= 0 ? request.Start : 0;
            int length = request.Length > 0 ? request.Length : 10;
            cmd.Parameters.AddWithValue("@Start", start);
            cmd.Parameters.AddWithValue("@Length", length);
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < r.FieldCount; i++)
                    {
                        row[r.GetName(i)] = r.IsDBNull(i) ? "" : r.GetValue(i);
                    }
                    data.Add(row);
                }
            }
        }
        return Json(new
        {
            data,
            recordsTotal = data.Count + request.Start, // total so far
            recordsFiltered = data.Count + request.Start // filtered count so far
        });
    }
    #endregion

    #region StockSaleRate
    [HttpPost]
    public JsonResult StockSaleRate(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("StockSale", con);
            cmd.CommandType = CommandType.StoredProcedure;



            //string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null;
            //var order = "";
            //cmd.Parameters.AddWithValue("@OrderBy", order);
            //cmd.Parameters.AddWithValue("@OrderBy", orderBy == null ? (object)DBNull.Value : orderBy);
            //var comapnyname = "best mobile";
            //cmd.Parameters.AddWithValue("@Companyname", comapnyname);
            //cmd.Parameters.AddWithValue("@Companyname", request.Account == null || !request.Account.Any() ? (object)DBNull.Value : string.Join(",", request.Account));
            //System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


            int start = request.Start >= 0 ? request.Start : 0;
            int length = request.Length > 0 ? request.Length : 10;
            cmd.Parameters.AddWithValue("@Start", start);
            cmd.Parameters.AddWithValue("@Length", length);
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < r.FieldCount; i++)
                    {
                        row[r.GetName(i)] = r.IsDBNull(i) ? "" : r.GetValue(i);
                    }
                    data.Add(row);
                }
            }
        }
        return Json(new
        {
            data,
            recordsTotal = data.Count + request.Start, // total so far
            recordsFiltered = data.Count + request.Start // filtered count so far
        });
    }
    #endregion
    #region AccountLedger
    [HttpPost]
    public JsonResult Ledger(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        using (var con = new SqlConnection(cs))
        {
            con.Open();

            var parameters = new DynamicParameters();

            parameters.Add("@SearchValue", string.IsNullOrWhiteSpace(request.CustomSearch) ? null : request.CustomSearch);
            parameters.Add("@AccountFrom", request.Account != null && request.Account.Any() ? string.Join(",", request.Account) : "");
            parameters.Add("@AccountTo", request.GroupName != null && request.GroupName.Any() ? string.Join(",", request.GroupName) : "");
            parameters.Add("@OrderBy", request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null);
            parameters.Add("@DateFrom1", string.Join(",", request.fromDate));
            parameters.Add("@DateTo1", string.Join(",", request.toDate));
            parameters.Add("@Start", request.Start >= 0 ? request.Start : 0);
            parameters.Add("@Length", request.Length > 0 ? request.Length : 10);


            var execDebug = GenerateExecString("AccountLedger", parameters);
            Console.WriteLine("DEBUG EXEC: " + execDebug); // ya log file me save karo

            // Dapper me Query ka result directly list of dynamic objects le sakte hain
            var data = con.Query("AccountLedger", parameters, commandType: CommandType.StoredProcedure)
                          .Select(row => (IDictionary<string, object>)row)
                          .Select(d => d.ToDictionary(k => k.Key, v => v.Value ?? ""))
                          .ToList();

            return Json(new
            {
                data,
                recordsTotal = data.Count + request.Start,
                recordsFiltered = data.Count + request.Start
            });
        }
    }
    #endregion
    #region GenerateExecString
    private string GenerateExecString(string spName, DynamicParameters parameters)
    {
        var parts = new List<string>();
        foreach (var name in parameters.ParameterNames)
        {
            var value = parameters.Get<object>(name);
            string formattedValue;

            if (value == null)
                formattedValue = "NULL";
            else if (value is string || value is DateTime)
                formattedValue = $"'{value}'";
            else
                formattedValue = value.ToString();

            parts.Add($"@{name} = {formattedValue}");
        }

        return $"EXEC {spName} {string.Join(", ", parts)}";
    }

    #endregion
    #region Helper Class LedgerPdfViewModel

    public class LedgerPdfViewModel
    {
        public IEnumerable<dynamic> Data { get; set; }  // ya strongly typed agar chahen
        public List<string> GroupByFields { get; set; } = new();
        public Dictionary<string, List<string>> Filters { get; set; } = new();
        public List<string> VisibleColumns { get; set; } = new();

    }
    #endregion
    #region LedgerPDf
    [HttpPost]
    public async Task<IActionResult> LedgerPdf([FromBody] ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");

        using var con = new SqlConnection(cs);

        // Prepare parameters
        var parameters = new DynamicParameters();

        parameters.Add("@SearchValue",
            string.IsNullOrWhiteSpace(request.CustomSearch) ? null : request.CustomSearch);

        parameters.Add("@AccountFrom",
            request.Account != null && request.Account.Any() ? string.Join(",", request.Account) : "");

        parameters.Add("@AccountTo",
            request.GroupName != null && request.GroupName.Any() ? string.Join(",", request.GroupName) : "");

        parameters.Add("@DateFrom1",
            string.IsNullOrEmpty(request.fromDate) ? null : request.fromDate);

        parameters.Add("@DateTo1",
            string.IsNullOrEmpty(request.toDate) ? null : request.toDate);

        parameters.Add("@Start", 0);
        parameters.Add("@Length", 2000); // large data
        parameters.Add("@OrderBy", request.GroupByFields != null && request.GroupByFields.Any()
            ? string.Join(",", request.GroupByFields)
            : null);

        // Fetch data asynchronously using Dapper
        IEnumerable<IDictionary<string, object>> data;
        try
        {
            var execDebug = GenerateExecString("AccountLedger", parameters);
            Console.WriteLine("DEBUG EXEC: " + execDebug); // ya log file me save karo
            var queryResult = await con.QueryAsync("AccountLedger", parameters, commandType: CommandType.StoredProcedure);
            data = queryResult
                    .Select(d => (IDictionary<string, object>)d)
                    .Select(d => d.ToDictionary(k => k.Key, v => v.Value ?? ""))
                    .ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine("Data fetch failed: " + ex.Message);
            return StatusCode(500, "Data fetch failed: " + ex.Message);
        }

        // Prepare model for PDF
        var visibleColumns = new List<string> { "Date", "VoucherNo", "OppName", "Debit", "Credit" };
        var model = new LedgerPdfViewModel
        {
            Data = data,
            Filters = request.Filters ?? new Dictionary<string, List<string>>(),
            GroupByFields = request.GroupByFields ?? new List<string>(),
            VisibleColumns = visibleColumns
        };

        string html;
        try
        {
            html = await this.RenderViewAsync(
                "~/Apps/Accounting/Report/LedgerPrint.cshtml",
                model,
                true);
        }
        catch (Exception ex)
        {
            Console.WriteLine("HTML rendering failed: " + ex.Message);
            return StatusCode(500, "HTML rendering failed: " + ex.Message);
        }

        // Generate PDF using async HtmlToPdfGenerator
        byte[] pdfBytes;
        try
        {
            Console.WriteLine("Starting PDF generation...");
            // Use the async version of your generator
            pdfBytes = await _pdfGenerator.GeneratePdfAsync(html);
            Console.WriteLine("PDF generation completed.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("PDF generation failed: " + ex.Message);
            return StatusCode(500, "PDF generation failed: " + ex.Message);
        }

        return File(pdfBytes, "application/pdf", "Ledger.pdf");
    }



    #region LedgerPdfMultiple
    [HttpPost]
    public async Task<IActionResult> LedgerPdfMultiple([FromBody] ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        using var con = new SqlConnection(cs);
        await con.OpenAsync();

        int pageSize = 2000;

        // Step 1: Fetch first page to check if data exists
        var countParams = new DynamicParameters();
        countParams.Add("@SearchValue", string.IsNullOrWhiteSpace(request.CustomSearch) ? null : request.CustomSearch);
        countParams.Add("@AccountFrom", request.Account != null && request.Account.Any() ? string.Join(",", request.Account) : "");
        countParams.Add("@AccountTo", request.GroupName != null && request.GroupName.Any() ? string.Join(",", request.GroupName) : "");
        countParams.Add("@DateFrom1", string.IsNullOrEmpty(request.fromDate) ? null : request.fromDate);
        countParams.Add("@DateTo1", string.IsNullOrEmpty(request.toDate) ? null : request.toDate);
        countParams.Add("@Start", 0);
        countParams.Add("@Length", 1); // just fetch 1 row to check existence

        var firstPage = await con.QueryAsync("AccountLedger", countParams, commandType: CommandType.StoredProcedure);
        if (!firstPage.Any())
            return BadRequest("No records found for the selected filters.");

        // Count total rows by calling SP with int.MaxValue and counting
        var totalParams = new DynamicParameters();
        totalParams.Add("@SearchValue", string.IsNullOrWhiteSpace(request.CustomSearch) ? null : request.CustomSearch);
        totalParams.Add("@AccountFrom", request.Account != null && request.Account.Any() ? string.Join(",", request.Account) : "");
        totalParams.Add("@AccountTo", request.GroupName != null && request.GroupName.Any() ? string.Join(",", request.GroupName) : "");
        totalParams.Add("@DateFrom1", string.IsNullOrEmpty(request.fromDate) ? null : request.fromDate);
        totalParams.Add("@DateTo1", string.IsNullOrEmpty(request.toDate) ? null : request.toDate);
        totalParams.Add("@Start", 0);
        totalParams.Add("@Length", int.MaxValue);

        var allRows = await con.QueryAsync("AccountLedger", totalParams, commandType: CommandType.StoredProcedure);
        int totalRows = allRows.Count();
        int totalPages = (int)Math.Ceiling((double)totalRows / pageSize);

        var pdfList = new List<byte[]>();

        // Step 2: Loop through pages
        for (int page = 0; page < totalPages; page++)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@SearchValue", string.IsNullOrWhiteSpace(request.CustomSearch) ? null : request.CustomSearch);
            parameters.Add("@AccountFrom", request.Account != null && request.Account.Any() ? string.Join(",", request.Account) : "");
            parameters.Add("@AccountTo", request.GroupName != null && request.GroupName.Any() ? string.Join(",", request.GroupName) : "");
            parameters.Add("@DateFrom1", string.IsNullOrEmpty(request.fromDate) ? null : request.fromDate);
            parameters.Add("@DateTo1", string.IsNullOrEmpty(request.toDate) ? null : request.toDate);
            parameters.Add("@Start", page * pageSize);
            parameters.Add("@Length", pageSize);
            parameters.Add("@OrderBy", request.GroupByFields != null && request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null);

            IEnumerable<IDictionary<string, object>> data;
            try
            {
                var queryResult = await con.QueryAsync("AccountLedger", parameters, commandType: CommandType.StoredProcedure);
                data = queryResult
                    .Select(d => (IDictionary<string, object>)d)
                    .Select(d => d.ToDictionary(k => k.Key, v => v.Value ?? ""))
                    .ToList();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Data fetch failed: " + ex.Message);
            }

            if (!data.Any())
                continue;

            var model = new LedgerPdfViewModel
            {
                Data = data,
                Filters = request.Filters ?? new Dictionary<string, List<string>>(),
                GroupByFields = request.GroupByFields ?? new List<string>(),
                VisibleColumns = new List<string> { "Date", "VoucherNo", "OppName", "Debit", "Credit" }
            };

            string html;
            try
            {
                html = await this.RenderViewAsync("~/Apps/Accounting/Report/LedgerPrint.cshtml", model, true);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "HTML rendering failed: " + ex.Message);
            }

            try
            {
                var pdfBytes = await _pdfGenerator.GeneratePdfAsync(html);
                if (pdfBytes == null || pdfBytes.Length < 100)
                    return StatusCode(500, $"PDF generation failed for page {page + 1}");
                pdfList.Add(pdfBytes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "PDF generation failed: " + ex.Message);
            }
        }

        if (!pdfList.Any())
            return BadRequest("No PDF generated.");

        // Step 3: Combine PDFs into ZIP safely
        byte[] zipBytes;
        using (var memoryStream = new MemoryStream())
        {
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                for (int i = 0; i < pdfList.Count; i++)
                {
                    var entry = archive.CreateEntry($"Ledger_Part_{i + 1}.pdf", CompressionLevel.Fastest);
                    using var entryStream = entry.Open();
                    await entryStream.WriteAsync(pdfList[i], 0, pdfList[i].Length);
                }
            }
            zipBytes = memoryStream.ToArray();
        }

        Response.Headers.Add("X-PDF-Parts", totalPages.ToString());
        return File(zipBytes, "application/zip", "LedgerReports.zip");
    }
    #endregion

    #endregion
    #region SaveReportView
    [HttpPost]
    public IActionResult SaveReportView([FromBody] UserReportView view)
    {
        try
        {
            if (view == null)
                return BadRequest("Invalid payload");

            int userId = Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Normalize JSON fields
            if (view.Filters != null && view.Filters.GetType() != typeof(string))
                view.Filters = JsonConvert.SerializeObject(view.Filters);

            if (view.GroupBy != null && view.GroupBy.GetType() != typeof(string))
                view.GroupBy = JsonConvert.SerializeObject(view.GroupBy);

            UserReportView entity;
            // ───────────────── UPDATE (ID based) ─────────────────
            if (view.Id > 0)
            {
                entity = _context.UserReportViews
                    .FirstOrDefault(x => x.Id == view.Id && x.UserId == userId);

                if (entity == null)
                    return NotFound("Record not found");

                // Default reset logic
                if (view.IsDefault)
                {
                    var defaultsToReset = _context.UserReportViews
                        .Where(x => x.UserId == userId &&
                                    x.ReportKey == entity.ReportKey &&
                                    x.IsDefault &&
                                    x.Id != entity.Id)
                        .ToList();

                    foreach (var d in defaultsToReset)
                        d.IsDefault = false;
                }

                entity.ViewName = view.ViewName;
                entity.ReportKey = view.ReportKey;
                entity.PageLenght = view.PageLenght;
                entity.Filters = view.Filters;
                entity.GroupBy = view.GroupBy;
                entity.IsDefault = view.IsDefault;
                entity.UpdatedAt = DateTime.Now;
            }
            // ───────────────── INSERT ─────────────────
            else
            {
                if (view.IsDefault)
                {
                    var defaultsToReset = _context.UserReportViews
                        .Where(x => x.UserId == userId &&
                                    x.ReportKey == view.ReportKey &&
                                    x.IsDefault)
                        .ToList();

                    foreach (var d in defaultsToReset)
                        d.IsDefault = false;
                }

                entity = new UserReportView
                {
                    ViewName = view.ViewName,
                    ReportKey = view.ReportKey,
                    PageLenght = view.PageLenght,
                    Filters = view.Filters,
                    GroupBy = view.GroupBy,
                    IsDefault = view.IsDefault,
                    UserId = userId,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.UserReportViews.Add(entity);
            }

            _context.SaveChanges();

            return Ok(new
            {
                success = true,
                id = entity.Id,
                message = "Saved successfully"
            });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }
    #endregion
    #region GetUserReportViews
    [HttpGet]
    public IActionResult GetUserReportViews(string reportKey)
    {
        // Get current logged-in user
        int userId = Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));

        // Fetch user's saved views for this report
        var views = _context.UserReportViews
            .Where(v => v.UserId == userId && v.ReportKey == reportKey && v.PageLenght == null)
            .Select(v => new
            {
                v.Id,
                v.ViewName,
                v.Filters,
                v.GroupBy,
                v.IsDefault,
                v.IsLocked
            })
            .OrderByDescending(v => v.IsDefault) // default view first
            .ThenBy(v => v.ViewName)
            .ToList();

        return Json(views);
    }
    #endregion


    #region GetDefaultLoad
    public IActionResult GetDefaultLoad2()
    {
        // Get the page URL from the referrer header
        string referrerUrl = HttpContext.Request.Headers["Referer"].ToString().ToLower();

        if (string.IsNullOrEmpty(referrerUrl))
            return Json(new { value = 20 }); // fallback if no referrer

        var url = new Uri(referrerUrl);
        string path = url.AbsolutePath;

        // Query the menu
        var load = _context.MainMenus
            .Where(x => x.Url.ToLower() == path)
            .Select(x => (int?)x.PageLength)
            .FirstOrDefault();

        if (load == null)
            load = 20; // default fallback

        return Json(new { value = load });
    }
    public IActionResult GetDefaultLoad()
    {
        string referrerUrl = HttpContext.Request.Headers["Referer"].ToString();
        //string referrerUrl = "https://localhost:44314/accounting/report/Ledger";
        if (string.IsNullOrEmpty(referrerUrl))
            return Json(new { id = (int?)null, value = 20 });

        var url = new Uri(referrerUrl);
        string path = url.AbsolutePath.ToLower();

        // Current User Id
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out int userId))
            return Json(new { id = (int?)null, value = 20 });

        //  USER SPECIFIC DEFAULT
        var userPageLength = _context.UserReportViews
            .Where(x =>
                x.UserId == userId &&
                x.ReportKey == "OpeningMaster" &&
                x.IsDefault
            )
            .Select(x => new
            {
                x.Id,
                x.PageLenght
            })
            .FirstOrDefault();

        if (userPageLength != null && userPageLength.PageLenght.HasValue)
        {
            //  User setting → ID + value
            return Json(new
            {
                id = userPageLength.Id,
                value = userPageLength.PageLenght.Value
            });
        }

        //  GLOBAL DEFAULT  ID NAHI AANI CHAHIYE)
        var globalPageLength = _context.MainMenus
            .Where(x => x.Url.ToLower() == path)
            .Select(x => (int?)x.PageLength)
            .FirstOrDefault();

        return Json(new
        {
            id = (int?)null,              //  hamesha null
            value = globalPageLength ?? 20
        });
    }



    #endregion


    #region GetReportFields

    [HttpGet]
    public IActionResult GetReportFields(string reportKey)
    {
        var fields = _context.ReportFilterGroupFields
            .Where(f => f.ReportKey == reportKey && f.IsActive)
            .OrderBy(f => f.SortOrder)
            .Select(f => new
            {
                f.FieldName,
                f.DisplayName,
                f.FieldType,
                f.IsFilterAllowed,
                f.IsGroupAllowed,
                f.DataSourceUrl,
                f.DefaultValue
            })
            .ToList();

        return Json(fields);
    }
    #endregion
}