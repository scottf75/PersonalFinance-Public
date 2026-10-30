using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface ISettingsService
    {
        IEnumerable<Setting> GetAllSettings();
        Setting? GetSettingById(int id);
        Setting? GetSettingByName(string name);
        Setting AddSetting(Setting setting);
        Setting? UpdateSetting(Setting setting);
        bool DeleteSetting(int id);
    }
}
