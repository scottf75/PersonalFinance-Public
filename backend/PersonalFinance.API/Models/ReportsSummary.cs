namespace PersonalFinance.API.Models
{
    public class ReportsSummary
    {
        public List<MonthlyTrend> MonthlyTrends { get; set; } = new();
        public List<CategorySpending> CategorySpending { get; set; } = new();
        public ReportTotals Totals { get; set; } = new();
    }

    public class MonthlyTrend
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal Income { get; set; }
        public decimal Expenses { get; set; }
        public decimal Savings { get; set; }
    }

    public class ReportTotals
    {
        public decimal TotalIncome { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal TotalSavings { get; set; }
        public decimal AverageMonthlyIncome { get; set; }
        public decimal AverageMonthlyExpenses { get; set; }
        public decimal AverageMonthlySavings { get; set; }
    }
}
