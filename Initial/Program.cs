//using Initial.Models;
//using Microsoft.AspNetCore.Authentication.Cookies;
//using Microsoft.AspNetCore.Mvc.ApplicationParts;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.FileProviders;
//using Initial.Utils;
//using System.Reflection;
//using Initial.Services;

//var builder = WebApplication.CreateBuilder(args);
//builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
//builder.Services.AddHttpContextAccessor();
//builder.Services.AddDbContext<EbitContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("Default"),
//                sqlServerOptions =>
//                {
//                    sqlServerOptions.CommandTimeout(3600);
//                    sqlServerOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
//                }));

//builder.Services.AddScoped<EbitContextProcedures>();
//builder.Services.AddControllersWithViews();

//var mvcBuilder = builder.Services.AddControllersWithViews();
//ModuleLoader.LoadModules(builder.Services, builder.Configuration, mvcBuilder);
//builder.Services.AddScoped<IMenuService, MenuService>();
//builder.Services.AddSession();
//builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(
//  options =>
//  {
//      options.LoginPath = "/Login/";
//      options.AccessDeniedPath = "/Login/AccessDenied";
//  }
//  );

//var app = builder.Build();

//if (!app.Environment.IsDevelopment())
//{
//    app.UseExceptionHandler("/Testing/Error");
//    app.UseHsts();
//}

//app.UseHttpsRedirection();
//app.UseStaticFiles();
//app.UseSession();
//app.UseRouting();
//app.UseDeveloperExceptionPage();
//app.UseAuthentication();
//app.UseAuthorization();

//app.MapControllerRoute(
//    name: "default",
//    pattern: "{controller=Login}/{action=Index}/{id?}");

//app.Run();
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using Initial.Models;
using Initial.Services;
using Initial.Utils;

var builder = WebApplication.CreateBuilder(args);

// Read version dynamically
var activeVersion = builder.Configuration["AppSettings:ActiveVersion"] ?? "v1";

// Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddSession();

builder.Services.AddDbContext<EbitContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<EbitContextProcedures>();
builder.Services.AddScoped<IMenuService, MenuService>();

var mvcBuilder = builder.Services.AddControllersWithViews();

// Load modular DLLs (Accounting, Inventory, etc.)
string appsFolder = Path.Combine(AppContext.BaseDirectory, "apps");
ModuleLoader.LoadModules(builder.Services, builder.Configuration, mvcBuilder, appsFolder);

// Optional Base.dll
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

// Middleware
//app.UseMiddleware<VersionMiddleware>(builder.Configuration);
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

app.Run();
