using Accounting.DTOs;
using Accounting.Helpers;
using Accounting.Models;
using Accounting.Services;
using Accounting.Services.Pdf;
using Accounting.ViewModel;
using Humanizer.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using QuestPDF.Fluent;
using System.Configuration;
using System.Data;
using System.Data;
using System.Data.SqlClient;
using System.Security.Claims;

namespace Accounting.Controllers;

[Authorize]
[Route("Accounting/[controller]/[action]")]
public class ReportController : Controller
{
    #region Dependencies

    private readonly webappContext _context;
    private readonly webappContextProcedures _contextprocedure;
    private readonly IConfiguration _configuration;

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
        IConfiguration configuration
        )
    {
        _context = context;
        _contextprocedure = contextprocedure;
        _configuration = configuration;
    }

    #endregion

    #region Views

    public IActionResult Demo(int id)
    {
        return View(ViewPath("Demo"));
    }

    public IActionResult Dummy(int id)
    {
        return View(ViewPath("Dummy"));
    }


    public IActionResult customerprofile(int id)
    {
        return View(ViewPath("customerprofile"));
    }
    public IActionResult index(int id)
    {
        return View(ViewPath("index"));
    }

    [Authorize]
    public IActionResult ItemData()
    {
        return View(ViewPath("ItemData"));
    }

    #endregion
    public class ReportRequest
    {
        public string CustomSearch { get; set; }
        public List<string> GroupByFields { get; set; } = new();

        public List<string> CompanyId { get; set; } = new();
        public int Start { get; set; } // offset
        public int Length { get; set; } // page size


    }
    [HttpPost]
    public JsonResult GetData(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("GetAccountOpeningReportData", con);
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.AddWithValue("@SearchValue",
                string.IsNullOrWhiteSpace(request.CustomSearch)
                ? (object)DBNull.Value
                : request.CustomSearch);

            string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null;

            cmd.Parameters.AddWithValue("@OrderBy", orderBy == null ? (object)DBNull.Value : orderBy);
            //var comapnyname = "best mobile";
            //cmd.Parameters.AddWithValue("@Companyname", comapnyname);
            cmd.Parameters.AddWithValue("@Companyname", request.CompanyId == null || !request.CompanyId.Any() ? (object)DBNull.Value : string.Join(",", request.CompanyId));
            System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


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




    [HttpPost]
    public JsonResult GetDataCustomerProfile()
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
            //cmd.Parameters.AddWithValue("@Companyname", request.CompanyId == null || !request.CompanyId.Any() ? (object)DBNull.Value : string.Join(",", request.CompanyId));
            //System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


            //int start = request.Start >= 0 ? request.Start : 0;
            //int length = request.Length > 0 ? request.Length : 10;
            //cmd.Parameters.AddWithValue("@Start", start);
            //cmd.Parameters.AddWithValue("@Length", length);
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
            recordsTotal = data.Count , // total so far
            recordsFiltered = data.Count  // filtered count so far
        });
    }


        [HttpPost]
    public JsonResult GetDataStatic(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("GetAccountOpeningReportData_Static", con);
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.AddWithValue("@SearchValue",
                string.IsNullOrWhiteSpace(request.CustomSearch)
                ? (object)DBNull.Value
                : request.CustomSearch);

            string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields) : null;
            //var order = "";
            //cmd.Parameters.AddWithValue("@OrderBy", order);
            cmd.Parameters.AddWithValue("@OrderBy", orderBy == null ? (object)DBNull.Value : orderBy);
            //var comapnyname = "best mobile";
            //cmd.Parameters.AddWithValue("@Companyname", comapnyname);
            cmd.Parameters.AddWithValue("@Companyname", request.CompanyId == null || !request.CompanyId.Any() ? (object)DBNull.Value : string.Join(",", request.CompanyId));
            System.Diagnostics.Debug.WriteLine($"Received Start: {request.Start}, Length: {request.Length}");


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

    public JsonResult GetData2()
    {
        try
        {
            string connectionString = _configuration.GetConnectionString("Default");
            var data = new List<Dictionary<string, object>>();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("GetAccountOpeningReportData", conn);
                cmd.CommandType = CommandType.StoredProcedure;

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var row = new Dictionary<string, object>();

                        // Get each column value with proper handling
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            string columnName = reader.GetName(i);
                            object value = reader.GetValue(i);

                            // Handle DBNull values
                            if (value == DBNull.Value)
                            {
                                if (reader.GetFieldType(i) == typeof(DateTime))
                                    value = null;
                                else if (reader.GetFieldType(i) == typeof(decimal))
                                    value = 0;
                                else
                                    value = "";
                            }

                            row[columnName] = value;
                        }

                        data.Add(row);
                    }
                }
            }

            return Json(new
            {
                success = true,
                data = data,
                count = data.Count
            });
        }
        catch (Exception ex)
        {
            return Json(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    //[HttpPost]
    //public IActionResult SaveReportView([FromBody] UserReportView view)
    //{


    //    try
    //    {

    //        if (view == null)
    //            return BadRequest();

    //        view.CreatedAt = DateTime.Now;
    //        view.UpdatedAt = DateTime.Now;

    //        int userId = Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));
    //        view.UserId = userId;


    //        if (view.Filters != null && !(view.Filters is string))
    //            view.Filters = JsonConvert.SerializeObject(view.Filters);

    //        if (view.GroupBy != null && !(view.GroupBy is string))
    //            view.GroupBy = JsonConvert.SerializeObject(view.GroupBy);

    //        _context.UserReportViews.Add(view);
    //        _context.SaveChanges();

    //        return Ok(new { success = true, id = view.Id });
    //    }
    //    catch (Exception ex)
    //    {
    //        return Json(new { success = false, message = ex.Message });
    //    }
    //}


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

}