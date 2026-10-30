using PersonalFinance.API.Models;

namespace PersonalFinance.API.Services
{
    public interface IReportsService
    {
        Task<ReportsSummary> GetReportsSummaryAsync(int months = 12, int? categoryMonth = null, int? categoryYear = null);
    }
}
