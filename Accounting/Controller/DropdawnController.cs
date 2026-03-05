using Accounting.Models;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

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
        public IActionResult GroupID(string term)
        {
            var query = _context.ChartGroupReportVs.AsQueryable();


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
        //Dropdawn/userWiseAccount?term=ABDUL%20BASIT
        [HttpGet]
        public async Task<IActionResult> UserWiseAccount(string term, int? id, int? natureId)
        {
            int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            int finalNatureId = natureId ?? 0;

            var query = await _procedures.GetUserWiseAccountAsync(currentUserId, finalNatureId);

            if (id.HasValue)
            {
                var item = query
                    .Where(x => x.ID == id.Value)
                    .Select(x => new { id = x.ID, text = x.Name }) 
                    .FirstOrDefault();

                return Json(item);
            }
            if (!string.IsNullOrWhiteSpace(term))
            {
                term = term.ToLower();
                query = query
                           .Where(a => a.Name != null && a.Name.ToLower().Contains(term))
                         .ToList();
            }

            var result = query
                .Select(x => new { id = x.ID, name = x.Name })
                .Take(20)
                .ToList();

            return Json(result);
        }

        //[HttpGet]

        //public async Task<IActionResult> UserWiseAccount(string term, int? id)
        //{
        //    var query = await _procedures.GetUserWiseAccountAsync(1, 0);

        //    if (id.HasValue)
        //    {
        //        var item = query
        //            .Where(x => x.ID == id.Value)
        //            .Select(x => new { id = x.ID, name = x.Name })
        //            .ToList();
        //        return Json(item);
        //    }

        //    if (!string.IsNullOrWhiteSpace(term))
        //    {
        //        term = term.ToLower();
        //        query = query
        //                   .Where(a => a.Name != null && a.Name.ToLower().Contains(term))
        //                 .ToList();
        //    }

        //    var result = query
        //        .Select(x => new { id = x.ID, name = x.Name })
        //        .Take(20)
        //        .ToList();

        //    return Json(result);
        //}
        //[HttpGet]
        //public async Task<IActionResult> UserWiseCompany(string term, int userId)
        //{
        //    var companies = await _procedures.GetUserWiseAccountAsync(userId);

        //    if (!string.IsNullOrWhiteSpace(term))
        //    {
        //        term = term.ToLower();
        //        companies = companies
        //            .Where(c => c.Name != null && c.Name.ToLower().Contains(term))
        //            .ToList();
        //    }

        //    var result = companies
        //        .Select(c => new { id = c.Code, name = c.Name })
        //        .Take(20)
        //        .ToList();

        //    return Json(result);
        //}
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
