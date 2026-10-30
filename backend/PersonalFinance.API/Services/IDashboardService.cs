using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface IDashboardService
    {
        Task<DashboardSummary> GetDashboardSummaryAsync(DateTime? month = null);
    }
}
