import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import type { BudgetSummaryItem } from "@/types/budget";

interface EditBudgetFormValues {
  budgetAmount: string;
}

interface EditBudgetDialogProps {
  item: BudgetSummaryItem | null;
  year: number;
  month: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBudgetUpdated?: () => void;
}

const EditBudgetDialog = ({
  item,
  year,
  month,
  open,
  onOpenChange,
  onBudgetUpdated,
}: EditBudgetDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditBudgetFormValues>({
    defaultValues: {
      budgetAmount: item?.budgetAmount.toString() || "0",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        budgetAmount: item.budgetAmount.toString(),
      });
    }
  }, [item, form]);

  const handleSubmit = async (data: EditBudgetFormValues) => {
    if (!item) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.fetch(api.budgets, {
        method: "POST",
        body: JSON.stringify({
          year,
          month,
          categoryId: item.categoryId,
          budgetAmount: parseFloat(data.budgetAmount) || 0,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update budget");
      }

      onOpenChange(false);

      if (onBudgetUpdated) {
        onBudgetUpdated();
      }
    } catch (error) {
      console.error("Error updating budget:", error);
      alert("Failed to update budget: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            <span className="mr-2">{item.categoryIcon || "📁"}</span>
            Edit Budget for {item.categoryName}
          </DialogTitle>
          <DialogDescription>
            Set the monthly budget amount for this category.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="budgetAmount"
              rules={{
                required: "Budget amount is required",
                validate: (value) => {
                  const num = parseFloat(value);
                  if (isNaN(num) || num < 0) {
                    return "Please enter a valid positive number";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-sm text-muted-foreground">
              <p>
                Current spending:{" "}
                <span className="font-medium">
                  ${item.spentAmount.toFixed(2)}
                </span>
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Budget"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBudgetDialog;
