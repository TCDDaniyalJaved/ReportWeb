using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using DocumentFormat.OpenXml.InkML;
using Microsoft.EntityFrameworkCore;
using DocumentFormat.OpenXml.Bibliography;

namespace Accounting.Apps;

public class DashboardsController : Controller
{
    private webappContext _context;

    public  DashboardsController(webappContext context)
    {
        _context = context;
    }

    private static readonly string BasePath = "Apps/Dashboards";

    // Helper function to build path
    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";



    [Authorize]
    public IActionResult Index()
    {
        return View(ViewPath("Index"));
    }

}
