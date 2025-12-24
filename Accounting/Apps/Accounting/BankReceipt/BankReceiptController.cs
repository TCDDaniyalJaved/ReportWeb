using Accounting.Helpers;
using Accounting.Models;
using Accounting.Services;
using Accounting.Services.Pdf;
using Accounting.ViewModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;

namespace Accounting.Controllers;

[Authorize]
[Route("Accounting/[controller]/[action]")]
public class BankReceiptController : Controller
{
    #region Dependencies

    private readonly webappContext _context;
    private readonly webappContextProcedures _contextprocedure;
    private readonly Base.Services.HtmlToPdfGenerator _pdfGenerator;

    #endregion

    private static readonly string BasePath = "Apps/Accounting/BankReceipt";

    #region Helpers

    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";

    #endregion

    #region Constructor

    public BankReceiptController(
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

    public IActionResult Data(int id)
    {
        return View(ViewPath("Data"));
    }

    [Authorize]
    public IActionResult List()
    {
        return View(ViewPath("Index"));
    }

    //[HttpGet("{id}")]
    //public IActionResult Print(int id)
    //{
    //    var master = _context.BankReceiptMviews.FirstOrDefault(x => x.Id == id);
    //    var details = _context.BankReceiptDviews.Where(x => x.PersonId == id).ToList();

    //    var model = new BankReceiptSPResult
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
        var model = new BankReceiptViewModel
        {
            Master = new BankReceiptM
            {
                Vdate = DateTime.Today,
                // Auto-select if single company
                CompanyId = companyCount == 1 ? companies.First().Code : 0,
            },
            Details = new List<BankReceiptD>()
        };

        ViewBag.CompanyCount = companies.Count;

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
    public async Task<IActionResult> Create(BankReceiptViewModel model)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";

        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value.Errors.Any())
                .ToDictionary(
                    e => e.Key,
                    e => e.Value.Errors.Select(err => err.ErrorMessage).ToArray());

