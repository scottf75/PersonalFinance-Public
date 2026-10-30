using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;
using System.Globalization;

namespace PersonalFinance.API.Services
{
    public class ReportsService : IReportsService
    {
        private readonly IDatabase _database;
        private readonly IUserContext _userContext;
        private static readonly string[] CategoryColors = new[]
        {
            "#0ea5e9", "#38bdf8", "#7dd3fc", "#0284c7", "#0369a1",
            "#06b6d4", "#14b8a6", "#10b981", "#22c55e", "#84cc16",
            "#eab308", "#f59e0b", "#f97316", "#ef4444", "#ec4899"
        };

        public ReportsService(IDatabase database, IUserContext userContext)
        {
            _database = database ?? throw new ArgumentNullException(nameof(database));
            _userContext = userContext ?? throw new ArgumentNullException(nameof(userContext));
        }

        public async Task<ReportsSummary> GetReportsSummaryAsync(int months = 12, int? categoryMonth = null, int? categoryYear = null)
        {
            var summary = new ReportsSummary();

            // Get monthly trends for the past N months
            summary.MonthlyTrends = await GetMonthlyTrendsAsync(months);

            // Get category spending for specified month or current month
            var targetYear = categoryYear ?? DateTime.Now.Year;
            var targetMonth = categoryMonth ?? DateTime.Now.Month;
            summary.CategorySpending = await GetCategorySpendingAsync(targetYear, targetMonth);

            // Calculate totals
            summary.Totals = CalculateTotals(summary.MonthlyTrends);

            return summary;
        }

        private async Task<List<MonthlyTrend>> GetMonthlyTrendsAsync(int months)
        {
            var userId = _userContext.GetCurrentUserId();
            var endDate = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(1).AddDays(-1);
            var startDate = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(-(months - 1));

            var sql = @"
                SELECT
                    EXTRACT(YEAR FROM t.transactiondate)::int as Year,
                    EXTRACT(MONTH FROM t.transactiondate)::int as Month,
                    COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as Income,
                    COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as Expenses
                FROM transaction t
                WHERE t.transactiondate >= @0 AND t.transactiondate <= @1 AND t.userid = @2
                GROUP BY EXTRACT(YEAR FROM t.transactiondate), EXTRACT(MONTH FROM t.transactiondate)
                ORDER BY Year, Month";

            var results = await _database.FetchAsync<MonthlyTrendRaw>(sql, startDate, endDate, userId);

            // Build complete list including months with no transactions
            var trends = new List<MonthlyTrend>();
            var currentDate = startDate;

            while (currentDate <= endDate)
            {
                var existingData = results.FirstOrDefault(r => r.Year == currentDate.Year && r.Month == currentDate.Month);

                trends.Add(new MonthlyTrend
                {
                    Year = currentDate.Year,
                    Month = currentDate.Month,
                    MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(currentDate.Month),
                    Income = existingData?.Income ?? 0,
                    Expenses = existingData?.Expenses ?? 0,
                    Savings = (existingData?.Income ?? 0) - (existingData?.Expenses ?? 0)
                });

                currentDate = currentDate.AddMonths(1);
            }

            return trends;
        }

        private async Task<List<CategorySpending>> GetCategorySpendingAsync(int year, int month)
        {
            var userId = _userContext.GetCurrentUserId();
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            var sql = @"
                SELECT
                    c.id as CategoryId,
                    c.name as CategoryName,
                    c.icon as CategoryIcon,
                    COALESCE(SUM(ABS(t.amount)), 0) as Amount
                FROM transaction t
                JOIN category c ON t.categoryid = c.id
                WHERE t.transactiondate >= @0
                    AND t.transactiondate <= @1
                    AND t.amount < 0
                    AND t.userid = @2
                GROUP BY c.id, c.name, c.icon
                ORDER BY Amount DESC";

            var results = await _database.FetchAsync<CategorySpending>(sql, startDate, endDate, userId);

            // Assign colors
            for (int i = 0; i < results.Count; i++)
            {
                results[i].Color = CategoryColors[i % CategoryColors.Length];
            }

            return results;
        }

        private ReportTotals CalculateTotals(List<MonthlyTrend> trends)
        {
            var monthsWithData = trends.Count(t => t.Income > 0 || t.Expenses > 0);
            if (monthsWithData == 0) monthsWithData = 1; // Avoid division by zero

            return new ReportTotals
            {
                TotalIncome = trends.Sum(t => t.Income),
                TotalExpenses = trends.Sum(t => t.Expenses),
                TotalSavings = trends.Sum(t => t.Savings),
                AverageMonthlyIncome = Math.Round(trends.Sum(t => t.Income) / monthsWithData, 2),
                AverageMonthlyExpenses = Math.Round(trends.Sum(t => t.Expenses) / monthsWithData, 2),
                AverageMonthlySavings = Math.Round(trends.Sum(t => t.Savings) / monthsWithData, 2)
            };
        }

        // Helper class for raw database results
        private class MonthlyTrendRaw
        {
            public int Year { get; set; }
            public int Month { get; set; }
            public decimal Income { get; set; }
            public decimal Expenses { get; set; }
        }
    }
}
