using Accounting.Models;
using Accounting.Services;
using Base.Services;
using DocumentFormat.OpenXml;
// Initial.dll dependencies
using Initial.Services;
using Initial.Utils;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using QuestPDF.Infrastructure;
using System.Reflection;
using System.Runtime.Loader;

var builder = WebApplication.CreateBuilder(args);

var activeVersion = builder.Configuration["AppSettings:ActiveVersion"] ?? "v1";

builder.Services.AddHttpContextAccessor();
builder.Services.AddSession();

builder.Services.AddDbContext<webappContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// QuestPDF License
QuestPDF.Settings.License = LicenseType.Community;


builder.Services.AddScoped<webappContextProcedures>();
builder.Services.AddScoped<IMenuService, MenuService>();



//IConverter? pdfConverter = null;

//try
//{
//    var dllPath = Path.Combine(AppContext.BaseDirectory, "libwkhtmltox.dll");

//    if (File.Exists(dllPath))
//    {
//        var context = new CustomAssemblyLoadContext();
//        context.LoadUnmanagedLibrary(dllPath);

//        pdfConverter = new SynchronizedConverter(new PdfTools());
//        Console.WriteLine("PDF DLL loaded successfully");
//    }
//    else
//    {
//        Console.WriteLine("libwkhtmltox.dll not found. PDF feature disabled.");
//    }
//}
//catch (Exception ex)
//{
//    Console.WriteLine("PDF DLL load failed: " + ex.Message);
//}


// Register DinkToPdf converter
//builder.Services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
builder.Services.AddScoped<IReportService, ReportService>();

// Your custom PDF service
builder.Services.AddScoped<HtmlToPdfGenerator>();
builder.Services.AddControllersWithViews()
    .AddRazorRuntimeCompilation();
var mvcBuilder = builder.Services.AddControllersWithViews();

string appsFolder = Path.Combine(AppContext.BaseDirectory, "apps");
ModuleLoader.LoadModules(builder.Services, builder.Configuration, mvcBuilder, appsFolder);


try
{
    var baseAsm = typeof(Base.ExampleJsInterop).Assembly;
    mvcBuilder.PartManager.ApplicationParts.Add(new CompiledRazorAssemblyPart(baseAsm));
}
catch
{
    Console.WriteLine("?? Base assembly not found.");
}

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Login";
        options.AccessDeniedPath = "/Login/AccessDenied";
    });

var app = builder.Build();

app.UseHttpsRedirection();
app.UseStaticFiles();



ModuleLoader.MountEmbeddedStaticFiles(app, appsFolder);

app.UseSession();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllerRoute(
    name: "modules",
    pattern: $"{activeVersion}/{{module}}/{{controller=Home}}/{{action=Index}}/{{id?}}");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Login}/{action=Index}/{id?}");
if (app.Environment.IsDevelopment())
{
    Console.WriteLine("Development mode ON");
}
if (!app.Environment.IsDevelopment())
{
    // Production: show custom error page
    app.UseExceptionHandler("/Dashboards/UnderConstruction");

    // Optional: HTTP Strict Transport Security
    app.UseHsts();
}

else
{
    // Development: show detailed error
    app.UseDeveloperExceptionPage();
}

// Custom 404 handling (fallback)
app.UseStatusCodePagesWithReExecute("/Dashboards/NotFound");
Console.WriteLine("Current Environment: " + builder.Environment.EnvironmentName);

app.Run();

// --- Helper class for native DLL load ---
public class CustomAssemblyLoadContext : AssemblyLoadContext
{
    public IntPtr LoadUnmanagedLibrary(string absolutePath)
    {
        return LoadUnmanagedDllFromPath(absolutePath);
    }

    protected override Assembly Load(AssemblyName assemblyName)
    {
        return null;
    }
}

