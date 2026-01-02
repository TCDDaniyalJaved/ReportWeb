using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json; 
using System.Data;
using System.Data.SqlClient;

public class ReportController : Controller
{
    private readonly IConfiguration _configuration;

    public ReportController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public IActionResult Index()
    {
        return View();
    }
    public IActionResult ItemData()
    {
        return View();
    }


    public IActionResult Demo()
    {
        return View();
    }

    public JsonResult GetData2(ReportRequest request)
    {
        string cs = _configuration.GetConnectionString("Default");
        var data = new List<Dictionary<string, object>>();

        using (SqlConnection con = new SqlConnection(cs))
        {
            con.Open();
            SqlCommand cmd = new SqlCommand("PurchaseReport", con);
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.AddWithValue("@SearchValue",
                string.IsNullOrWhiteSpace(request.CustomSearch)
                ? (object)DBNull.Value
                : request.CustomSearch);

            string orderBy = request.GroupByFields.Any()
                ? string.Join(",", request.GroupByFields)
                : null;

            cmd.Parameters.AddWithValue("@GroupByOrder",
                orderBy == null ? (object)DBNull.Value : orderBy);

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

    public class ReportRequest
    {
        public string CustomSearch { get; set; }
        public List<string> GroupByFields { get; set; } = new();
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

            string orderBy = request.GroupByFields.Any()
                ? string.Join(",", request.GroupByFields)
                : null;

            cmd.Parameters.AddWithValue("@orderby",
                orderBy == null ? (object)DBNull.Value : orderBy);

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

}