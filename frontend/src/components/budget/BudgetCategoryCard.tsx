import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BudgetSummaryItem } from "@/types/budget";

interface BudgetCategoryCardProps {
  item: BudgetSummaryItem;
  onEdit: (item: BudgetSummaryItem) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

const BudgetCategoryCard = ({ item, onEdit }: BudgetCategoryCardProps) => {
  const percentage = Math.min(Math.round(item.percentageUsed), 100);

  const getProgressColor = () => {
    if (item.budgetAmount === 0) return "bg-muted";
    if (percentage < 70) return "bg-green-500";
    if (percentage < 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTextColor = () => {
    if (item.budgetAmount === 0) return "text-muted-foreground";
    if (percentage < 70) return "text-green-600";
    if (percentage < 90) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.categoryIcon || "📁"}</span>
            <CardTitle className="text-base">{item.categoryName}</CardTitle>
          </div>
          {item.budgetAmount > 0 && (
            <span className={`text-sm font-medium ${getTextColor()}`}>
              {percentage}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {item.budgetAmount > 0 ? (
          <>
            <Progress
              value={percentage}
              className={`h-2 [&>div]:${getProgressColor()}`}
            />
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Spent: {formatCurrency(item.spentAmount)}</span>
                <span>
                  Remaining: {formatCurrency(Math.max(item.remainingAmount, 0))}
                </span>
              </div>
              {item.incomeAmount > 0 && (
                <div className="text-green-600">
                  Income: {formatCurrency(item.incomeAmount)}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>No budget set</p>
            {item.spentAmount > 0 && (
              <p>Spent: {formatCurrency(item.spentAmount)}</p>
            )}
            {item.incomeAmount > 0 && (
              <p className="text-green-600">Income: {formatCurrency(item.incomeAmount)}</p>
            )}
            {item.spentAmount === 0 && item.incomeAmount === 0 && (
              <p>No transactions this month</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1 mt-auto">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm font-semibold">
            Budget: {item.budgetAmount > 0 ? formatCurrency(item.budgetAmount) : "Not set"}
          </span>
          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
            Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BudgetCategoryCard;
