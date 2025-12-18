using Initial.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using System.Text.Json;

namespace Initial.Services
{
    public class MenuService : IMenuService
    {
        private readonly EbitContext _context;
        public MenuService(EbitContext context) => _context = context;

        public async Task<IEnumerable<App>> GetAllAppsAsync() => await _context.Apps
            .Where( a => a.IsActive).OrderBy(a => a.SeqNo).ToListAsync();

        public async Task<IEnumerable<MainMenu>> GetMenusByAppAsync(int appId)
        {
            return await _context.MainMenus.Where(m => m.AppId == appId && m.Linkable ).OrderBy(m => m.Seqno).ToListAsync();
        }

        public async Task<App?> GetAppByIdAsync(int id)
        {
            return await _context.Apps.FirstOrDefaultAsync(a => a.Id == id);
        }


    }

}
