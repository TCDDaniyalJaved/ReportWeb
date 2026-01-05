using Accounting.DTOs;
using Accounting.DTOs;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Text.Json;
using System.Threading.Tasks;
namespace Accounting.Services
{
    public class ReportService : IReportService
    {
        private readonly IConfiguration _configuration;

        public ReportService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<ReportResponse> ExecuteReportAsync(ReportRequest request)
        {
            var response = new ReportResponse();
            string cs = _configuration.GetConnectionString("Default");

            try
            {
                string storedProcedure;

                //  Lookup stored procedure from Reports table
                using (var con = new SqlConnection(cs))
                {
                    await con.OpenAsync();
                    using (var cmd = new SqlCommand("SELECT StoredProcedure FROM Reports WHERE ReportKey=@ReportKey", con))
                    {
                        cmd.Parameters.AddWithValue("@ReportKey", request.ReportName);
                        storedProcedure = (await cmd.ExecuteScalarAsync()) as string;
                    }
                }

                if (string.IsNullOrWhiteSpace(storedProcedure))
                {
                    response.Error = "Invalid report name";
                    return response;
                }

                //  Execute stored procedure dynamically
                using (var con = new SqlConnection(cs))
                {
                    await con.OpenAsync();

                    using (var cmd = new SqlCommand(storedProcedure, con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        // Step 1: Convert JSON parameters and add only valid ones
                        foreach (var param in request.Parameters)
                        {
                            object value = param.Value;

                            if (value is System.Text.Json.JsonElement je)
                            {
                                switch (je.ValueKind)
                                {
                                    case JsonValueKind.String: value = je.GetString(); break;
                                    case JsonValueKind.Number:
                                        if (je.TryGetInt32(out int intVal)) value = intVal;
                                        else if (je.TryGetInt64(out long longVal)) value = longVal;
                                        else if (je.TryGetDouble(out double doubleVal)) value = doubleVal;
                                        break;
                                    case JsonValueKind.True:
                                    case JsonValueKind.False: value = je.GetBoolean(); break;
                                    case JsonValueKind.Null: value = DBNull.Value; break;
                                    default: value = je.GetRawText(); break;
                                }
                            }

                            cmd.Parameters.AddWithValue(param.Key, value ?? DBNull.Value);
                        }

                      

                        // Step 3: Execute stored procedure
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? "" : reader.GetValue(i);

                                response.Data.Add(row);
                            }
                        }
                    }
                }


                response.RecordsTotal = response.Data.Count;
                response.RecordsFiltered = response.Data.Count;
            }
            catch (Exception ex)
            {
                response.Error = ex.Message;
                // Optional: Log ex.Message for production
            }

            return response;
        }
    }
}
