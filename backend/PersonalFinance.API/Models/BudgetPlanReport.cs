namespace PersonalFinance.API.Models
{
    public class BudgetPlanReport
    {
        public int BudgetPlanId { get; set; }
        public string BudgetPlanName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalBudgeted { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal NetDifference { get; set; }
        public List<BudgetPlanCategoryReport> CategoryReports { get; set; } = new();
        public List<BudgetPlanAccountSummary> AccountSummaries { get; set; } = new();
    }

    public class BudgetPlanCategoryReport
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? CategoryIcon { get; set; }
        public int CategoryType { get; set; } = 2; // 1 = Income, 2 = Expense
        public decimal BudgetAmount { get; set; }
        public decimal SpentAmount { get; set; }
        public decimal IncomeAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal PercentageUsed { get; set; }
    }

    public class BudgetPlanAccountSummary
    {
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string Institution { get; set; } = string.Empty;
        public int AccountType { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal TotalIncome { get; set; }
    }
}
