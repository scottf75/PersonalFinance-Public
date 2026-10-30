namespace PersonalFinance.API.Models
{
    public class BudgetSummaryItem
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? CategoryIcon { get; set; }
        public decimal BudgetAmount { get; set; }
        public decimal SpentAmount { get; set; }
        public decimal IncomeAmount { get; set; }
        public decimal RemainingAmount => BudgetAmount - SpentAmount;
        public double PercentageUsed => BudgetAmount > 0 ? (double)(SpentAmount / BudgetAmount * 100) : 0;
    }

    public class MonthlySummary
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetDifference => TotalIncome - TotalExpenses;
        public List<BudgetSummaryItem> CategoryBudgets { get; set; } = new List<BudgetSummaryItem>();
    }
}
