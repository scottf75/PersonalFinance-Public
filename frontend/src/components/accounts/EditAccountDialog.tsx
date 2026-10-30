import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";

interface Account {
  id: number;
  name: string;
  institution: string;
}

interface EditAccountFormValues {
  name: string;
  institution: string;
}

interface EditAccountDialogProps {
  account: Account;
  onAccountUpdated?: () => void;
}

const EditAccountDialog = ({ account, onAccountUpdated }: EditAccountDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditAccountFormValues>({
    defaultValues: {
      name: account.name,
      institution: account.institution,
    },
  });

  // Reset form when account changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: account.name,
        institution: account.institution,
      });
    }
  }, [open, account, form]);

  const onSubmit = async (data: EditAccountFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiClient.fetch(`${api.accounts}/${account.id}`, {
        method: "PUT",
        body: JSON.stringify({
          id: account.id,
          name: data.name,
          institution: data.institution,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update account");
      }

      toast.success(`Account "${data.name}" updated successfully!`);
      setOpen(false);
      onAccountUpdated?.();
    } catch (error) {
      toast.error(`Error updating account: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Edit account">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update the account name or institution.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Account name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Checking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="institution"
              rules={{ required: "Institution is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financial Institution</FormLabel>
                  <FormControl>
                    <Input placeholder="Bank of America" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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

export default EditAccountDialog;
