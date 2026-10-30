using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface IBudgetService
    {
        IEnumerable<Budget> GetBudgetsByMonth(int year, int month);
        Budget? GetBudgetById(int id);
        Budget CreateOrUpdateBudget(Budget budget);
        void SaveBudgets(int year, int month, IEnumerable<Budget> budgets);
        bool DeleteBudget(int id);
        MonthlySummary GetMonthlySummary(int year, int month);
    }
}
