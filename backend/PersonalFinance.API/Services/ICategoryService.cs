using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{


    public interface ICategoryService
    {
        Category AddCategory(Category category);
        Category UpdateCategory(Category category);
        bool DeleteCategory(int id);
        IEnumerable<Category> GetAllCategories();
        Category GetCategoryById(int id);
        Task<Category> ToggleCategoryActiveAsync(int id);
    }

}