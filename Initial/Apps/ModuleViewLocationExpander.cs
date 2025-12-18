using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Razor;

public class ModuleViewLocationExpander : IViewLocationExpander
{
    public void PopulateValues(ViewLocationExpanderContext context)
    {
        // Not needed
    }

    public IEnumerable<string> ExpandViewLocations(ViewLocationExpanderContext context, IEnumerable<string> viewLocations)
    {
        string module = "Default";

        if (context.ActionContext.ActionDescriptor is ControllerActionDescriptor cad)
        {
            var ns = cad.ControllerTypeInfo.Namespace ?? string.Empty;

            if (!string.IsNullOrEmpty(ns))
            {
                var parts = ns.Split('.');
                // Find "Apps" in namespace
                int appsIndex = Array.IndexOf(parts, "Apps"); // parts is string[], correct
                if (appsIndex >= 0 && appsIndex + 1 < parts.Length)
                {
                    module = parts[appsIndex + 1]; // Accounts, Inventory, etc.
                }
            }
        }

        var locations = new[]
        {
            $"/Apps/{module}/{{1}}/{{0}}.cshtml", // module/controller/action
            "/Views/Shared/{0}.cshtml"            // fallback
        };

        return locations.Concat(viewLocations);
    }
}
