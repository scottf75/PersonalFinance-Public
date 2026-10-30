import { useEffect, useState } from "react";
import BalanceCard from "@/components/dashboard/BalanceCard";
import TransactionsList from "@/components/dashboard/TransactionsList";
import ExpensesByCategory from "@/components/dashboard/ExpensesByCategory";
import BudgetProgress from "@/components/dashboard/BudgetProgress";
import AIQueryBox from "@/components/dashboard/AIQueryBox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";

interface DashboardSummary {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  previousMonthIncome?: number;
  previousMonthExpenses?: number;
  expensesByCategory: CategorySpending[];
  recentTransactions: RecentTransaction[];
  budgetProgress: BudgetProgressItem[];
  activeBudgetPlanId?: number;
  activeBudgetPlanName?: string;
}

interface CategorySpending {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string;
  amount: number;
  color: string;
}

interface RecentTransaction {
  id: number;
  date: string;
  description: string;
  categoryName: string;
  categoryIcon?: string;
  amount: number;
  type: "income" | "expense";
}

interface BudgetProgressItem {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string;
  budgeted: number;
  spent: number;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.fetch(`${api.dashboard}/summary`);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data: DashboardSummary = await response.json();
      setSummary(data);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentageChange = (current: number, previous: number | undefined): number | undefined => {
    if (previous === undefined || previous === 0) return undefined;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  // Transform data for components
  const categoryData = summary?.expensesByCategory.map(cat => ({
    name: cat.categoryName,
    value: cat.amount,
    color: cat.color,
  })) || [];

  const transactions = summary?.recentTransactions.map(t => ({
    id: t.id.toString(),
    date: t.date,
    description: t.description,
    category: t.categoryName,
    amount: Math.abs(t.amount),
    type: t.type,
  })) || [];

  const budgets = summary?.budgetProgress.map(b => ({
    id: b.categoryId.toString(),
    category: b.categoryName,
    budgeted: b.budgeted,
    spent: b.spent,
  })) || [];

  const incomeChange = calculatePercentageChange(summary?.monthlyIncome || 0, summary?.previousMonthIncome);
  const expenseChange = calculatePercentageChange(summary?.monthlyExpenses || 0, summary?.previousMonthExpenses);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          title="Net Worth"
          amount={summary?.netWorth || 0}
        />
        <BalanceCard
          title="Monthly Income"
          amount={summary?.monthlyIncome || 0}
          change={incomeChange}
          changeType={incomeChange !== undefined && incomeChange >= 0 ? "increase" : "decrease"}
        />
        <BalanceCard
          title="Monthly Expenses"
          amount={summary?.monthlyExpenses || 0}
          change={expenseChange !== undefined ? Math.abs(expenseChange) : undefined}
          changeType={expenseChange !== undefined && expenseChange <= 0 ? "decrease" : "increase"}
        />
        <BalanceCard
          title="Monthly Savings"
          amount={summary?.monthlySavings || 0}
        />
      </div>

      {/* AI Query Box */}
      <AIQueryBox />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {budgets.length > 0 ? (
          <BudgetProgress budgets={budgets} />
        ) : (
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Budget Progress</h3>
            <p className="text-muted-foreground text-sm">
              No active budget plan for this month.
              <a href="/budget-plans" className="text-primary hover:underline ml-1">
                Create one
              </a>
            </p>
          </div>
        )}
        {categoryData.length > 0 ? (
          <ExpensesByCategory data={categoryData} />
        ) : (
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Expenses by Category</h3>
            <p className="text-muted-foreground text-sm">
              No expenses recorded this month.
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="outline" size="sm" asChild>
            <a href="/accounts">View All</a>
          </Button>
        </div>
        {transactions.length > 0 ? (
          <TransactionsList transactions={transactions} />
        ) : (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No transactions found. Sync your accounts or add transactions manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
