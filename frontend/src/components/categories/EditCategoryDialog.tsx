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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import EmojiPicker from "./EmojiPicker";

interface EditCategoryFormValues {
  name: string;
  description: string;
  icon: string;
  categoryType: string;
}

interface EditCategoryDialogProps {
  category: {
    id: number;
    name: string;
    description?: string;
    icon?: string;
    categoryType?: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated?: () => void;
}

const EditCategoryDialog = ({ 
  category, 
  open, 
  onOpenChange,
  onCategoryUpdated 
}: EditCategoryDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditCategoryFormValues>({
    defaultValues: {
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      categoryType: String(category.categoryType || 2),
    },
  });

  useEffect(() => {
    form.reset({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      categoryType: String(category.categoryType || 2),
    });
  }, [category, form]);

  const handleSubmit = async (data: EditCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiClient.fetch(`${api.categories}/${category.id}`, {
        method: "PUT",
        body: JSON.stringify({
          id: category.id,
          name: data.name,
          description: data.description,
          icon: data.icon || null,
          categoryType: parseInt(data.categoryType),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update category");
      }

      onOpenChange(false);
      
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Make changes to the category details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="flex gap-3 items-end">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <EmojiPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Category name is required" }}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Groceries, Entertainment"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description for this category"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Income</SelectItem>
                      <SelectItem value="2">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;