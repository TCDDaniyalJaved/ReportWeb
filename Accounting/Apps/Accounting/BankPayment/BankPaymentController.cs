using Accounting.Helpers;
using Accounting.Models;
using Accounting.Services;
using Accounting.Services.Pdf;
using Accounting.ViewModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using System.Security.Claims;

namespace Accounting.Controllers;

[Authorize]
[Route("Accounting/[controller]/[action]")]
public class BankPaymentController : Controller
{
    #region Dependencies

    private readonly webappContext _context;
    private readonly webappContextProcedures _contextprocedure;
    private readonly Base.Services.HtmlToPdfGenerator _pdfGenerator;

    #endregion

    private static readonly string BasePath = "Apps/Accounting/BankPayment";

    #region Helpers

    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";

    #endregion

    #region Constructor

    public BankPaymentController(
        webappContext context,
        webappContextProcedures contextprocedure,
        Base.Services.HtmlToPdfGenerator pdfGenerator)
    {
        _context = context;
        _contextprocedure = contextprocedure;
        _pdfGenerator = pdfGenerator;
    }

    #endregion

    #region Views

    public IActionResult Dummy(int id)
    {
        return View(ViewPath("Dummy"));
    }


    public IActionResult Demo(int id)
    {
        return View(ViewPath("Demo"));
    }

    [Authorize]
    public IActionResult List()
    {
        return View(ViewPath("Index"));
    }

    public IActionResult List2()
    {
        return View(ViewPath("Index2"));
    }

    //[HttpGet("{id}")]
    //public IActionResult Print(int id)
    //{
    //    var master = _context.BankPaymentMviews.FirstOrDefault(x => x.Id == id);
    //    var details = _context.BankPaymentDviews.Where(x => x.PersonId == id).ToList();

    //    var model = new BankPaymentSPResult
    //    {
    //        Master = master,
    //        Details = details
    //    };

    //    return View(ViewPath("Print"), model);
    //}

    #endregion

    #region Create (GET/POST)

    [Authorize]
    [HttpGet]
    public IActionResult Create()
    {
        var companies = _context.Companies.ToList();
        var companyCount = companies.Count;

        var model = new BankPaymentViewModel
        {
            Master = new BankPaymentM
            {
                Vdate = DateTime.Today,
                // Auto-select if single company
                CompanyId = companyCount == 1 ? companies.First().Code : 0
            },
            Details = new List<BankPaymentD>()
        };

        // Pass in the  ViewBag
        ViewBag.CompanyCount = companyCount;

        //Pass the name of the single company.
        if (companyCount == 1)
        {
            ViewBag.PrimaryCompanyName = companies.First().Name;
            ViewBag.PrimaryCompanyId = companies.First().Code;
        }

        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";

        return isAjax
            ? PartialView(ViewPath("_Create"), model)
            : View(ViewPath("Index"));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(BankPaymentViewModel model)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";

        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value.Errors.Any())
                .ToDictionary(
                    e => e.Key,
                    e => e.Value.Errors.Select(err => err.ErrorMessage).ToArray());

            Console.WriteLine("Validation Errors: " + System.Text.Json.JsonSerializer.Serialize(errors));


