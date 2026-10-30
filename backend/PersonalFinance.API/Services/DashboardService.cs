using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IDatabase _database;
        private readonly IUserContext _userContext;
        private static readonly string[] CategoryColors = new[]
        {
            "#0ea5e9", "#38bdf8", "#7dd3fc", "#0284c7", "#0369a1",
            "#06b6d4", "#14b8a6", "#10b981", "#22c55e", "#84cc16",
            "#eab308", "#f59e0b", "#f97316", "#ef4444", "#ec4899"
        };

        public DashboardService(IDatabase database, IUserContext userContext)
        {
            _database = database ?? throw new ArgumentNullException(nameof(database));
            _userContext = userContext ?? throw new ArgumentNullException(nameof(userContext));
        }

        public async Task<DashboardSummary> GetDashboardSummaryAsync(DateTime? month = null)
        {
            var targetMonth = month ?? DateTime.Now;
            var startOfMonth = new DateTime(targetMonth.Year, targetMonth.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

            var startOfPrevMonth = startOfMonth.AddMonths(-1);
            var endOfPrevMonth = startOfMonth.AddDays(-1);

            var summary = new DashboardSummary();

            // Get net worth (sum of all account balances)
            summary.NetWorth = await GetNetWorthAsync();

            // Get monthly income and expenses
            var (income, expenses) = await GetMonthlyTotalsAsync(startOfMonth, endOfMonth);
            summary.MonthlyIncome = income;
            summary.MonthlyExpenses = expenses;
            summary.MonthlySavings = income - expenses;

            // Get previous month totals for comparison
            var (prevIncome, prevExpenses) = await GetMonthlyTotalsAsync(startOfPrevMonth, endOfPrevMonth);
            summary.PreviousMonthIncome = prevIncome;
            summary.PreviousMonthExpenses = prevExpenses;

            // Get expenses by category for the month
            summary.ExpensesByCategory = await GetExpensesByCategoryAsync(startOfMonth, endOfMonth);

            // Get recent transactions (last 10)
            summary.RecentTransactions = await GetRecentTransactionsAsync(10);

            // Get active budget plan progress
            var (budgetPlanId, budgetPlanName, budgetProgress) = await GetActiveBudgetProgressAsync(startOfMonth, endOfMonth);
            summary.ActiveBudgetPlanId = budgetPlanId;
            summary.ActiveBudgetPlanName = budgetPlanName;
            summary.BudgetProgress = budgetProgress;

            return summary;
        }

        private async Task<decimal> GetNetWorthAsync()
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT COALESCE(SUM(balance), 0) FROM account WHERE userid = @0";
            return await _database.ExecuteScalarAsync<decimal>(sql, userId);
        }

        private async Task<(decimal income, decimal expenses)> GetMonthlyTotalsAsync(DateTime startDate, DateTime endDate)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT
                    COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as income,
                    COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as expenses
                FROM transaction t
                WHERE t.transactiondate >= @0 AND t.transactiondate <= @1 AND t.userid = @2";

            var result = await _database.FetchAsync<dynamic>(sql, startDate, endDate, userId);
            if (result.Any())
            {
                var row = result.First();
                return ((decimal)row.income, (decimal)row.expenses);
            }
            return (0, 0);
        }

        private async Task<List<CategorySpending>> GetExpensesByCategoryAsync(DateTime startDate, DateTime endDate)
        {
            var userId = _userContext.GetCurrentUserId();
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
                ORDER BY Amount DESC
                LIMIT 10";

            var results = await _database.FetchAsync<CategorySpending>(sql, startDate, endDate, userId);

            // Assign colors
            for (int i = 0; i < results.Count; i++)
            {
                results[i].Color = CategoryColors[i % CategoryColors.Length];
            }

            return results;
        }

        private async Task<List<RecentTransaction>> GetRecentTransactionsAsync(int count)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"
                SELECT
                    t.id as Id,
                    t.transactiondate as Date,
                    t.description as Description,
                    c.name as CategoryName,
                    c.icon as CategoryIcon,
                    t.amount as Amount,
                    CASE WHEN t.amount >= 0 THEN 'income' ELSE 'expense' END as Type
                FROM transaction t
                JOIN category c ON t.categoryid = c.id
                WHERE t.userid = @1
                ORDER BY t.transactiondate DESC, t.id DESC
                LIMIT @0";

            return await _database.FetchAsync<RecentTransaction>(sql, count, userId);
        }

        private async Task<(int? planId, string? planName, List<BudgetProgressItem> progress)> GetActiveBudgetProgressAsync(DateTime startDate, DateTime endDate)
        {
            var userId = _userContext.GetCurrentUserId();
            // Find active budget plan that covers the current month for this user
            var planSql = @"
                SELECT id, name
                FROM budgetplan
                WHERE isactive = true
                    AND startdate <= @0
                    AND enddate >= @1
                    AND userid = @2
                ORDER BY startdate DESC
                LIMIT 1";

            var plan = await _database.FirstOrDefaultAsync<BudgetPlan>(planSql, endDate, startDate, userId);

            if (plan == null)
            {
                return (null, null, new List<BudgetProgressItem>());
            }

            // Get budget categories with their spending
            var sql = @"
                SELECT
                    c.id as CategoryId,
                    c.name as CategoryName,
                    c.icon as CategoryIcon,
                    bpc.budgetamount as Budgeted,
                    COALESCE(ABS(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)), 0) as Spent
                FROM budgetplancategory bpc
                JOIN category c ON bpc.categoryid = c.id
                LEFT JOIN transaction t ON t.categoryid = c.id
                    AND t.transactiondate >= @1
                    AND t.transactiondate <= @2
                    AND t.userid = @3
                WHERE bpc.budgetplanid = @0
                GROUP BY c.id, c.name, c.icon, bpc.budgetamount
                ORDER BY bpc.budgetamount DESC
                LIMIT 8";

            var progress = await _database.FetchAsync<BudgetProgressItem>(sql, plan.Id, startDate, endDate, userId);

            return (plan.Id, plan.Name, progress);
        }
    }
}
