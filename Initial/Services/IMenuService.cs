using Initial.Models;
using System.Reflection;

namespace Initial.Services
{
    public interface IMenuService
    {
        Task<IEnumerable<App>> GetAllAppsAsync();
        Task<IEnumerable<MainMenu>> GetMenusByAppAsync(int appId);
        Task<App?> GetAppByIdAsync(int id);

    }

}
