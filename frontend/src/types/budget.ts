export interface Budget {
  id: number;
  year: number;
  month: number;
  categoryId: number;
  budgetAmount: number;
}

export interface BudgetSummaryItem {
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  budgetAmount: number;
  spentAmount: number;
  incomeAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netDifference: number;
  categoryBudgets: BudgetSummaryItem[];
}
