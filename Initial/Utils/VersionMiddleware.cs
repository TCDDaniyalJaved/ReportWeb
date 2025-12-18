namespace Initial.Utils
{
    public class VersionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _activeVersion;
        private static readonly string[] CorePrefixes = new[]
        {
            "/login", "/app", "/home", "/error", "/_content"
        };

        public VersionMiddleware(RequestDelegate next, IConfiguration config)
        {
            _next = next;
            _activeVersion = config["AppSettings:ActiveVersion"] ?? "v1";
        }

        public async Task InvokeAsync(HttpContext ctx)
        {
            var path = ctx.Request.Path.Value?.ToLower() ?? "/";

            if (path == "/" || Path.HasExtension(path))
            {
                await _next(ctx);
                return;
            }

            if (CorePrefixes.Any(prefix => path.StartsWith(prefix)))
            {
                await _next(ctx);
                return;
            }

            if (!path.StartsWith($"/{_activeVersion}", StringComparison.OrdinalIgnoreCase))
            {
                ctx.Response.Redirect($"/{_activeVersion}{path}");
                return;
            }

            await _next(ctx);
        }
    }
}
