using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IDatabase _database;
        private readonly IUserContext _userContext;

        public CategoryService(IDatabase database, IUserContext userContext)
        {
            _database = database ?? throw new ArgumentNullException(nameof(database));
            _userContext = userContext ?? throw new ArgumentNullException(nameof(userContext));
        }

        public async Task<IEnumerable<Category>> GetAllCategoriesAsync()
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT id, name, description, icon, isactive, categorytype, userid FROM category WHERE userid = @0 ORDER BY name";
            return await _database.FetchAsync<Category>(sql, userId);
        }

        public async Task<Category> GetCategoryByIdAsync(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT id, name, description, icon, isactive, categorytype, userid FROM category WHERE id = @0 AND userid = @1";
            return await _database.FirstOrDefaultAsync<Category>(sql, id, userId);
        }

        public async Task<Category> CreateCategoryAsync(Category category)
        {
            var userId = _userContext.GetCurrentUserId();

            if (category == null)
                throw new ArgumentNullException(nameof(category));

            if (string.IsNullOrWhiteSpace(category.Name))
                throw new ArgumentException("Category name cannot be empty.", nameof(category));

            // Check if category with same name already exists for this user
            var existingCategory = await _database.FirstOrDefaultAsync<Category>(
                "SELECT id FROM category WHERE LOWER(name) = LOWER(@0) AND userid = @1", category.Name.Trim(), userId);

            if (existingCategory != null)
                throw new InvalidOperationException($"A category with the name '{category.Name}' already exists.");

            // Create new category
            var newCategory = new Category
            {
                Name = category.Name.Trim(),
                Description = category.Description?.Trim(),
                Icon = category.Icon?.Trim(),
                IsActive = true,
                CategoryType = category.CategoryType,
                UserId = userId
            };

            // Insert and get the generated ID
            var id = await _database.InsertAsync("category", "id", true, newCategory);
            newCategory.ID = Convert.ToInt32(id);

            return newCategory;
        }

        public async Task<Category> UpdateCategoryAsync(int id, Category category)
        {
            var userId = _userContext.GetCurrentUserId();

            if (category == null)
                throw new ArgumentNullException(nameof(category));

            if (string.IsNullOrWhiteSpace(category.Name))
                throw new ArgumentException("Category name cannot be empty.", nameof(category));

            var existingCategory = await _database.FirstOrDefaultAsync<Category>(
                "SELECT id, name, description, icon, isactive, categorytype, userid FROM category WHERE id = @0 AND userid = @1", id, userId);

            if (existingCategory == null)
                return null;

            // Check if another category with same name exists for this user (excluding current category)
            var duplicateCategory = await _database.FirstOrDefaultAsync<Category>(
                "SELECT id FROM category WHERE id != @0 AND LOWER(name) = LOWER(@1) AND userid = @2", id, category.Name.Trim(), userId);

            if (duplicateCategory != null)
                throw new InvalidOperationException($"A category with the name '{category.Name}' already exists.");

            // Update the existing category
            existingCategory.Name = category.Name.Trim();
            existingCategory.Description = category.Description?.Trim();
            existingCategory.Icon = category.Icon?.Trim();
            existingCategory.IsActive = category.IsActive;
            existingCategory.CategoryType = category.CategoryType;

            await _database.UpdateAsync("category", "id", existingCategory, id);
            return existingCategory;
        }

        public async Task<Category> ToggleCategoryActiveAsync(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var existingCategory = await _database.FirstOrDefaultAsync<Category>(
                "SELECT id, name, description, icon, isactive, categorytype, userid FROM category WHERE id = @0 AND userid = @1", id, userId);

            if (existingCategory == null)
                return null;

            existingCategory.IsActive = !existingCategory.IsActive;

            await _database.UpdateAsync("category", "id", existingCategory, id);
            return existingCategory;
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "DELETE FROM category WHERE id = @0 AND userid = @1";
            var rowsAffected = await _database.ExecuteAsync(sql, id, userId);
            return rowsAffected > 0;
        }

        // Synchronous methods
        public IEnumerable<Category> GetAllCategories()
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT id, name, description, icon, isactive, categorytype, userid FROM category WHERE userid = @0 ORDER BY name";
            return _database.Query<Category>(sql, userId);
        }

        public Category GetCategoryById(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT id, name, description, icon, isactive, categorytype, userid FROM category WHERE id = @0 AND userid = @1";
            return _database.FirstOrDefault<Category>(sql, id, userId);
        }

        public Category AddCategory(Category category)
        {
            var userId = _userContext.GetCurrentUserId();

            if (category == null)
                throw new ArgumentNullException(nameof(category));

            if (string.IsNullOrWhiteSpace(category.Name))
                throw new ArgumentException("Category name cannot be empty.", nameof(category));

            // Check if category with same name already exists for this user
            var existingCategory = _database.FirstOrDefault<Category>(
                "SELECT id FROM category WHERE LOWER(name) = LOWER(@0) AND userid = @1", category.Name.Trim(), userId);

            if (existingCategory != null)
                throw new InvalidOperationException($"A category with the name '{category.Name}' already exists.");

            // Create new category
            var newCategory = new Category
            {
                Name = category.Name.Trim(),
                Description = category.Description?.Trim(),
                Icon = category.Icon?.Trim(),
                IsActive = true,
                CategoryType = category.CategoryType,
                UserId = userId
            };

            // Insert and get the generated ID
            var id = _database.Insert("category", "id", true, newCategory);
            newCategory.ID = Convert.ToInt32(id);

            // Update the passed category with the generated ID
            category.ID = newCategory.ID;

            return category;
        }

        public Category UpdateCategory(Category category)
        {
            var userId = _userContext.GetCurrentUserId();

            if (category == null)
                throw new ArgumentNullException(nameof(category));

            if (string.IsNullOrWhiteSpace(category.Name))
                throw new ArgumentException("Category name cannot be empty.", nameof(category));

            var existingCategory = _database.FirstOrDefault<Category>(
                "SELECT id, name, description, icon, isactive, categorytype, userid FROM category WHERE id = @0 AND userid = @1", category.ID, userId);

            if (existingCategory == null)
                throw new InvalidOperationException($"Category with ID {category.ID} not found.");

            // Check if another category with same name exists for this user (excluding current category)
            var duplicateCategory = _database.FirstOrDefault<Category>(
                "SELECT id FROM category WHERE id != @0 AND LOWER(name) = LOWER(@1) AND userid = @2",
                category.ID, category.Name.Trim(), userId);

            if (duplicateCategory != null)
                throw new InvalidOperationException($"A category with the name '{category.Name}' already exists.");

            // Update the existing category
            existingCategory.Name = category.Name.Trim();
            existingCategory.Description = category.Description?.Trim();
            existingCategory.Icon = category.Icon?.Trim();
            existingCategory.IsActive = category.IsActive;
            existingCategory.CategoryType = category.CategoryType;

            _database.Update("category", "id", existingCategory, category.ID);

            return category;
        }

        public bool DeleteCategory(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "DELETE FROM category WHERE id = @0 AND userid = @1";
            var rowsAffected = _database.Execute(sql, id, userId);

            if (rowsAffected == 0)
                throw new InvalidOperationException($"Category with ID {id} not found.");

            return rowsAffected > 0;
        }
    }
}
