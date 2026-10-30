export interface BudgetPlan {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: BudgetPlanCategory[];
  accounts?: BudgetPlanAccount[];
  // Summary fields
  categoryCount?: number;
  accountCount?: number;
  totalBudgeted?: number;
}

export interface BudgetPlanCategory {
  id: number;
  budgetPlanId: number;
  categoryId: number;
  budgetAmount: number;
  createdAt?: string;
  updatedAt?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryType?: number; // 1 = Income, 2 = Expense
}

export interface BudgetPlanAccount {
  id: number;
  budgetPlanId: number;
  accountId: number;
  createdAt?: string;
  accountName?: string;
  institution?: string;
  accountType?: number;
}

export interface BudgetPlanReport {
  budgetPlanId: number;
  budgetPlanName: string;
  startDate: string;
  endDate: string;
  totalBudgeted: number;
  totalSpent: number;
  totalIncome: number;
  netDifference: number;
  categoryReports: BudgetPlanCategoryReport[];
  accountSummaries: BudgetPlanAccountSummary[];
}

export interface BudgetPlanCategoryReport {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string;
  categoryType?: number; // 1 = Income, 2 = Expense
  budgetAmount: number;
  spentAmount: number;
  incomeAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

export interface BudgetPlanAccountSummary {
  accountId: number;
  accountName: string;
  institution: string;
  accountType: number;
  totalSpent: number;
  totalIncome: number;
}

// Request types
export interface CreateBudgetPlanRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface AddCategoryRequest {
  categoryId: number;
  budgetAmount: number;
}

export interface UpdateCategoryRequest {
  budgetAmount: number;
}

export interface SetAccountsRequest {
  accountIds: number[];
}
