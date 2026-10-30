
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface BalanceCardProps {
  title: string;
  amount: number;
  change?: number;
  changeType?: "increase" | "decrease";
}

const BalanceCard = ({
  title,
  amount,
  change,
  changeType = "increase",
}: BalanceCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
          {change !== undefined && (
            <div
              className={`flex items-center text-sm ${
                changeType === "increase" ? "text-finance-success" : "text-finance-danger"
              }`}
            >
              {changeType === "increase" ? (
                <ArrowUp className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDown className="mr-1 h-4 w-4" />
              )}
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
