import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit2,
  Wallet,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import type { BudgetPlanReport as BudgetPlanReportType, BudgetPlanCategoryReport } from "@/types/budgetPlan";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  categoryId: number;
  accountId: number;
  transactionDate: string;
  checkNumber?: string;
  categoryName?: string;
  accountName?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
  "#82CA9D", "#FFC658", "#FF6B6B", "#4ECDC4", "#45B7D1",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 90) return "bg-yellow-500";
  return "bg-green-500";
};

const getRowClass = (percentage: number) => {
  if (percentage >= 100) return "bg-red-50 dark:bg-red-950/20";
  if (percentage >= 90) return "bg-yellow-50 dark:bg-yellow-950/20";
  return "";
};

type SortColumn = "category" | "budgeted" | "spent" | "remaining" | "percentage";
type FilterOption = "all" | "over" | "under";

interface MonthOption {
  year: number;
  month: number;
  label: string;
  startDate: string;
  endDate: string;
}

const BudgetPlanReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<BudgetPlanReportType | null>(null);
  const [budgetStartDate, setBudgetStartDate] = useState<string>("");
  const [budgetEndDate, setBudgetEndDate] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("category");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<FilterOption>("all");

  // Month selector state
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);

  // Transaction drill-down state
  const [selectedCategory, setSelectedCategory] = useState<BudgetPlanCategoryReport | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Generate list of months within the budget period
  const monthOptions = useMemo((): MonthOption[] => {
    if (!budgetStartDate || !budgetEndDate) return [];

    const start = new Date(budgetStartDate);
    const end = new Date(budgetEndDate);
    const months: MonthOption[] = [];

    // Add "Full Period" option first
    months.push({
      year: 0,
      month: 0,
      label: "Full Period",
      startDate: budgetStartDate,
      endDate: budgetEndDate,
    });

    // Generate individual months
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      // Clamp to budget period
      const effectiveStart = monthStart < start ? start : monthStart;
      const effectiveEnd = monthEnd > end ? end : monthEnd;

      months.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        label: `${MONTH_NAMES[current.getMonth()]} ${current.getFullYear()}`,
        startDate: effectiveStart.toISOString().split("T")[0],
        endDate: effectiveEnd.toISOString().split("T")[0],
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }, [budgetStartDate, budgetEndDate]);

  // Show month selector only if budget spans more than 1 month
  const showMonthSelector = monthOptions.length > 2;

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    if (monthOptions.length > 0 && selectedMonthIndex < monthOptions.length) {
      fetchReport(monthOptions[selectedMonthIndex]);
    }
  }, [selectedMonthIndex, monthOptions]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // First fetch the budget plan to get date range
      const planResponse = await apiClient.fetch(`${api.budgetPlans}/${id}`);
      if (!planResponse.ok) throw new Error("Failed to fetch budget plan");
      const plan = await planResponse.json();

      setBudgetStartDate(plan.startDate.split("T")[0]);
      setBudgetEndDate(plan.endDate.split("T")[0]);

      // Set initial month to current month if within range, otherwise first month
      const now = new Date();
      const start = new Date(plan.startDate);
      const end = new Date(plan.endDate);

      if (now >= start && now <= end) {
        // Find the index of current month
        const months = [];
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        let index = 1; // Start at 1 because index 0 is "Full Period"
        while (current <= end) {
          if (current.getFullYear() === now.getFullYear() && current.getMonth() === now.getMonth()) {
            setSelectedMonthIndex(index);
            break;
          }
          current.setMonth(current.getMonth() + 1);
          index++;
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchReport = async (month?: MonthOption) => {
    setLoading(true);
    try {
      let url = `${api.budgetPlans}/${id}/report`;
      if (month && month.year !== 0) {
        url += `?startDate=${month.startDate}&endDate=${month.endDate}`;
      }

      const response = await apiClient.fetch(url);
      if (!response.ok) throw new Error("Failed to fetch report");
      const data: BudgetPlanReportType = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryTransactions = async (category: BudgetPlanCategoryReport) => {
    setSelectedCategory(category);
    setLoadingTransactions(true);
    try {
      const month = monthOptions[selectedMonthIndex];
      let url = `${api.budgetPlans}/${id}/categories/${category.categoryId}/transactions`;
      if (month && month.year !== 0) {
        url += `?startDate=${month.startDate}&endDate=${month.endDate}`;
      }

      const response = await apiClient.fetch(url);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data: Transaction[] = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonthIndex > 0) {
      setSelectedMonthIndex(selectedMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex < monthOptions.length - 1) {
      setSelectedMonthIndex(selectedMonthIndex + 1);
    }
  };

  const getSortedCategories = () => {
    if (!report) return { income: [], expense: [] };

    let categories = [...report.categoryReports];

    if (filter === "over") {
      categories = categories.filter((c) => c.percentageUsed >= 100);
    } else if (filter === "under") {
      categories = categories.filter((c) => c.percentageUsed < 100);
    }

    const sortFn = (a: BudgetPlanCategoryReport, b: BudgetPlanCategoryReport) => {
      let comparison = 0;
      switch (sortColumn) {
        case "category":
          comparison = a.categoryName.localeCompare(b.categoryName);
          break;
        case "budgeted":
          comparison = a.budgetAmount - b.budgetAmount;
          break;
        case "spent":
          comparison = a.spentAmount - b.spentAmount;
          break;
        case "remaining":
          comparison = a.remainingAmount - b.remainingAmount;
          break;
        case "percentage":
          comparison = a.percentageUsed - b.percentageUsed;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    };

    const incomeCategories = categories.filter((c) => c.categoryType === 1).sort(sortFn);
    const expenseCategories = categories.filter((c) => c.categoryType !== 1).sort(sortFn);

    return { income: incomeCategories, expense: expenseCategories };
  };

  const getIncomeTotals = (categories: BudgetPlanCategoryReport[]) => ({
    budgeted: categories.reduce((sum, c) => sum + c.budgetAmount, 0),
    spent: categories.reduce((sum, c) => sum + c.spentAmount, 0),
  });

  const getExpenseTotals = (categories: BudgetPlanCategoryReport[]) => ({
    budgeted: categories.reduce((sum, c) => sum + c.budgetAmount, 0),
    spent: categories.reduce((sum, c) => sum + c.spentAmount, 0),
  });

  const accountChartData = report?.accountSummaries
    .filter((a) => a.totalSpent > 0)
    .map((a) => ({
      name: a.accountName,
      value: a.totalSpent,
    })) || [];

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load report. Please try again.</p>
        <Button className="mt-4" onClick={() => navigate("/budget-plans")}>
          Back to Budget Plans
        </Button>
      </div>
    );
  }

  const { income: incomeCategories, expense: expenseCategories } = getSortedCategories();
  const incomeTotals = getIncomeTotals(incomeCategories);
  const expenseTotals = getExpenseTotals(expenseCategories);
  const currentMonth = monthOptions[selectedMonthIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/budget-plans")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{report.budgetPlanName}</h2>
            <p className="text-muted-foreground">
              {formatDate(report.startDate)} - {formatDate(report.endDate)}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/budget-plans/${id}/edit`)}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Budget
        </Button>
      </div>

      {/* Month Selector */}
      {showMonthSelector && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousMonth}
                disabled={selectedMonthIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 min-w-48 justify-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedMonthIndex.toString()}
                  onValueChange={(value) => setSelectedMonthIndex(parseInt(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                disabled={selectedMonthIndex === monthOptions.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Budgeted</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(report.totalBudgeted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Total Spent</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(report.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Income</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(report.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className={`h-5 w-5 ${report.netDifference >= 0 ? "text-green-500" : "text-red-500"}`} />
              <span className="text-sm text-muted-foreground">Remaining</span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${report.netDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(report.netDifference)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Category Breakdown</CardTitle>
          <Select value={filter} onValueChange={(value: FilterOption) => setFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="over">Over Budget</SelectItem>
              <SelectItem value="under">Under Budget</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center gap-1">
                    Category
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort("budgeted")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Budgeted
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort("spent")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Spent
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort("remaining")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Remaining
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground w-48"
                  onClick={() => handleSort("percentage")}
                >
                  <div className="flex items-center gap-1">
                    Progress
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Income Categories Section */}
              {incomeCategories.length > 0 && (
                <>
                  <TableRow className="bg-green-50 hover:bg-green-50 dark:bg-green-950/30">
                    <TableCell colSpan={2} className="font-semibold text-green-700 dark:text-green-400">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Income Categories ({incomeCategories.length})
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">
                      {formatCurrency(incomeTotals.budgeted)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">
                      {formatCurrency(incomeTotals.spent)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  {incomeCategories.map((category) => (
                    <TableRow
                      key={category.categoryId}
                      className={`${getRowClass(category.percentageUsed)} cursor-pointer hover:bg-muted/50 border-l-4 border-l-green-400`}
                      onClick={() => fetchCategoryTransactions(category)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.categoryIcon || "📁"}</span>
                          <span className="font-medium">{category.categoryName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(category.budgetAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(category.spentAmount)}
                      </TableCell>
                      <TableCell className={`text-right ${category.remainingAmount < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(category.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(category.percentageUsed, 100)}
                            className={`flex-1 ${getProgressColor(category.percentageUsed)}`}
                          />
                          <span className="text-sm font-medium w-12 text-right">
                            {Math.round(category.percentageUsed)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {/* Expense Categories Section */}
              {expenseCategories.length > 0 && (
                <>
                  <TableRow className="bg-red-50 hover:bg-red-50 dark:bg-red-950/30">
                    <TableCell colSpan={2} className="font-semibold text-red-700 dark:text-red-400">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Expense Categories ({expenseCategories.length})
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-700 dark:text-red-400">
                      {formatCurrency(expenseTotals.budgeted)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-700 dark:text-red-400">
                      {formatCurrency(expenseTotals.spent)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  {expenseCategories.map((category) => (
                    <TableRow
                      key={category.categoryId}
                      className={`${getRowClass(category.percentageUsed)} cursor-pointer hover:bg-muted/50 border-l-4 border-l-red-400`}
                      onClick={() => fetchCategoryTransactions(category)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.categoryIcon || "📁"}</span>
                          <span className="font-medium">{category.categoryName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(category.budgetAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(category.spentAmount)}
                      </TableCell>
                      <TableCell className={`text-right ${category.remainingAmount < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(category.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(category.percentageUsed, 100)}
                            className={`flex-1 ${getProgressColor(category.percentageUsed)}`}
                          />
                          <span className="text-sm font-medium w-12 text-right">
                            {Math.round(category.percentageUsed)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {incomeCategories.length === 0 && expenseCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No categories match the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-2">
            Click on a category to view transactions
          </p>
        </CardContent>
      </Card>

      {/* Account Breakdown */}
      {report.accountSummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {accountChartData.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accountChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {accountChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="space-y-3">
                {report.accountSummaries.map((account, index) => (
                  <div
                    key={account.accountId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{account.accountName}</p>
                        <p className="text-sm text-muted-foreground">{account.institution}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        -{formatCurrency(account.totalSpent)}
                      </p>
                      {account.totalIncome > 0 && (
                        <p className="text-sm text-green-600">
                          +{formatCurrency(account.totalIncome)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Drill-Down Dialog */}
      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{selectedCategory?.categoryIcon || "📁"}</span>
              {selectedCategory?.categoryName} Transactions
              {currentMonth && currentMonth.year !== 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({currentMonth.label})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No transactions found for this category.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatShortDate(tx.transactionDate)}
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tx.accountName}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(Math.abs(tx.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          {selectedCategory && (
            <div className="border-t pt-4 mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              </span>
              <span className="font-medium">
                Total Spent: {formatCurrency(selectedCategory.spentAmount)}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetPlanReport;
