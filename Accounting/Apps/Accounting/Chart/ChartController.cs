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
            var sortColumnIndex = Request.Form["order[0][column]"].FirstOrDefault();
            var sortColumnDirection = Request.Form["order[0][dir]"].FirstOrDefault();
            var searchValue = Request.Form["search[value]"].FirstOrDefault();

            int pageSize = length != null ? Convert.ToInt32(length) : 10;
            int skip = start != null ? Convert.ToInt32(start) : 0;

            // Fetch sortable column name safely
            var columnName = Request.Form[$"columns[{sortColumnIndex}][name]"].FirstOrDefault();

            var query = await _contextproc.GetAllAccountsAllSubGroupAsync(0);

            //// Apply search filtering
            if (!string.IsNullOrEmpty(searchValue))
            {
                query = query.Where(m => m.Name.Contains(searchValue, StringComparison.OrdinalIgnoreCase)).ToList();
                //query = query.Where(m => m.Name.Contains(searchValue)).ToList();
            }

            //// Set a default column if columnName is empty or null
            if (string.IsNullOrEmpty(columnName))
            {
                columnName = "Id"; // Default to primary key or another default column
            }

            ////// Apply sorting dynamically
            //if (!string.IsNullOrEmpty(columnName))
            //{
            //  if (sortColumnDirection == "asc")
            //  {
            //    query = query.OrderBy(e => EF.Property<object>(e, columnName)).ToList();
            //  }
            //  else
            //  {
            //    query = query.OrderByDescending(e => EF.Property<object>(e, columnName)).ToList();
            //  }
            //}

            //// Get total records count before pagination (total records without filtering)
            int recordsTotal = query.Count();

            //// Apply pagination
            // var data = query.Skip(skip).Take(pageSize).ToList();
            var data = pageSize == -1
              ? query.ToList()  // Fetch all records if "All" is selected
              : query.Skip(skip).Take(pageSize).ToList();
            //return Json(new { draw = draw, recordsFiltered = recordsTotal, recordsTotal = recordsTotal, data = data });
            var jsonData = new { draw = draw, recordsFiltered = recordsTotal, recordsTotal = recordsTotal, data = data };
            return Ok(jsonData);
        }
        catch (Exception ex)
        {
            // You may want to log the exception for better debugging
            return StatusCode(500, "Internal server error: " + ex.Message);
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
