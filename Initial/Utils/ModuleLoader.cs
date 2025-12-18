using Initial.Models;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Razor.Compilation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using System.Diagnostics;
using System.Reflection;

public static class ModuleLoader
{
    public static void LoadModules(IServiceCollection services, IConfiguration config, IMvcBuilder mvcBuilder, string baseAppsFolder)
    {
        if (!Directory.Exists(baseAppsFolder)) return;

        // find latest version folder (v1, v2...) and customapps
        var versionFolders = Directory.GetDirectories(baseAppsFolder)
            .Where(d => Path.GetFileName(d).StartsWith("v", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(d => d).ToList();

        var dllPaths = new List<string>();
        if (versionFolders.Any())
            dllPaths.AddRange(Directory.GetFiles(versionFolders.First(), "*.dll", SearchOption.TopDirectoryOnly));

        var customPath = Path.Combine(baseAppsFolder, "customapps");
        if (Directory.Exists(customPath))
            dllPaths.AddRange(Directory.GetFiles(customPath, "*.dll", SearchOption.TopDirectoryOnly));

        string mainConnection = config.GetConnectionString("Default");

        foreach (var dll in dllPaths.Distinct())
        {
            try
            {
                var assembly = Assembly.LoadFrom(dll);

                // Register controllers & compiled razor views
                mvcBuilder.PartManager.ApplicationParts.Add(new AssemblyPart(assembly));
                mvcBuilder.PartManager.ApplicationParts.Add(new CompiledRazorAssemblyPart(assembly));

                // Register DbContexts found in module to use main DB
                foreach (var t in assembly.GetTypes().Where(t => typeof(DbContext).IsAssignableFrom(t) && !t.IsAbstract))
                {
                    var method = typeof(EntityFrameworkServiceCollectionExtensions)
                        .GetMethods(BindingFlags.Public | BindingFlags.Static)
                        .FirstOrDefault(m => m.Name == "AddDbContext" && m.IsGenericMethodDefinition);

                    var generic = method?.MakeGenericMethod(t);
                    generic?.Invoke(null, new object[]
                    {
                        services,
                        (Action<DbContextOptionsBuilder>)(opt =>
                            opt.UseSqlServer(mainConnection, sql =>
                            {
                                sql.CommandTimeout(3600);
                                sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
                            })),
                        ServiceLifetime.Scoped,
                        ServiceLifetime.Scoped
                    });
                }

                // register service/procedure classes automatically
                foreach (var svc in assembly.GetTypes().Where(t => (t.Name.EndsWith("Service") || t.Name.EndsWith("Procedures")) && t.IsClass && !t.IsAbstract))
                {
                    services.AddScoped(svc);
                }

                // Save module info into db (Apps table)
                SaveModuleInfo(config, dll);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to load {dll}: {ex.Message}");
            }
        }
    }

    private static void SaveModuleInfo(IConfiguration config, string dllPath)
    {
        try
        {
            var optionsBuilder = new DbContextOptionsBuilder<EbitContext>();
            optionsBuilder.UseSqlServer(config.GetConnectionString("Default"));
            using var db = new EbitContext(optionsBuilder.Options);

            var name = Path.GetFileNameWithoutExtension(dllPath);
            if (db.Apps.Any(a => a.FilePath == dllPath)) return;

            byte nextSeq = (byte)((db.Apps.Any() ? (db.Apps.Max(a => a.SeqNo) ?? 0) + 1 : 1));
            db.Apps.Add(new App
            {
                Name = name,
                FolderName = Path.GetFileName(Path.GetDirectoryName(dllPath)) ?? "general",
                FilePath = dllPath,
                Description = "Auto registered module",
                Status = "Pending",
                SeqNo = nextSeq,
                IsActive = true
            });
            db.SaveChanges();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SaveModuleInfo failed: {ex.Message}");
        }
    }

    public static void MountEmbeddedStaticFiles(WebApplication app, string baseAppsFolder)
    {
        if (!Directory.Exists(baseAppsFolder)) return;
        foreach (var dll in Directory.GetFiles(baseAppsFolder, "*.dll", SearchOption.AllDirectories))
        {
            try
            {
                var asm = Assembly.LoadFrom(dll);
                var res = asm.GetManifestResourceNames().Where(r => r.Contains("wwwroot"));
                if (res.Any())
                {
                    var provider = new ManifestEmbeddedFileProvider(asm, "wwwroot");
                    app.UseStaticFiles(new StaticFileOptions { FileProvider = provider, RequestPath = "" });
                }
            }
            catch { }
        }
    }
}
