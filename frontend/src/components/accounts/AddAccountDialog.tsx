import { useState } from "react";
import { useForm } from "react-hook-form";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { PiggyBank, CreditCard, LineChart } from "lucide-react";
import { api } from "@/lib/config";

type AccountType = "bank" | "credit" | "investment";

interface AddAccountFormValues {
  name: string;
  institution: string;
  accountType: AccountType;
  balance: string;
  additionalInfo?: string;
}

const AddAccountDialog = () => {
  const [open, setOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("bank");
  
  const form = useForm<AddAccountFormValues>({
    defaultValues: {
      name: "",
      institution: "",
      accountType: "bank",
      balance: "",
      additionalInfo: ""
    }
  });

  const handleAccountTypeChange = (value: AccountType) => {
    setAccountType(value);
    form.setValue("accountType", value);
  };

  const onSubmit = (data: AddAccountFormValues) => {
    // Convert balance to number
    console.log("Submitting form data:", data);
    const numericBalance = parseFloat(data.balance);
    
    if (isNaN(numericBalance)) {
      toast.error("Please enter a valid balance amount.");
      return;
    }

    // Format for display and add to mock data (in a real app, this would be an API call)
   /* const newAccount = {
      id: `new-${Date.now()}`,
      name: data.name,
      institution: data.institution,
      balance: numericBalance,
      // Other properties would be added based on account type
    };*/

    
    // Add call to backend CreateAccount API would go here
    fetch(api.accounts, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        institution: data.institution,
        accountType: data.accountType === 'bank' ? 1 
           : data.accountType === 'credit' ? 2 
           : data.accountType === 'investment' ? 3 
           : data.accountType,
        balance: numericBalance,
        additionalInfo: data.additionalInfo
      })
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || "Failed to create account");
        }
        const result = await response.json();
        console.log("Account created successfully:", result);
        toast.success(`Account created: ${JSON.stringify(result)}`);
        return result;
      })
      .catch((error) => {
        console.log(error.message)
        toast.error(`Error adding account: ${error.message}`);
      });
    // end API call


    // Show success message
    toast.success(`${data.name} account added successfully!`);
    
    // Reset form and close dialog
    form.reset();
    setOpen(false);
    
    // In a real application, you would update the state or fetch updated data
    //console.log("New account added:", newAccount);
  };

  // Render different fields based on account type
  const renderAdditionalFields = () => {
    switch (accountType) {
      case "bank":
        return (
          <FormField
            control={form.control}
            name="additionalInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number (last 4 digits)</FormLabel>
                <FormControl>
                  <Input placeholder="1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "credit":
        return (
          <>
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit</FormLabel>
                  <FormControl>
                    <Input placeholder="5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "investment":
        return (
          <FormField
            control={form.control}
            name="additionalInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Investment Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select investment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="401k">401(k)</SelectItem>
                      <SelectItem value="ira">IRA</SelectItem>
                      <SelectItem value="brokerage">Brokerage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  const getAccountTypeIcon = () => {
    switch (accountType) {
      case "bank":
        return <PiggyBank className="h-5 w-5" />;
      case "credit":
        return <CreditCard className="h-5 w-5" />;
      case "investment":
        return <LineChart className="h-5 w-5" />;
      default:
        return <PiggyBank className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getAccountTypeIcon()}
            Add New Account
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new financial account.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={(value) => handleAccountTypeChange(value as AccountType)} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Bank Account</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
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

            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Balance</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderAdditionalFields()}

            <DialogFooter>
              <Button type="submit">Add Account</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountDialog;
