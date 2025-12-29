using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Data.SqlClient;
using Newtonsoft.Json; 

public class ReportController : Controller
{
    private readonly IConfiguration _configuration;

    public ReportController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // Show HTML page
    public IActionResult Index()
    {
        return View();
    }


    public IActionResult Demo()
    {
        return View();
    }
    public JsonResult GetData()
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