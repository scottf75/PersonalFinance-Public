using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface IBudgetPlanService
    {
        // Budget Plan CRUD
        Task<IEnumerable<BudgetPlan>> GetAllBudgetPlansAsync();
        Task<BudgetPlan?> GetBudgetPlanByIdAsync(int id);
        Task<BudgetPlan> CreateBudgetPlanAsync(BudgetPlan plan);
        Task<BudgetPlan> UpdateBudgetPlanAsync(int id, BudgetPlan plan);
        Task<bool> DeleteBudgetPlanAsync(int id);

        // Category Management
        Task<IEnumerable<BudgetPlanCategory>> GetBudgetPlanCategoriesAsync(int budgetPlanId);
        Task<BudgetPlanCategory> AddCategoryToPlanAsync(int budgetPlanId, int categoryId, decimal amount);
        Task<BudgetPlanCategory> UpdatePlanCategoryAsync(int budgetPlanId, int categoryId, decimal amount);
        Task<bool> RemoveCategoryFromPlanAsync(int budgetPlanId, int categoryId);
        Task BatchUpdateCategoriesAsync(int budgetPlanId, IEnumerable<BudgetPlanCategory> categories);

        // Account Management
        Task<IEnumerable<BudgetPlanAccount>> GetBudgetPlanAccountsAsync(int budgetPlanId);
        Task SetPlanAccountsAsync(int budgetPlanId, IEnumerable<int> accountIds);

        // Reporting
        Task<BudgetPlanReport> GetBudgetPlanReportAsync(int budgetPlanId, DateTime? startDate = null, DateTime? endDate = null);
        Task<IEnumerable<Transactional>> GetCategoryTransactionsAsync(int budgetPlanId, int categoryId, DateTime? startDate = null, DateTime? endDate = null);
    }
}
