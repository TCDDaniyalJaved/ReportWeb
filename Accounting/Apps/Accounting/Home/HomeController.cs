using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Accounting.Models;

namespace Accounting.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Index(string version)
    {
        return View("~/Apps/Accounting/Home/Index.cshtml");
    }
    [HttpGet]
    public IActionResult Privacy(string version)
    {
        return View("~/Apps/Accounting/Home/Privacy.cshtml");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
