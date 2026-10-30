
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface BudgetItem {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
}

interface BudgetProgressProps {
  budgets: BudgetItem[];
}

const BudgetProgress = ({ budgets }: BudgetProgressProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const calculatePercentage = (spent: number, budgeted: number) => {
    return Math.min(Math.round((spent / budgeted) * 100), 100);
  };

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage < 70) return "bg-finance-success";
    if (percentage < 90) return "bg-finance-warning";
    return "bg-finance-danger";
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((budget) => (
          <div key={budget.id} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{budget.category}</span>
              <span>
                {formatCurrency(budget.spent)} of {formatCurrency(budget.budgeted)}
              </span>
            </div>
            <Progress
              value={calculatePercentage(budget.spent, budget.budgeted)}
              className={`h-2 ${getProgressColor(budget.spent, budget.budgeted)}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;
