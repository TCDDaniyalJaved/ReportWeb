using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Accounting.Models;
using Microsoft.AspNetCore.Authorization;

namespace Accounting.Controllers;

public class DashboardsController : Controller
{

    private static readonly string BasePath = "Apps/Dashboards";

    // Helper function to build path
    private static string ViewPath(string viewName)
        => $"~/{BasePath}/{viewName}.cshtml";


    [Authorize]

    public IActionResult Index()
    {
        return View(ViewPath("Index"));
    }
    
     [Authorize]
    public IActionResult CRM()
    {
        return View(ViewPath("CRM"));

    }
}
