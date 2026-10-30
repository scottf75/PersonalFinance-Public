using PersonalFinance.API.Helpers;
using PersonalFinance.API.Models;
using PetaPoco;

namespace PersonalFinance.API.Services
{
    public class BudgetService : IBudgetService
    {
        private readonly IDatabase _database;
        private readonly IUserContext _userContext;

        public BudgetService(IDatabase database, IUserContext userContext)
        {
            _database = database ?? throw new ArgumentNullException(nameof(database));
            _userContext = userContext ?? throw new ArgumentNullException(nameof(userContext));
        }

        public IEnumerable<Budget> GetBudgetsByMonth(int year, int month)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = @"SELECT id, year, month, categoryid, budgetamount, userid
                        FROM budget
                        WHERE year = @0 AND month = @1 AND userid = @2";
            return _database.Query<Budget>(sql, year, month, userId);
        }

        public Budget? GetBudgetById(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "SELECT id, year, month, categoryid, budgetamount, userid FROM budget WHERE id = @0 AND userid = @1";
            return _database.FirstOrDefault<Budget>(sql, id, userId);
        }

        public Budget CreateOrUpdateBudget(Budget budget)
        {
            var userId = _userContext.GetCurrentUserId();

            if (budget == null)
                throw new ArgumentNullException(nameof(budget));

            // Check if a budget already exists for this category/year/month for this user
            var existingBudget = _database.FirstOrDefault<Budget>(
                @"SELECT id, year, month, categoryid, budgetamount, userid
                  FROM budget
                  WHERE year = @0 AND month = @1 AND categoryid = @2 AND userid = @3",
                budget.Year, budget.Month, budget.CategoryId, userId);

            if (existingBudget != null)
            {
                // Update existing budget
                existingBudget.BudgetAmount = budget.BudgetAmount;
                _database.Update("budget", "id", existingBudget, existingBudget.ID);
                return existingBudget;
            }
            else
            {
                // Create new budget
                budget.UserId = userId;
                var id = _database.Insert("budget", "id", true, budget);
                budget.ID = Convert.ToInt32(id);
                return budget;
            }
        }

        public void SaveBudgets(int year, int month, IEnumerable<Budget> budgets)
        {
            foreach (var budget in budgets)
            {
                budget.Year = year;
                budget.Month = month;
                CreateOrUpdateBudget(budget);
            }
        }

        public bool DeleteBudget(int id)
        {
            var userId = _userContext.GetCurrentUserId();
            var sql = "DELETE FROM budget WHERE id = @0 AND userid = @1";
            var rowsAffected = _database.Execute(sql, id, userId);
            return rowsAffected > 0;
        }

        public MonthlySummary GetMonthlySummary(int year, int month)
        {
            var userId = _userContext.GetCurrentUserId();
            var summary = new MonthlySummary
            {
                Year = year,
                Month = month
            };

            // Calculate date range for the month
            var startDate = new DateTime(year, month, 1);
            var nextMonthStart = startDate.AddMonths(1);

            // Get total income (positive amounts)
            var incomeSql = @"SELECT COALESCE(SUM(amount), 0)
                              FROM ""transaction""
                              WHERE transactiondate >= @0 AND transactiondate < @1 AND amount > 0 AND userid = @2";
            summary.TotalIncome = _database.ExecuteScalar<decimal>(incomeSql, startDate, nextMonthStart, userId);

            // Get total expenses (negative amounts, returned as positive)
            var expenseSql = @"SELECT COALESCE(ABS(SUM(amount)), 0)
                               FROM ""transaction""
                               WHERE transactiondate >= @0 AND transactiondate < @1 AND amount < 0 AND userid = @2";
            summary.TotalExpenses = _database.ExecuteScalar<decimal>(expenseSql, startDate, nextMonthStart, userId);

            // Get all categories with their budgets, spending, and income for this user
            var categorySql = @"
                SELECT
                    c.id as CategoryId,
                    c.name as CategoryName,
                    c.icon as CategoryIcon,
                    COALESCE(b.budgetamount, 0) as BudgetAmount,
                    COALESCE(ABS(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)), 0) as SpentAmount,
                    COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as IncomeAmount
                FROM category c
                LEFT JOIN budget b ON c.id = b.categoryid AND b.year = @0 AND b.month = @1 AND b.userid = @4
                LEFT JOIN ""transaction"" t ON c.id = t.categoryid
                    AND t.transactiondate >= @2 AND t.transactiondate < @3 AND t.userid = @4
                WHERE c.userid = @4
                GROUP BY c.id, c.name, c.icon, b.budgetamount
                ORDER BY c.name";

            summary.CategoryBudgets = _database.Fetch<BudgetSummaryItem>(categorySql, year, month, startDate, nextMonthStart, userId);

            return summary;
        }
    }
}
