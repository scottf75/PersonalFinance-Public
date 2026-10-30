namespace PersonalFinance.API.Models
{
    public class DashboardSummary
    {
        public decimal NetWorth { get; set; }
        public decimal MonthlyIncome { get; set; }
        public decimal MonthlyExpenses { get; set; }
        public decimal MonthlySavings { get; set; }
        public decimal? PreviousMonthIncome { get; set; }
        public decimal? PreviousMonthExpenses { get; set; }
        public List<CategorySpending> ExpensesByCategory { get; set; } = new();
        public List<RecentTransaction> RecentTransactions { get; set; } = new();
        public List<BudgetProgressItem> BudgetProgress { get; set; } = new();
        public int? ActiveBudgetPlanId { get; set; }
        public string? ActiveBudgetPlanName { get; set; }
    }

    public class CategorySpending
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? CategoryIcon { get; set; }
        public decimal Amount { get; set; }
        public string Color { get; set; } = "#0ea5e9";
    }

    public class RecentTransaction
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string? CategoryIcon { get; set; }
        public decimal Amount { get; set; }
        public string Type { get; set; } = "expense"; // "income" or "expense"
    }

    public class BudgetProgressItem
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? CategoryIcon { get; set; }
        public decimal Budgeted { get; set; }
        public decimal Spent { get; set; }
    }
}
