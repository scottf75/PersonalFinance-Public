import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Save,
  Loader2,
  ListPlus,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import type { BudgetPlan, BudgetPlanCategory, BudgetPlanAccount } from "@/types/budgetPlan";

interface Category {
  id: number;
  name: string;
  icon?: string;
  isActive: boolean;
  categoryType?: number; // 1 = Income, 2 = Expense
}

interface Account {
  id: number;
  name: string;
  institution: string;
  accountType: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const AccountType: Record<number, string> = {
  1: "Bank",
  2: "Credit",
  3: "Investment",
};

const BudgetPlanEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [planCategories, setPlanCategories] = useState<BudgetPlanCategory[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<number>>(new Set());

  // Form state
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // New category row state
  const [newCategoryId, setNewCategoryId] = useState<string>("");
  const [newBudgetAmount, setNewBudgetAmount] = useState<string>("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>("");

  // Add all categories dialog state
  const [addAllDialogOpen, setAddAllDialogOpen] = useState(false);
  const [defaultBudgetAmount, setDefaultBudgetAmount] = useState<string>("0");

  // Track unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  // Set dirty flag when form values change (after initial load)
  useEffect(() => {
    if (initialDataLoaded) {
      setIsDirty(true);
    }
  }, [planName, planDescription, startDate, endDate, planCategories, selectedAccountIds]);

  // Warn about unsaved changes when closing browser/tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && initialDataLoaded) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, initialDataLoaded]);

  // Handle navigation with unsaved changes check
  const handleNavigate = (path: string) => {
    if (isDirty && initialDataLoaded) {
      pendingNavigationRef.current = path;
      setShowLeaveDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveDialog(false);
    if (pendingNavigationRef.current) {
      navigate(pendingNavigationRef.current);
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveDialog(false);
    pendingNavigationRef.current = null;
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories and accounts in parallel
      const [categoriesRes, accountsRes] = await Promise.all([
        apiClient.fetch(api.categories),
        apiClient.fetch(api.accounts),
      ]);

      if (!categoriesRes.ok || !accountsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const categoriesData: Category[] = await categoriesRes.json();
      const accountsData: Account[] = await accountsRes.json();

      setCategories(categoriesData.filter((c) => c.isActive));
      setAccounts(accountsData);

      // If editing, fetch the budget plan
      if (id) {
        const planRes = await apiClient.fetch(`${api.budgetPlans}/${id}`);
        if (!planRes.ok) {
          throw new Error("Failed to fetch budget plan");
        }
        const planData: BudgetPlan = await planRes.json();
        setPlan(planData);
        setPlanName(planData.name);
        setPlanDescription(planData.description || "");
        setStartDate(planData.startDate.split("T")[0]);
        setEndDate(planData.endDate.split("T")[0]);
        setPlanCategories(planData.categories || []);
        setSelectedAccountIds(
          new Set(planData.accounts?.map((a) => a.accountId) || [])
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      // Mark initial data as loaded after a short delay to prevent immediate dirty flag
      setTimeout(() => setInitialDataLoaded(true), 100);
    }
  };

  const handleSavePlan = async () => {
    if (!planName || !startDate || !endDate) return;

    setSaving(true);
    try {
      const planData = {
        name: planName,
        description: planDescription,
        startDate,
        endDate,
      };

      let savedPlanId = id;

      if (isNew) {
        const response = await apiClient.fetch(api.budgetPlans, {
          method: "POST",
          body: JSON.stringify(planData),
        });
        if (!response.ok) throw new Error("Failed to create budget plan");
        const newPlan = await response.json();
        savedPlanId = newPlan.id.toString();
      } else {
        const response = await apiClient.fetch(`${api.budgetPlans}/${id}`, {
          method: "PUT",
          body: JSON.stringify(planData),
        });
        if (!response.ok) throw new Error("Failed to update budget plan");
      }

      // Save categories (batch update)
      if (savedPlanId) {
        const categoriesResponse = await apiClient.fetch(
          `${api.budgetPlans}/${savedPlanId}/categories/batch`,
          {
            method: "POST",
            body: JSON.stringify(planCategories),
          }
        );
        if (!categoriesResponse.ok) throw new Error("Failed to save categories");

        // Save accounts
        const accountsResponse = await apiClient.fetch(
          `${api.budgetPlans}/${savedPlanId}/accounts`,
          {
            method: "POST",
            body: JSON.stringify({ accountIds: Array.from(selectedAccountIds) }),
          }
        );
        if (!accountsResponse.ok) throw new Error("Failed to save accounts");
      }

      setIsDirty(false); // Reset dirty flag before navigating
      navigate("/budget-plans");
    } catch (error) {
      console.error("Error saving budget plan:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryId || !newBudgetAmount) return;

    const categoryId = parseInt(newCategoryId);
    const amount = parseFloat(newBudgetAmount);

    if (isNaN(categoryId) || isNaN(amount) || amount < 0) return;

    // Check if category already exists
    if (planCategories.some((c) => c.categoryId === categoryId)) {
      return;
    }

    const category = categories.find((c) => c.id === categoryId);
    const newCategory: BudgetPlanCategory = {
      id: 0, // Will be set by backend
      budgetPlanId: id ? parseInt(id) : 0,
      categoryId,
      budgetAmount: amount,
      categoryName: category?.name,
      categoryIcon: category?.icon,
      categoryType: category?.categoryType || 2,
    };

    setPlanCategories([...planCategories, newCategory]);
    setNewCategoryId("");
    setNewBudgetAmount("");
  };

  const handleEditCategory = (categoryId: number) => {
    const category = planCategories.find((c) => c.categoryId === categoryId);
    if (category) {
      setEditingCategoryId(categoryId);
      setEditingAmount(category.budgetAmount.toString());
    }
  };

  const handleSaveEdit = (categoryId: number) => {
    const amount = parseFloat(editingAmount);
    if (isNaN(amount) || amount < 0) return;

    setPlanCategories(
      planCategories.map((c) =>
        c.categoryId === categoryId ? { ...c, budgetAmount: amount } : c
      )
    );
    setEditingCategoryId(null);
    setEditingAmount("");
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingAmount("");
  };

  const handleDeleteCategory = (categoryId: number) => {
    setPlanCategories(planCategories.filter((c) => c.categoryId !== categoryId));
  };

  const handleAddAllCategories = () => {
    const amount = parseFloat(defaultBudgetAmount) || 0;

    // Get all categories not already in the plan
    const newCategories = availableCategories.map((category) => ({
      id: 0,
      budgetPlanId: id ? parseInt(id) : 0,
      categoryId: category.id,
      budgetAmount: amount,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryType: category.categoryType || 2,
    }));

    setPlanCategories([...planCategories, ...newCategories]);
    setAddAllDialogOpen(false);
    setDefaultBudgetAmount("0");
  };

  const handleClearAllCategories = () => {
    setPlanCategories([]);
  };

  const toggleAccount = (accountId: number) => {
    const newSelected = new Set(selectedAccountIds);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccountIds(newSelected);
  };

  const selectAllAccounts = () => {
    setSelectedAccountIds(new Set(accounts.map((a) => a.id)));
  };

  const deselectAllAccounts = () => {
    setSelectedAccountIds(new Set());
  };

  // Get categories not yet added to plan
  const availableCategories = categories.filter(
    (c) => !planCategories.some((pc) => pc.categoryId === c.id)
  );

  const totalBudgeted = planCategories.reduce((sum, c) => sum + c.budgetAmount, 0);

  // Group plan categories by type
  const incomeCategories = planCategories.filter((c) => c.categoryType === 1);
  const expenseCategories = planCategories.filter((c) => c.categoryType !== 1);

  const incomeBudgeted = incomeCategories.reduce((sum, c) => sum + c.budgetAmount, 0);
  const expenseBudgeted = expenseCategories.reduce((sum, c) => sum + c.budgetAmount, 0);

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.accountType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<number, Account[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => handleNavigate("/budget-plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">
          {isNew ? "Create Budget Plan" : "Edit Budget Plan"}
        </h2>
      </div>

      {/* Budget Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Budget Name</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Budget - May 2025"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Budget Categories</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddAllDialogOpen(true)}
                disabled={availableCategories.length === 0}
              >
                <ListPlus className="h-4 w-4 mr-1" />
                Add All
              </Button>
              {planCategories.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllCategories}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatCurrency(totalBudgeted)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-40">Budget Amount</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* New category row */}
              <TableRow className="bg-muted/50">
                <TableCell>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCategory();
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={!newCategoryId || !newBudgetAmount}
                  >
                    Add
                  </Button>
                </TableCell>
              </TableRow>

              {/* Income Categories Section */}
              {incomeCategories.length > 0 && (
                <>
                  <TableRow className="bg-green-50 hover:bg-green-50">
                    <TableCell colSpan={3} className="font-semibold text-green-700">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Income Categories ({incomeCategories.length})
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {formatCurrency(incomeBudgeted)}
                    </TableCell>
                  </TableRow>
                  {incomeCategories.map((category) => (
                    <TableRow key={category.categoryId} className="border-l-4 border-l-green-400">
                      <TableCell>
                        <span className="text-lg">{category.categoryIcon || "📁"}</span>
                      </TableCell>
                      <TableCell className="font-medium">{category.categoryName}</TableCell>
                      <TableCell>
                        {editingCategoryId === category.categoryId ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(category.categoryId);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            autoFocus
                          />
                        ) : (
                          formatCurrency(category.budgetAmount)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCategoryId === category.categoryId ? (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveEdit(category.categoryId)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditCategory(category.categoryId)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category.categoryId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {/* Expense Categories Section */}
              {expenseCategories.length > 0 && (
                <>
                  <TableRow className="bg-red-50 hover:bg-red-50">
                    <TableCell colSpan={3} className="font-semibold text-red-700">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Expense Categories ({expenseCategories.length})
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-700">
                      {formatCurrency(expenseBudgeted)}
                    </TableCell>
                  </TableRow>
                  {expenseCategories.map((category) => (
                    <TableRow key={category.categoryId} className="border-l-4 border-l-red-400">
                      <TableCell>
                        <span className="text-lg">{category.categoryIcon || "📁"}</span>
                      </TableCell>
                      <TableCell className="font-medium">{category.categoryName}</TableCell>
                      <TableCell>
                        {editingCategoryId === category.categoryId ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(category.categoryId);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            autoFocus
                          />
                        ) : (
                          formatCurrency(category.budgetAmount)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCategoryId === category.categoryId ? (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveEdit(category.categoryId)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditCategory(category.categoryId)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category.categoryId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {planCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No categories added yet. Select a category and enter a budget amount above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Account Selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Accounts to Include in Budget Report</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllAccounts}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllAccounts}>
              Deselect All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Select which accounts should be included when calculating budget vs. actual spending.
            If no accounts are selected, all accounts will be included by default.
          </p>
          <div className="space-y-4">
            {Object.entries(accountsByType).map(([type, typeAccounts]) => (
              <div key={type}>
                <h4 className="text-sm font-medium mb-2">
                  {AccountType[parseInt(type)] || "Other"} Accounts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {typeAccounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedAccountIds.has(account.id)}
                        onCheckedChange={() => toggleAccount(account.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {account.institution}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => handleNavigate("/budget-plans")}>
          Cancel
        </Button>
        <Button
          onClick={handleSavePlan}
          disabled={saving || !planName || !startDate || !endDate}
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Budget Plan
        </Button>
      </div>

      {/* Add All Categories Dialog */}
      <Dialog open={addAllDialogOpen} onOpenChange={setAddAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add All Categories</DialogTitle>
            <DialogDescription>
              Add all {availableCategories.length} remaining categories to this budget plan.
              You can set a default budget amount for each category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="defaultAmount">Default Budget Amount (per category)</Label>
              <Input
                id="defaultAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={defaultBudgetAmount}
                onChange={(e) => setDefaultBudgetAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can edit individual amounts after adding.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Categories to add:
              <div className="mt-2 max-h-40 overflow-auto space-y-1">
                {availableCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <span>{cat.icon || "📁"}</span>
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAllCategories}>
              <ListPlus className="h-4 w-4 mr-2" />
              Add {availableCategories.length} Categories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page?
              Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BudgetPlanEditor;
