using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Security.Claims;
using Accounting.Models;

namespace Accounting.Controllers;

[Authorize]
[Route("Accounting/[controller]/[action]")]
public class ChartController : Controller
{
    private readonly webappContext _context;
    private readonly webappContextProcedures _contextproc;

    private static readonly string BasePath = "Apps/Accounting/Chart";

    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";

    public ChartController(webappContext context, webappContextProcedures contextproc)
    {
        _context = context;
        _contextproc = contextproc;
    }

    // Index page
    [HttpGet]
    public IActionResult List()
    {
        return View(ViewPath("Index"));
    }

    // GetData via Stored Procedure (DataTables)
    [HttpPost]
    public async Task<IActionResult> GetData()
    {
        try
        {
            var draw = Request.Form["draw"].FirstOrDefault();
            var start = Request.Form["start"].FirstOrDefault();
            var length = Request.Form["length"].FirstOrDefault();
            var searchValue = Request.Form["customSearch"].FirstOrDefault();

            int pageSize = length != null ? Convert.ToInt32(length) : 10;
            int skip = start != null ? Convert.ToInt32(start) : 0;

            // Data fetch
            var query = (await _contextproc.GetAllAccountsAllSubGroupAsync(0)).AsQueryable();

            int recordsTotal = query.Count();


            //  SEARCH (always apply)
            if (!string.IsNullOrWhiteSpace(searchValue))
            {
                searchValue = searchValue.ToLower();

                query = query.Where(m =>
                    m.Name.ToLower().Contains(searchValue) ||
                    m.NatureName.ToLower().Contains(searchValue) ||
                    m.TypeName.ToLower().Contains(searchValue)
                );
            }

            int recordsFiltered = query.Count();

            // Pagination
            var data = pageSize == -1
                ? query.ToList()
                : query.Skip(skip).Take(pageSize).ToList();

            var jsonData = new
            {
                draw = draw,
                recordsTotal = recordsTotal,
                recordsFiltered = recordsFiltered,
                data = data
            };

            return Ok(jsonData);
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Internal server error: " + ex.Message);
        }
    }


    [HttpGet]
    public async Task<IActionResult> GetData(
    int draw = 1,
    int start = 0,
    int length = 10,
    string search = ""
)
    {
        try
        {
            // 🔹 Stored Procedure Call
            var dataList = await _contextproc.GetAllAccountsAllSubGroupAsync(0);

            // 🔹 Search Filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                dataList = dataList
                    .Where(x => x.Name != null &&
                                x.Name.Contains(search, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            int recordsTotal = dataList.Count;

            // 🔹 Paging
            var data = length == -1
                ? dataList
                : dataList.Skip(start).Take(length).ToList();

            // 🔹 Return JSON
            return Ok(new
            {
                draw = draw,
                recordsTotal = recordsTotal,
                recordsFiltered = recordsTotal,
                data = data
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Internal server error",
                error = ex.Message
            });
        }
    }




    [HttpPost]
    public async Task<IActionResult> GetData2()
    {
        try
        {
            var draw = Request.Form["draw"].FirstOrDefault();
            var start = Convert.ToInt32(Request.Form["start"].FirstOrDefault());
            var length = Convert.ToInt32(Request.Form["length"].FirstOrDefault());
            var sortColumnIndex = Request.Form["order[0][column]"].FirstOrDefault();
            var sortColumnDirection = Request.Form["order[0][dir]"].FirstOrDefault();
            var searchValue = Request.Form["customSearch"].FirstOrDefault();

            int pageSize = length == -1 ? -1 : length;
            int skip = start;

            var columnName = Request.Form[$"columns[{sortColumnIndex}][name]"].FirstOrDefault();
            if (string.IsNullOrEmpty(columnName))
                columnName = "Id";

            var query = await _contextproc.GetAllAccountsAllSubGroupAsync(0);

            if (string.IsNullOrEmpty(columnName))
            {
                columnName = "Id";
            }
            int recordsTotal = query.Count();

            var data = pageSize == -1
              ? query.ToList()
              : query.Skip(skip).Take(pageSize).ToList();
            var jsonData = new { draw = draw, recordsFiltered = recordsTotal, recordsTotal = recordsTotal, data = data };
            return Ok(jsonData);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // Create GET
    [HttpGet]
    public IActionResult Create()
    {
        var model = new Chart();
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";
        return isAjax
            ? PartialView(ViewPath("_Create"), model)
            : View(ViewPath("Index"));
    }
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Chart chart)
    {
        if (ModelState.IsValid)
        {
            if (chart.Id == 0)
            {
                int userId = Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));
                chart.UserId = userId;
                _context.Charts.Add(chart);
                await _context.SaveChangesAsync();
                var Charts = await _context.Charts.ToListAsync();
                return Json(new { success = true });
            }
            return RedirectToAction(nameof(Index));
        }

        return PartialView(ViewPath("_Create"), chart);
    }

    // Edit GET
    [HttpGet("{id}")]
    public IActionResult Edit(int id)
    {
        var Chart = _context.Charts.FirstOrDefault(x => x.Id == id);
        if (Chart == null)
            return NotFound();
        return PartialView(ViewPath("_Edit"), Chart);
    }

    // Edit POST
    [HttpPost]

    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(Chart Chart)
    {
        if (!ModelState.IsValid)
        {
            // Log validation errors to console
            foreach (var kvp in ModelState)
            {
                var key = kvp.Key;
                var errors = kvp.Value.Errors;
                foreach (var error in errors)
                {
                    Console.WriteLine($"ModelState Error - Key: {key}, Error: {error.ErrorMessage}");
                }
            }

            // Return JSON errors to client for AJAX
            var errorsDict = ModelState.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
            );

            return Json(new { success = false, errors = errorsDict });
        }


        if (ModelState.IsValid)
        {
            try
            {
                //_context.Entry(Chart).State = EntityState.Modified;
                var existingChart = await _context.Charts.FindAsync(Chart.Id);
                if (existingChart == null)
                {
                    return NotFound();
                }

                existingChart.UserId = Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));
                _context.Entry(existingChart).CurrentValues.SetValues(Chart);
                await _context.SaveChangesAsync();
                return Json(new { success = true });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Charts.Any(e => e.Id == Chart.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
        }
        return PartialView("_Edit", Chart);
    }

    // Delete
    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var chart = await _context.Charts.FindAsync(id);
            if (chart == null)
                return Json(new { success = false, message = "Record not found" });

            _context.Charts.Remove(chart);
            await _context.SaveChangesAsync();

            return Json(new { success = true });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }
}