            return Json(new { success = false, errors });
        }

        try
        {
            int userId = Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));
            model.Master.UserId = userId;

            model.Master.CurrentDate = DateTime.Now;  // insert time
            //model.Master.UpdatedTime = null;  // insert ke time null

            model.Master.Mcode = GetMCode(model.Master.CompanyId);
            _context.BankPaymentMs.Add(model.Master);
            await _context.SaveChangesAsync();

            foreach (var d in model.Details)
            {
                d.PersonId = model.Master.Id;
                _context.BankPaymentDs.Add(d);
            }

            await _context.SaveChangesAsync();

            return Json(new { success = true, action = "create", message = "Bank Paymnet created successfully!" });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }

    private int GetMCode(int companyId)
    {
        var codes = _context.BankPaymentMs
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId)
            .Select(x => x.Mcode)
            .ToList();

        return codes.Count == 0 ? 1 : codes.Max() + 1;
    }

    #endregion

    #region Delete

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var details = await _context.BankPaymentDs.Where(d => d.PersonId == id).ToListAsync();
            _context.BankPaymentDs.RemoveRange(details);

            var masterData = await _context.BankPaymentMs.FindAsync(id);

            if (masterData != null)
            {
                _context.BankPaymentMs.Remove(masterData);
                await _context.SaveChangesAsync();
                return Json(new { success = true });
            }

            return Json(new { success = false, message = "Record not found" });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }

    #endregion

    #region BulkDelete

    [HttpPost]
    public async Task<JsonResult> BulkDelete(List<int> ids)
    {

        try
        {
            if (ids == null || ids.Count == 0)
            {
                return Json(new { success = false, message = "No accounts selected" });
            }
            var details = await _context.BankPaymentDs
           .Where(d => ids.Contains(d.PersonId))
           .ToListAsync();

            _context.BankPaymentDs.RemoveRange(details);

            // Get all master records
            var masters = await _context.BankPaymentMs
                .Where(m => ids.Contains(m.Id))
                .ToListAsync();

            if (!masters.Any())
            {
                return Json(new { success = false, message = "No records found" });
            }

            _context.BankPaymentMs.RemoveRange(masters);

            await _context.SaveChangesAsync();


            return Json(new
            {
                success = true,
                message = $"{ids.Count} account(s) deleted successfully"
            });
        }
        catch (Exception ex)
        {
            return Json(new
            {
                success = false,
                message = "Error deleting accounts: " + ex.Message
            });
        }
    }

    #endregion
    #region Print PDF

    //[HttpGet("{id}")]
    //public async Task<IActionResult> Pdf(int id)
    //{
    //    var master = _context.BankPaymentMviews.FirstOrDefault(x => x.Id == id);
    //    if (master == null)
    //        return NotFound();

    //    var details = _context.BankPaymentDviews.Where(x => x.PersonId == id).ToList();

    //    var model = new BankPaymentSPResult
    //    {
    //        Master = master,
    //        Details = details
    //    };

    //    string html = await this.RenderViewAsync("~/Apps/Accounting/BankPayment/Print.cshtml", model, true);
    //    byte[] pdfBytes = _pdfGenerator.GeneratePdf(html);

    //    Response.Headers.Add("Content-Disposition", $"inline; filename=BankPayment_{id}.pdf");
    //    return File(pdfBytes, "application/pdf");
    //}

    //[HttpGet("{id}")]
    //public IActionResult PrintPdf(int id)
    //{
    //    var master = _context.BankPaymentMviews.FirstOrDefault(x => x.Id == id);
    //    var details = _context.BankPaymentDviews.Where(x => x.PersonId == id).ToList();

    //    var model = new BankPaymentSPResult { Master = master, Details = details };

    //    var pdfBytes = new BankPaymentPdf(model).GeneratePdf();

    //    Response.Headers.Add("Content-Disposition", "inline; filename=BankPayment.pdf");
    //    return File(pdfBytes, "application/pdf");
    //}

    #endregion

    #region Get List

    [HttpGet]
    public IActionResult getList()
    {
        var Accounting = _context.BankPaymentMviews.ToList();
        return Json(Accounting);
    }
    #endregion

    #region DataTables Main List

    [HttpPost]
    public async Task<IActionResult> getdata()
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

            var query = _context.BankPaymentMviews.AsQueryable();

            if (!string.IsNullOrEmpty(searchValue))
            {
                query = query.Where(m =>
                    m.Voucher.Contains(searchValue) ||
                    m.TotalSeqNo.ToString().Contains(searchValue) ||
                    m.Voucher.ToString().Contains(searchValue) ||
                    m.Book.ToString().Contains(searchValue) ||
                    m.Book.ToString().Contains(searchValue));
            }

            //var totalDebit = await query.SumAsync(x => (decimal?)x.Debit) ?? 0;
            //var totalCredit = await query.SumAsync(x => (decimal?)x.Credit) ?? 0;

            query = sortColumnDirection == "asc"
                ? query.OrderBy(e => EF.Property<object>(e, columnName))
                : query.OrderByDescending(e => EF.Property<object>(e, columnName));

            int recordsTotal = await query.CountAsync();
            var data = pageSize == -1
                ? await query.ToListAsync()
                : await query.Skip(skip).Take(pageSize).ToListAsync();

            return Ok(new
            {
                draw,
                recordsTotal,
                recordsFiltered = recordsTotal,
                data,
                //totals = new
                //{
                //    totalDebit,
                //    totalCredit
                //}
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }




    [HttpPost]
    public async Task<IActionResult> getdata2()
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

            var query = _context.BankPaymentMviews.AsQueryable();

            if (!string.IsNullOrEmpty(searchValue))
            {
                query = query.Where(m =>
                    m.Voucher.Contains(searchValue) ||
                    m.TotalSeqNo.ToString().Contains(searchValue) ||
                    m.Book.ToString().Contains(searchValue) ||
                    m.Date.ToString().Contains(searchValue));
            }

            //var totalDebit = await query.SumAsync(x => (decimal?)x.Debit) ?? 0;
            //var totalCredit = await query.SumAsync(x => (decimal?)x.Credit) ?? 0;

            query = sortColumnDirection == "dsc"
                ? query.OrderBy(e => EF.Property<object>(e, columnName))
                : query.OrderByDescending(e => EF.Property<object>(e, columnName));

            int recordsTotal = await query.CountAsync();
            var data = pageSize == -1
                ? await query.ToListAsync()
                : await query.Skip(skip).Take(pageSize).ToListAsync();

            return Ok(new
            {
                draw,
                recordsTotal,
                recordsFiltered = recordsTotal,
                data,
                //totals = new
                //{
                //    totalDebit,
                //    totalCredit
                //}
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Edit (GET/POST)

    [HttpGet("{id}")]
    public IActionResult Edit(int id)
    {
        var master = _context.BankPaymentMs.FirstOrDefault(m => m.Id == id);
        if (master == null)
            return NotFound();

        var details = _context.BankPaymentDs.Where(d => d.PersonId == id).ToList();

        var model = new BankPaymentViewModel
        {
            Master = master,
            Details = details
        };

        // Retrieve companies (same as in the Create action)
        var companies = _context.Companies.ToList();
        var companyCount = companies.Count;

        // Pass the company count to the ViewBag (same as in the Create action)
        ViewBag.CompanyCount = companyCount;

        // If there's only one company, pass its name and ID
        if (companyCount == 1)
        {
            ViewBag.PrimaryCompanyName = companies.First().Name;
            ViewBag.PrimaryCompanyId = companies.First().Code;
        }

        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";

        return isAjax
            ? PartialView(ViewPath("_Edit"), model)
            : View(ViewPath("Index"));
    }


    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(BankPaymentViewModel model)
    {
        if (!ModelState.IsValid)
        {
            var errorsDict = ModelState
                .Where(x => x.Value.Errors.Any())
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray());

            return Json(new { success = false, errors = errorsDict });
        }

        try
        {
            var master = await _context.BankPaymentMs.FindAsync(model.Master.Id);
            if (master == null)
                return Json(new { success = false, message = "Record not found!" });

            master.Vdate = model.Master.Vdate;
            master.CompanyId = model.Master.CompanyId;
            master.Remarks = model.Master.Remarks;

            //master.UpdatedTime = DateTime.Now;

            var incomingIds = model.Details.Where(d => d.Id > 0).Select(d => d.Id).ToHashSet();
            var deletedDetails = await _context.BankPaymentDs
                .Where(d => d.PersonId == master.Id && !incomingIds.Contains(d.Id))
                .ToListAsync();

            if (deletedDetails.Any())
                _context.BankPaymentDs.RemoveRange(deletedDetails);

            foreach (var detail in model.Details)
            {
                detail.PersonId = master.Id;

                if (detail.Id == 0)
                    _context.BankPaymentDs.Add(detail);
                else
                {
                    var existing = await _context.BankPaymentDs
                        .FirstOrDefaultAsync(d => d.Id == detail.Id && d.PersonId == master.Id);

                    if (existing != null)
                    {
                        existing.ActCode = detail.ActCode;
                        existing.Remarks = detail.Remarks;
                        //existing.Debit = detail.Debit;
                        //existing.Credit = detail.Credit;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                action = "edit",
                message = "Bank Paymnet updated successfully!",
                redirectUrl = Url.Action("List", "BankPayment")
            });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.GetBaseException().Message });
        }
    }

    #endregion

    #region Detail DataTable

    [HttpPost]
    public async Task<IActionResult> GetDataDetail()
    {
        try
        {
            var draw = Request.Form["draw"].FirstOrDefault();
            var start = Convert.ToInt32(Request.Form["start"].FirstOrDefault());
            var length = Convert.ToInt32(Request.Form["length"].FirstOrDefault());
            var sortColumnIndex = Request.Form["order[0][column]"].FirstOrDefault();
            var sortColumnDirection = Request.Form["order[0][dir]"].FirstOrDefault();
            var searchValue = Request.Form["search[value]"].FirstOrDefault();

            int pageSize = length;
            int skip = start;

            var columnName = Request.Form[$"columns[{sortColumnIndex}][name]"].FirstOrDefault() ?? "BankPaymentId";

            var query = _context.BankPaymentDviews.AsQueryable();

            query = sortColumnDirection == "asc"
                ? query.OrderBy(e => EF.Property<object>(e, columnName))
                : query.OrderByDescending(e => EF.Property<object>(e, columnName));

            int recordsTotal = await query.CountAsync();

            var data = pageSize == -1
                ? await query.ToListAsync()
                : await query.Skip(skip).Take(pageSize).ToListAsync();

            return Ok(new { draw, recordsTotal, recordsFiltered = recordsTotal, data });
        }
        catch
        {
            throw;
        }
    }

    #endregion
}

