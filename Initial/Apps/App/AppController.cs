using Initial.Models;
using Initial.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Initial.Controllers
{
    [Route("app/[action]")]

    public class AppController : Controller
    {
        private readonly IMenuService _menuService;
        private readonly EbitContext _context;
        public AppController(IMenuService menuService , EbitContext context)
        {
            _menuService = menuService;
            _context = context;
        }
        [HttpGet]
        public async Task<IActionResult> list()
        {
            var apps = await _menuService.GetAllAppsAsync();
            return View("~/Apps/App/Index.cshtml", apps);
        }
        [HttpPost]
        public async Task<IActionResult> Activate(int id, IFormFile? sqlFile, string? sqlText)
        {
            var app = await _menuService.GetAppByIdAsync(id);

            if (app == null) return NotFound("App not found");

            string script = "";

            if (sqlFile != null && sqlFile.Length > 0)
            {
                using var reader = new StreamReader(sqlFile.OpenReadStream());
                script = await reader.ReadToEndAsync();
            }
            else if (!string.IsNullOrWhiteSpace(sqlText))
            {
                script = sqlText;
            }

            try
            {
                if (!string.IsNullOrWhiteSpace(script))
                {
                    //using var conn = new SqlConnection(_conext.Database.GetConnectionString());
                    //conn.Open();
                    //using var cmd = new SqlCommand(script, conn) { CommandTimeout = 300 };
                    //cmd.ExecuteNonQuery();
                    using var connection = new SqlConnection(_context.Database.GetConnectionString());
                    connection.Open();


                    var batches = System.Text.RegularExpressions.Regex.Split(script, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase);

                    foreach (var batch in batches)
                    {
                        var trimmed = batch.Trim();
                        if (string.IsNullOrWhiteSpace(trimmed))
                            continue;

                        using var command = new SqlCommand(trimmed, connection);
                        command.ExecuteNonQuery();
                    }
                }

                app.Status = "Active";
                await _context.SaveChangesAsync();

                return Ok("Module activated successfully!");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        public async Task<IActionResult> LoadModule(int id)
        {
            var menus = await _menuService.GetMenusByAppAsync(id);
            var dto = menus.Select(m => new {
                m.Id,
                m.Name,
                m.Url,
                m.Icon,
                m.Seqno,
                m.ParentId,
                m.Subname,
                m.Nameclass
            }).ToList();

            HttpContext.Session.SetString("AppMenus", JsonConvert.SerializeObject(dto));
            var firstMenu = menus
                .OrderBy(m => m.Seqno)
                .FirstOrDefault(m => !string.IsNullOrEmpty(m.Url));

            if (firstMenu != null)
            {
                var redirectUrl = firstMenu.Url.StartsWith("/")
                    ? firstMenu.Url
                    : "/" + firstMenu.Url;

                return Redirect(redirectUrl);
            }
            return RedirectToAction("Index", "Dashboard");
        }

        }
    }

