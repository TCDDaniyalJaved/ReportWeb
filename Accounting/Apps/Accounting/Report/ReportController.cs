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

        public List<string> CompanyName { get; set; } = new();


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

            string orderBy = request.GroupByFields.Any() ? string.Join(",", request.GroupByFields): null;

            cmd.Parameters.AddWithValue("@OrderBy",orderBy == null ? (object)DBNull.Value : orderBy);


            cmd.Parameters.AddWithValue("@Companyname",request.CompanyName == null || !request.CompanyName.Any()? (object)DBNull.Value: string.Join(",", request.CompanyName));

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

        return Json(new { data, recordsTotal = data.Count, recordsFiltered = data.Count });
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

}

