import { useState, useEffect } from "react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import MonthSelector from "@/components/budget/MonthSelector";
import BudgetSummaryCards from "@/components/budget/BudgetSummaryCards";
import BudgetCategoryCard from "@/components/budget/BudgetCategoryCard";
import EditBudgetDialog from "@/components/budget/EditBudgetDialog";
import type { MonthlySummary, BudgetSummaryItem } from "@/types/budget";

const Budgets = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<BudgetSummaryItem | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await apiClient.fetch(
        `${api.budgets}/summary?year=${year}&month=${month}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch budget summary");
      }
      const data: MonthlySummary = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching budget summary:", error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [year, month]);

  const handlePreviousMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;

    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleEditBudget = (item: BudgetSummaryItem) => {
    setEditingItem(item);
  };

  const handleBudgetUpdated = () => {
    fetchSummary();
  };

  // Separate categories with and without budgets
  const categoriesWithBudget = summary?.categoryBudgets.filter(
    (item) => item.budgetAmount > 0
  ) || [];
  const categoriesWithoutBudget = summary?.categoryBudgets.filter(
    (item) => item.budgetAmount === 0
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
        <MonthSelector
          year={year}
          month={month}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
        />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading budget data...</div>
      ) : summary ? (
        <>
          <BudgetSummaryCards
            totalIncome={summary.totalIncome}
            totalExpenses={summary.totalExpenses}
            netDifference={summary.netDifference}
          />

          {categoriesWithBudget.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Budgeted Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesWithBudget.map((item) => (
                  <BudgetCategoryCard
                    key={item.categoryId}
                    item={item}
                    onEdit={handleEditBudget}
                  />
                ))}
              </div>
            </div>
          )}

          {categoriesWithoutBudget.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-muted-foreground">
                Categories Without Budget
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesWithoutBudget.map((item) => (
                  <BudgetCategoryCard
                    key={item.categoryId}
                    item={item}
                    onEdit={handleEditBudget}
                  />
                ))}
              </div>
            </div>
          )}

          {summary.categoryBudgets.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No categories found. Create categories first to set up budgets.
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          Failed to load budget data. Please try again.
        </div>
      )}

      <EditBudgetDialog
        item={editingItem}
        year={year}
        month={month}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onBudgetUpdated={handleBudgetUpdated}
      />
    </div>
  );
};

export default Budgets;
