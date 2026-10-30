using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class SettingsService : ISettingsService
    {
        private readonly IDatabase _database;
        private readonly IUserContext _userContext;

        public SettingsService(IDatabase database, IUserContext userContext)
        {
            _database = database ?? throw new ArgumentNullException(nameof(database));
            _userContext = userContext ?? throw new ArgumentNullException(nameof(userContext));
        }

        public IEnumerable<Setting> GetAllSettings()
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT id, name, value, createdat, updatedat, userid FROM setting WHERE userid = @0 ORDER BY name";
            return _database.Query<Setting>(sql, userId);
        }

        public Setting? GetSettingById(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT id, name, value, createdat, updatedat, userid FROM setting WHERE id = @0 AND userid = @1";
            return _database.FirstOrDefault<Setting>(sql, id, userId);
        }

        public Setting? GetSettingByName(string name)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT id, name, value, createdat, updatedat, userid FROM setting WHERE LOWER(name) = LOWER(@0) AND userid = @1";
            return _database.FirstOrDefault<Setting>(sql, name, userId);
        }

        public Setting AddSetting(Setting setting)
        {
            var userId = _userContext.GetCurrentUserId();

            if (setting == null)
                throw new ArgumentNullException(nameof(setting));

            if (string.IsNullOrWhiteSpace(setting.Name))
                throw new ArgumentException("Setting name cannot be empty.", nameof(setting));

            // Check if setting with same name already exists for this user
            var existingSetting = _database.FirstOrDefault<Setting>(
                "SELECT id FROM setting WHERE LOWER(name) = LOWER(@0) AND userid = @1", setting.Name.Trim(), userId);

            if (existingSetting != null)
                throw new InvalidOperationException($"A setting with the name '{setting.Name}' already exists.");

            var now = DateTime.UtcNow;
            var newSetting = new Setting
            {
                Name = setting.Name.Trim(),
                Value = setting.Value?.Trim(),
                CreatedAt = now,
                UpdatedAt = now,
                UserId = userId
            };

            var id = _database.Insert("setting", "id", true, newSetting);
            newSetting.Id = Convert.ToInt32(id);

            return newSetting;
        }

        public Setting? UpdateSetting(Setting setting)
        {
            var userId = _userContext.GetCurrentUserId();

            if (setting == null)
                throw new ArgumentNullException(nameof(setting));

            if (string.IsNullOrWhiteSpace(setting.Name))
                throw new ArgumentException("Setting name cannot be empty.", nameof(setting));

            var existingSetting = _database.FirstOrDefault<Setting>(
                "SELECT id, name, value, createdat, updatedat, userid FROM setting WHERE id = @0 AND userid = @1", setting.Id, userId);

            if (existingSetting == null)
                return null;

            // Check if another setting with same name exists for this user (excluding current setting)
            var duplicateSetting = _database.FirstOrDefault<Setting>(
                "SELECT id FROM setting WHERE id != @0 AND LOWER(name) = LOWER(@1) AND userid = @2", setting.Id, setting.Name.Trim(), userId);

            if (duplicateSetting != null)
                throw new InvalidOperationException($"A setting with the name '{setting.Name}' already exists.");

            existingSetting.Name = setting.Name.Trim();
            existingSetting.Value = setting.Value?.Trim();
            existingSetting.UpdatedAt = DateTime.UtcNow;

            _database.Update("setting", "id", existingSetting, setting.Id);
            return existingSetting;
        }

        public bool DeleteSetting(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "DELETE FROM setting WHERE id = @0 AND userid = @1";
            var rowsAffected = _database.Execute(sql, id, userId);
            return rowsAffected > 0;
        }
    }
}