            return Json(new { success = false, errors });
        }

        try
        {
            Console.WriteLine(model.Master.Id);
            Console.WriteLine(model.Master.Vdate);
            Console.WriteLine(model.Master.BookCode);
            Console.WriteLine(model.Master.Mcode);
            model.Master.CompanyId = 1;
            model.Master.Mcode = GetMCode(model.Master.CompanyId);
            _context.BankReceiptMs.Add(model.Master);
            await _context.SaveChangesAsync();
            foreach (var d in model.Details)
            {
                Console.WriteLine(d.Cheque);
                d.PersonId = model.Master.Id;
                _context.BankReceiptDs.Add(d);
            }

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Cash Receipt created successfully!" });
        }
        catch (DbUpdateException ex)
        {
            var inner = ex.InnerException?.Message;
            Console.WriteLine(inner);
            return Json(new { success = false, error = inner });
        }
    }


    private int GetMCode(int companyId)
    {
        var codes = _context.BankReceiptMs
            .AsNoTracking()
            .Where(x => x.CompanyId== companyId)
            .Select(x => x.Id)
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
            var details = await _context.BankReceiptDs.Where(d => d.PersonId == id).ToListAsync();
            _context.BankReceiptDs.RemoveRange(details);

            var masterData = await _context.BankReceiptMs.FindAsync(id);

            if (masterData != null)
            {
                _context.BankReceiptMs.Remove(masterData);
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

    #region Print PDF

    //[HttpGet("{id}")]
    //public async Task<IActionResult> Pdf(int id)
    //{
    //    var master = _context.BankReceiptMviews.FirstOrDefault(x => x.Id == id);
    //    if (master == null)
    //        return NotFound();

    //    var details = _context.BankReceiptDviews.Where(x => x.Refid == id).ToList();

    //    var model = new BankReceiptSPResult
    //    {
    //        Master = master,
    //        Details = details
    //    };

    //    string html = await this.RenderViewAsync("~/Apps/Accounting/BankReceipt/Print.cshtml", model, true);
    //    byte[] pdfBytes = _pdfGenerator.GeneratePdf(html);

    //    Response.Headers.Add("Content-Disposition", $"inline; filename=BankReceipt_{id}.pdf");
    //    return File(pdfBytes, "application/pdf");
    //}

    //[HttpGet("{id}")]
    //public IActionResult PrintPdf(int id)
    //{
    //    var master = _context.BankReceiptMviews.FirstOrDefault(x => x.InvoiceId == id);
    //    var details = _context.BankReceiptDviews.Where(x => x.Refid == id).ToList();

    //    var model = new BankReceiptSPResult { Master = master, Details = details };

    //    var pdfBytes = new BankReceiptPdf(model).GeneratePdf();

    //    Response.Headers.Add("Content-Disposition", "inline; filename=BankReceipt.pdf");
    //    return File(pdfBytes, "application/pdf");
    //}

    #endregion

    #region Get List

    //[HttpGet]
    //public IActionResult getList()
    //{
    //    var Accounting = _context.BankReceiptMviews.ToList();
    //    return Json(Accounting);
    //}

    #endregion

    #region DataTables Main List


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
            var searchValue = Request.Form["customSearch"].FirstOrDefault(); // Sirf customSearch
            var status = Request.Form["status"].FirstOrDefault();
            int pageSize = length != null ? Convert.ToInt32(length) : 10;
            int skip = start != null ? Convert.ToInt32(start) : 0;

            var columnName = Request.Form[$"columns[{sortColumnIndex}][name]"].FirstOrDefault();

            var query = _context.BankReceiptMs.AsQueryable();

            //if (!string.IsNullOrEmpty(searchValue))
            //{
            //    query = query.Where(m =>
            //        m.Date.ToString().Contains(searchValue) ||
            //        m.Voucher.Contains(searchValue) ||
            //        m.Book.ToString().Contains(searchValue) ||
            //        m.Cheque.ToString().Contains(searchValue)||
            //        m.Id.ToString().Contains(searchValue)||
            //         m.Amount.ToString().Contains(searchValue) 



            //    );
            //}

            if (string.IsNullOrEmpty(columnName))
            {
                columnName = "Id";
            }

            if (!string.IsNullOrEmpty(columnName))
            {
                query = sortColumnDirection == "asc"
                    ? query.OrderBy(e => EF.Property<object>(e, columnName))
                    : query.OrderByDescending(e => EF.Property<object>(e, columnName));
            }

            int recordsTotal = await query.CountAsync();

            var data = pageSize == -1
                ? await query.ToListAsync()
                : await query.Skip(skip).Take(pageSize).ToListAsync();

            var jsonData = new { draw = draw, recordsFiltered = recordsTotal, recordsTotal = recordsTotal, data = data };
            return Ok(jsonData);
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
        var master = _context.BankReceiptMs.FirstOrDefault(m => m.Id == id);
        if (master == null)
            return NotFound();

        var details = _context.BankReceiptDs.Where(d => d.PersonId == id).ToList();

        var model = new BankReceiptViewModel
        {
            Master = master,
            Details = details
        };

        // Retrieve companies (same as in the Create action)
        var companies = _context.Companies.ToList();
        var companyCount = companies.Count;
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";

        return isAjax
            ? PartialView(ViewPath("_Edit"), model)
            : View(ViewPath("Index"));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(BankReceiptViewModel model)
    {
        if (!ModelState.IsValid)
        {
            foreach (var entry in ModelState)
            {
                var key = entry.Key;
                var errors = entry.Value.Errors;

                foreach (var error in errors)
                {
                    Console.WriteLine($"Field: {key}, Error: {error.ErrorMessage}");
                }
            }

            var errorsDict = ModelState
                .Where(x => x.Value.Errors.Any())
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray());

            return Json(new { success = false, errors = errorsDict });
        }

        try
        {
            var master = await _context.BankReceiptMs.FindAsync(model.Master.Id);
            if (master == null)
                return Json(new { success = false, message = "Record not found!" });
            master.CompanyId = 1;
            master.Vdate = model.Master.Vdate;
            master.CompanyId = model.Master.CompanyId;
            master.Remarks = model.Master.Remarks;

            var incomingIds = model.Details.Where(d => d.Id > 0).Select(d => d.Id).ToHashSet();
            var deletedDetails = await _context.CashReceiptDs
                .Where(d => d.RefId == master.Id && !incomingIds.Contains(d.Id))
                .ToListAsync();
            Console.WriteLine(master.CompanyId);

            if (deletedDetails.Any())
                _context.CashReceiptDs.RemoveRange(deletedDetails);

            foreach (var detail in model.Details)
            {
                detail.PersonId = master.Id;

                if (detail.Id == 0)
                    _context.BankReceiptDs.Add(detail);
                else
                {
                    var existing = await _context.BankReceiptDs
                        .FirstOrDefaultAsync(d => d.Id == detail.Id && d.PersonId == master.Id);

                    if (existing != null)
                    {
                        existing.ActCode = detail.ActCode;
                        existing.Remarks = detail.Remarks;
                        existing.Amount = detail.Amount;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Cash Receipt updated successfully!",
                redirectUrl = Url.Action("List", "CashReceipt")
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

            var columnName = Request.Form[$"columns[{sortColumnIndex}][name]"].FirstOrDefault() ?? "BankReceiptId";

            var query = _context.BankReceiptDviews.AsQueryable();

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

