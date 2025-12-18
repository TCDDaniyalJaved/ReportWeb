using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using Accounting.Models;

namespace Accounting.Controllers
{
  public class DropdawnController : Controller
  {
    private readonly webappContext _context;
        private readonly webappContextProcedures _procedures;

    public DropdawnController(webappContext context, webappContextProcedures procedures)
    {
      _context = context;
       _procedures = procedures;
    }
    [HttpGet]
        public IActionResult CustomerId(string term, int? id)
        {
            var query = _context.Customers.AsQueryable();

            if (id.HasValue)
            {
                var item = query
                    .Where(x => x.Id == id.Value)
                    .Select(x => new { id = x.Id, name = x.FirstName + " " + x.LastName })
                    .ToList();
                return Json(item);
            }

            if (!string.IsNullOrWhiteSpace(term))
            {
                query = query.Where(x => x.FirstName.ToLower().Contains(term.ToLower()) || x.LastName.ToLower().Contains(term.ToLower()));
            }

            var result = query
                .Select(x => new { id = x.Id, name = x.FirstName + " " + x.LastName })
                .Take(20)
                .ToList();

            return Json(result);
        }

        [HttpGet]
        public IActionResult GetTypes(string term, int? id)
        {
            var query = _context.Dropdowns.AsQueryable();

            if (id.HasValue)
            {
                var item = query
                    .Where(x => x.Id == id.Value)
                    .Select(x => new { id = x.Id, name = x.Name })
                    .ToList();
                return Json(item);
            }

            if (!string.IsNullOrWhiteSpace(term))
            {
                query = query.Where(x => x.Name.ToLower().Contains(term.ToLower()));
            }

            var result = query
                .OrderBy(x => x.Name)
                .Select(x => new { id = x.Id, name = x.Name })
                .Take(20)
                .ToList();

            return Json(result);
        }


        [HttpGet]
        public IActionResult GetNature(string term, int? id)
        {
            var query = _context.ChartActTypes.AsQueryable();

            if (id.HasValue)
            {
                var item = query
                    .Where(x => x.RefNo == id.Value)
                    .Select(x => new { id = x.RefNo, name = x.Name })
                    .ToList();
                return Json(item);
            }

            if (!string.IsNullOrWhiteSpace(term))
            {
                query = query.Where(x => x.Name.ToLower().Contains(term.ToLower()));
            }

            var result = query
                .Select(x => new { id = x.RefNo, name = x.Name })
                .Take(20)
                .ToList();

            return Json(result);
        }

        [HttpGet]
        public IActionResult GetGroups(string term, int? id)
        {
            var query = _context.Charts.Where(x => x.TypeId == 1).AsQueryable();

            if (id.HasValue)
            {
                var item = query
                    .Where(x => x.Id == id.Value)
                    .Select(x => new { id = x.Id, name = x.Name })
                    .ToList();
                return Json(item);
            }

            if (!string.IsNullOrWhiteSpace(term))
            {
                query = query.Where(x => x.Name.ToLower().Contains(term.ToLower()));
            }

            var result = query
                .Select(x => new { id = x.Id, name = x.Name })
                .Take(20)
                .ToList();

            return Json(result);
        }
        [HttpGet]

        public async Task<IActionResult> UserWiseAccount(string term, int userId)
        {
            // Await the async call to get the list of accounts
            var accounts = await _procedures.GetUserWiseAccountAsync(userId, 0);

            if (!string.IsNullOrWhiteSpace(term))
            {
                term = term.ToLower();
                accounts = accounts
                    .Where(a => a.Name != null && a.Name.ToLower().Contains(term))
                    .ToList();
            }

            var result = accounts
                .Select(a => new { id = a.ID, name = a.Name })
                .Take(20)
                .ToList();

            return Json(result);
        }

        //public async Task<IActionResult> ActCode(string term, int userId)
        //{
        //    // Await the async call to get the list of accounts
        //    var accounts = await _procedures.GetUserWiseAccountAsync(userId, 0);

        //    if (!string.IsNullOrWhiteSpace(term))
        //    {
        //        term = term.ToLower();
        //        accounts = accounts
        //            .Where(a => a.Name != null && a.Name.ToLower().Contains(term))
        //            .ToList();
        //    }

        //    var result = accounts
        //        .Select(a => new { id = a.ID, name = a.Name })
        //        .Take(20)
        //        .ToList();

        //    return Json(result);
        //}
        [HttpGet]
        public async Task<IActionResult> UserWiseCompany(string term, int userId)
        {
            var companies = await _procedures.GetUserWiseCompanyAsync(userId);

            if (!string.IsNullOrWhiteSpace(term))
            {
                term = term.ToLower();
                companies = companies
                    .Where(c => c.Name != null && c.Name.ToLower().Contains(term))
                    .ToList();
            }

            var result = companies
                .Select(c => new { id = c.Code, name = c.Name })
                .Take(20)
                .ToList();

            return Json(result);
        }
        [HttpGet]

        public IActionResult CompanyId(string term, int? id)
        {
            var query = _context.Companies.AsQueryable();

            if (id.HasValue)
            {
                var item = query
                    .Where(x => x.Code == id.Value)
                    .Select(x => new { id = x.Code, name = x.Name })
                    .ToList();
                return Json(item);
            }

            if (!string.IsNullOrWhiteSpace(term))
            {
                query = query.Where(x => x.Name.ToLower().Contains(term.ToLower()));
            }

            var result = query
                .Select(x => new { id = x.Code, name = x.Name })
                .Take(20)
                .ToList();

            return Json(result);
        }



        [HttpGet]

        public IActionResult ItemId(string term, int? id)
        {
            var query = _context.Items.AsQueryable();

            if (id.HasValue)
            {
                var item = query
                    .Where(x => x.Id == id.Value)
                    .Select(x => new { id = x.Id, name = x.Name })
                    .ToList();
                return Json(item);
            }

            if (!string.IsNullOrWhiteSpace(term))
            {
                query = query.Where(x => x.Name.ToLower().Contains(term.ToLower()));
            }

            var result = query
                .Select(x => new { id = x.Id, name = x.Name })
                .Take(20)
                .ToList();

            return Json(result);
        }

    }

}
