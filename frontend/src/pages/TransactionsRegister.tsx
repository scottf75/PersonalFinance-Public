import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Edit2, Trash2, Check, X, Search, ArrowUpDown, Sparkles, Loader2, Wand2 } from "lucide-react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import { useCategorySuggestion } from "@/hooks/use-category-suggestion";
import { useSmartSearch, SearchFilters } from "@/hooks/use-smart-search";

interface Transaction {
  id: number;
  transactionDate: string;
  description: string;
  categoryID?: number;  // The API might return categoryID
  categoryId?: number;  // Or categoryId
  categoryName?: string;
  amount: number;
  balance?: number;
  accountID?: number;  // The API might return accountID
  accountId?: number;  // Or accountId
  checkNumber?: string;
}

interface Account {
  id: number;
  name: string;
  balance: number;
  institution: string;
}

// Special category ID for transfers (not from database)
const TRANSFER_CATEGORY_ID = "transfer";

const TransactionsRegister: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    categoryId: "",
    checkNumber: "",
    payment: "",
    deposit: "",
    transferToAccountId: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<"date" | "description" | "category" | "amount" | null>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [useAiSearch, setUseAiSearch] = useState(false);
  const [aiFilteredTransactions, setAiFilteredTransactions] = useState<Transaction[] | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // AI category suggestion
  const { suggestion, isLoading: suggestionLoading } = useCategorySuggestion(newTransaction.description);
  const lastAppliedSuggestion = useRef<string | null>(null);

  // AI smart search
  const { parseResult, isLoading: smartSearchLoading } = useSmartSearch(
    searchTerm,
    useAiSearch,
    accountId ? parseInt(accountId) : undefined
  );

  // Fetch filtered transactions when AI parses the query
  useEffect(() => {
    if (!useAiSearch || !parseResult) {
      setAiFilteredTransactions(null);
      setAiExplanation(null);
      return;
    }

    const fetchFilteredTransactions = async () => {
      try {
        const params = new URLSearchParams();
        const filters = parseResult.filters;

        if (accountId) params.append("accountId", accountId);
        if (filters.keywords) params.append("keywords", filters.keywords);
        if (filters.categoryIds) {
          filters.categoryIds.forEach(id => params.append("categoryIds", id.toString()));
        }
        if (filters.minAmount) params.append("minAmount", filters.minAmount.toString());
        if (filters.maxAmount) params.append("maxAmount", filters.maxAmount.toString());
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);

        const response = await apiClient.fetch(`${api.transactions}/filter?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch filtered transactions");

        const data = await response.json();

        // Calculate running balance for filtered results
        const sortedData = [...data].sort((a: Transaction, b: Transaction) =>
          new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
        );

        let runningBalance = 0;
        const transactionsWithBalance = sortedData.map((tx: Transaction) => {
          runningBalance += tx.amount;
          return { ...tx, balance: runningBalance };
        });

        transactionsWithBalance.reverse();
        setAiFilteredTransactions(transactionsWithBalance);
        setAiExplanation(parseResult.explanation);
      } catch (error) {
        console.error("Error fetching filtered transactions:", error);
        setAiFilteredTransactions(null);
        setAiExplanation(null);
      }
    };

    fetchFilteredTransactions();
  }, [parseResult, useAiSearch, accountId]);

  // Auto-fill category when AI suggestion has high confidence
  useEffect(() => {
    if (
      suggestion?.suggestedCategoryId &&
      suggestion.confidence >= 0.8 &&
      !newTransaction.categoryId &&
      newTransaction.description.length >= 3 &&
      lastAppliedSuggestion.current !== newTransaction.description
    ) {
      setNewTransaction(prev => ({
        ...prev,
        categoryId: suggestion.suggestedCategoryId!.toString()
      }));
      lastAppliedSuggestion.current = newTransaction.description;
    }
  }, [suggestion, newTransaction.description, newTransaction.categoryId]);

  useEffect(() => {
    if (accountId) {
      fetchAccountDetails();
      fetchCategories();
      fetchAllAccounts();
    }
  }, [accountId]);

  useEffect(() => {
    if (account) {
      fetchTransactions();
    }
  }, [account]);

  const fetchAccountDetails = async () => {
    try {
      const response = await apiClient.fetch(`${api.accounts}/${accountId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch account details");
      }

      const data = await response.json();
      setAccount(data);
    } catch (error) {
      console.error("Error fetching account:", error);
      // Fallback sample data
      setAccount({
        id: parseInt(accountId!),
        name: "Sample Account",
        balance: 5000.00,
        institution: "Sample Bank"
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.fetch(api.categories);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback categories
      setCategories([
        { id: 1, name: "Groceries" },
        { id: 2, name: "Income" },
        { id: 3, name: "Utilities" },
        { id: 4, name: "Entertainment" },
        { id: 5, name: "Transportation" },
      ]);
    }
  };

  const fetchAllAccounts = async () => {
    try {
      const response = await apiClient.fetch(api.accounts);

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      setAllAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAllAccounts([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const url = `${api.transactions}?accountId=${accountId}`;
      const response = await apiClient.fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      
      // Log the first transaction to see the exact property names
      if (data.length > 0) {
        console.log("First transaction from API:", data[0]);
        console.log("CategoryID value:", data[0].categoryID);
        console.log("categoryId value:", data[0].categoryId);
      }
      
      // Sort transactions by date (oldest first) to calculate running balance
      const sortedData = data.sort((a: Transaction, b: Transaction) => 
        new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
      );
      
      // Calculate running balance starting from 0 and adding each transaction
      let runningBalance = 0;
      const transactionsWithBalance = sortedData.map((tx: Transaction) => {
        runningBalance += tx.amount;
        return { ...tx, balance: runningBalance };
      });
      
      // Sort by date descending (newest first) for display
      transactionsWithBalance.reverse();
      
      setTransactions(transactionsWithBalance);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Sample data with proper amounts (negative for payments, positive for deposits)
      const sampleData = [
        {
          id: 1,
          transactionDate: "2025-01-05",
          description: "Opening Balance",
          categoryId: 0,
          categoryName: "Opening",
          amount: 3000.00,  // Deposit
          accountId: parseInt(accountId!)
        },
        {
          id: 2,
          transactionDate: "2025-01-07",
          description: "Direct Deposit - Salary",
          categoryId: 2,
          categoryName: "Income",
          amount: 2500.00,  // Deposit
          accountId: parseInt(accountId!)
        },
        {
          id: 3,
          transactionDate: "2025-01-08",
          description: "Walmart Groceries",
          categoryId: 1,
          categoryName: "Groceries",
          amount: -125.50,  // Payment
          accountId: parseInt(accountId!)
        },
        {
          id: 4,
          transactionDate: "2025-01-09",
          description: "Electric Bill",
          categoryId: 3,
          categoryName: "Utilities",
          amount: -95.00,  // Payment
          accountId: parseInt(accountId!)
        }
      ];

      // Calculate running balance for sample data
      let runningBalance = 0;
      const sampleWithBalance = sampleData.map((tx) => {
        runningBalance += tx.amount;
        return { ...tx, balance: runningBalance };
      });

      // Reverse to show newest first
      sampleWithBalance.reverse();
      
      setTransactions(sampleWithBalance);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });
  };

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absAmount);
    return formatted;
  };

  const formatBalance = (balance: number) => {
    const absAmount = Math.abs(balance);
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absAmount);
    
    if (balance < 0) {
      return `(${formatted})`;
    }
    return formatted;
  };

  const handleEdit = (transaction: Transaction) => {
    console.log("Editing transaction:", transaction);
    // Check for both categoryID and categoryId
    const categoryIdValue = transaction.categoryID || transaction.categoryId;
    console.log("Category ID value:", categoryIdValue);
    
    setEditingId(transaction.id);
    setEditingTransaction({
      id: transaction.id,
      date: transaction.transactionDate ? transaction.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      description: transaction.description || '',
      categoryId: categoryIdValue ? categoryIdValue.toString() : '1',
      amount: transaction.amount ? Math.abs(transaction.amount).toString() : '0',
      isPayment: transaction.amount ? transaction.amount < 0 : false,
      checkNumber: transaction.checkNumber || ''
    });
  };

  const handleSave = async () => {
    try {
      if (!editingTransaction) return;

      const amount = editingTransaction.isPayment 
        ? -Math.abs(parseFloat(editingTransaction.amount))
        : Math.abs(parseFloat(editingTransaction.amount));

      // Parse categoryId to ensure it's a number
      const parsedCategoryId = parseInt(editingTransaction.categoryId);
      if (isNaN(parsedCategoryId)) {
        alert("Please select a valid category");
        return;
      }

      const transactionData = {
        id: editingTransaction.id,
        accountId: parseInt(accountId!),
        categoryId: parsedCategoryId,
        description: editingTransaction.description,
        amount: amount,
        transactionDate: `${editingTransaction.date}T12:00:00`,
        checkNumber: editingTransaction.checkNumber || null,
      };

      console.log("Updating transaction with ID:", editingTransaction.id);
      console.log("Transaction data being sent:", transactionData);
      console.log("JSON stringified:", JSON.stringify(transactionData));

      const response = await apiClient.fetch(`${api.transactions}/${editingTransaction.id}`, {
        method: "PUT",
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update failed with status:", response.status);
        console.error("Error response:", errorText);
        console.error("Request data was:", transactionData);
        throw new Error(`Failed to update transaction: ${errorText}`);
      }

      setEditingId(null);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction: " + error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingTransaction(null);
  };

  const handleDelete = async (transactionId: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const response = await apiClient.fetch(`${api.transactions}/${transactionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction: " + error);
    }
  };

  const handleAddTransaction = async () => {
    try {
      // Debug log the form state
      console.log("Form state before validation:", newTransaction);
      console.log("Account ID from params:", accountId);

      // Validate inputs
      if (!newTransaction.description.trim()) {
        alert("Please enter a description");
        return;
      }

      if (!newTransaction.categoryId) {
        alert("Please select a category");
        return;
      }

      // Check if this is a transfer
      const isTransfer = newTransaction.categoryId === TRANSFER_CATEGORY_ID;

      if (isTransfer) {
        // Validate transfer-specific fields
        if (!newTransaction.transferToAccountId) {
          alert("Please select a destination account for the transfer");
          return;
        }

        if (!newTransaction.payment && !newTransaction.deposit) {
          alert("Please enter a transfer amount in either Payment or Deposit");
          return;
        }

        // For transfers, find or use a default category
        // Look for a category named "Transfer" first, otherwise use the first category
        const transferCategory = categories.find(c => c.name.toLowerCase() === "transfer") || categories[0];
        if (!transferCategory) {
          alert("No categories available. Please create a category first.");
          return;
        }

        const parsedSourceAccountId = parseInt(accountId!);
        const parsedDestAccountId = parseInt(newTransaction.transferToAccountId);
        const destAccount = allAccounts.find(a => a.id === parsedDestAccountId);
        const sourceAccount = account;

        // Calculate the transfer amount
        const transferAmount = newTransaction.payment
          ? Math.abs(parseFloat(newTransaction.payment))
          : Math.abs(parseFloat(newTransaction.deposit));

        // Determine if this is an outgoing or incoming transfer based on which field was filled
        const isOutgoing = !!newTransaction.payment;

        // Create the withdrawal transaction (from source account)
        const withdrawalData = {
          accountId: isOutgoing ? parsedSourceAccountId : parsedDestAccountId,
          categoryId: transferCategory.id,
          description: `Transfer to ${isOutgoing ? destAccount?.name : sourceAccount?.name}: ${newTransaction.description}`,
          amount: -transferAmount,
          transactionDate: `${newTransaction.date}T12:00:00`,
        };

        // Create the deposit transaction (to destination account)
        const depositData = {
          accountId: isOutgoing ? parsedDestAccountId : parsedSourceAccountId,
          categoryId: transferCategory.id,
          description: `Transfer from ${isOutgoing ? sourceAccount?.name : destAccount?.name}: ${newTransaction.description}`,
          amount: transferAmount,
          transactionDate: `${newTransaction.date}T12:00:00`,
        };

        console.log("Creating transfer - Withdrawal:", withdrawalData);
        console.log("Creating transfer - Deposit:", depositData);

        // Create both transactions
        const [withdrawalResponse, depositResponse] = await Promise.all([
          apiClient.fetch(api.transactions, {
            method: "POST",
            body: JSON.stringify(withdrawalData)
          }),
          apiClient.fetch(api.transactions, {
            method: "POST",
            body: JSON.stringify(depositData)
          })
        ]);

        if (!withdrawalResponse.ok || !depositResponse.ok) {
          throw new Error("Failed to create transfer transactions");
        }

      } else {
        // Regular transaction (not a transfer)
        if (!newTransaction.payment && !newTransaction.deposit) {
          alert("Please enter either a payment or deposit amount");
          return;
        }

        if (newTransaction.payment && newTransaction.deposit) {
          alert("Please enter either a payment or deposit, not both");
          return;
        }

        // Calculate the amount (negative for payments, positive for deposits)
        const amount = newTransaction.payment
          ? -Math.abs(parseFloat(newTransaction.payment))
          : Math.abs(parseFloat(newTransaction.deposit));

        // Parse the IDs and check for NaN
        const parsedAccountId = parseInt(accountId!);
        const parsedCategoryId = parseInt(newTransaction.categoryId);

        console.log("Parsed Account ID:", parsedAccountId, "Is NaN?", isNaN(parsedAccountId));
        console.log("Parsed Category ID:", parsedCategoryId, "Is NaN?", isNaN(parsedCategoryId));

        if (isNaN(parsedAccountId)) {
          alert("Invalid account ID");
          return;
        }

        if (isNaN(parsedCategoryId)) {
          alert("Invalid category ID");
          return;
        }

        const transactionData = {
          accountId: parsedAccountId,
          categoryId: parsedCategoryId,
          description: newTransaction.description,
          amount: amount,
          transactionDate: `${newTransaction.date}T12:00:00`,
          checkNumber: newTransaction.checkNumber || null,
        };

        console.log("Sending transaction data:", transactionData);
        console.log("JSON being sent:", JSON.stringify(transactionData));

        const response = await apiClient.fetch(api.transactions, {
          method: "POST",
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("Server error response:", error);
          console.error("Response status:", response.status);
          throw new Error(error || "Failed to create transaction");
        }
      }

      // Reset form
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        description: "",
        categoryId: "",
        checkNumber: "",
        payment: "",
        deposit: "",
        transferToAccountId: "",
      });
      lastAppliedSuggestion.current = null;

      // Refresh transactions
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction: " + error);
    }
  };

  // Handle column header click for sorting
  const handleSort = (column: "date" | "description" | "category" | "amount") => {
    if (sortColumn === column) {
      // If clicking the same column, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a different column, set it as the sort column with desc direction
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Filter and sort transactions
  // Use AI-filtered results if available, otherwise use client-side filtering
  const baseTransactions = (useAiSearch && aiFilteredTransactions) ? aiFilteredTransactions : transactions;

  const filteredAndSortedTransactions = baseTransactions
    .filter(transaction => {
      // Skip client-side filtering if using AI search (already filtered server-side)
      if (useAiSearch && aiFilteredTransactions) return true;
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.categoryName?.toLowerCase().includes(searchLower) ||
        transaction.amount?.toString().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case "date":
          comparison = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
          break;
        case "description":
          comparison = (a.description || "").localeCompare(b.description || "");
          break;
        case "category":
          comparison = (a.categoryName || "").localeCompare(b.categoryName || "");
          break;
        case "amount":
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        default:
          return 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/accounts')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Accounts
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {account?.name || "Loading..."} Register
          </h2>
          <p className="text-sm text-muted-foreground">
            {account?.institution} • Current Balance: 
            <span className={transactions.length > 0 && transactions[0].balance < 0 ? "text-red-600 font-semibold ml-1" : "ml-1"}>
              ${formatBalance(transactions.length > 0 ? transactions[0].balance || 0 : 0)}
            </span>
          </p>
        </div>
      </div>

      {/* Search Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={useAiSearch ? "Try: 'groceries over $50 last month'" : "Search transactions..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {smartSearchLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          variant={useAiSearch ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setUseAiSearch(!useAiSearch);
            if (useAiSearch) {
              setAiFilteredTransactions(null);
              setAiExplanation(null);
            }
          }}
          className="gap-2"
          title={useAiSearch ? "AI Search enabled - use natural language" : "Enable AI Search"}
        >
          <Wand2 className="h-4 w-4" />
          {useAiSearch ? "AI On" : "AI"}
        </Button>
      </div>

      {/* AI Search Explanation */}
      {useAiSearch && aiExplanation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>{aiExplanation}</span>
          <span className="text-xs">({filteredAndSortedTransactions.length} results)</span>
        </div>
      )}

      {/* Register Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead 
                className="w-[100px] cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Date
                  {sortColumn === "date" && (
                    <ArrowUpDown className={`h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[80px]">Num</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort("description")}
              >
                <div className="flex items-center gap-1">
                  Description
                  {sortColumn === "description" && (
                    <ArrowUpDown className={`h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="w-[150px] cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center gap-1">
                  Category
                  {sortColumn === "category" && (
                    <ArrowUpDown className={`h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="w-[100px] text-right cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end gap-1">
                  Payment
                  {sortColumn === "amount" && (
                    <ArrowUpDown className={`h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="w-[100px] text-right cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end gap-1">
                  Deposit
                  {sortColumn === "amount" && (
                    <ArrowUpDown className={`h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[120px] text-right">Balance</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* New transaction row */}
            <TableRow className="bg-primary/5">
              <TableCell>
                <Input 
                  type="date" 
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="h-8 text-xs"
                />
              </TableCell>
              <TableCell>
                <Input 
                  placeholder="Check #"
                  value={newTransaction.checkNumber}
                  onChange={(e) => setNewTransaction({...newTransaction, checkNumber: e.target.value})}
                  className="h-8 text-xs"
                />
              </TableCell>
              <TableCell>
                <Input 
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="h-8 text-xs"
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <Select
                      value={newTransaction.categoryId}
                      onValueChange={(value) => {
                        setNewTransaction({
                          ...newTransaction,
                          categoryId: value,
                          transferToAccountId: value === TRANSFER_CATEGORY_ID ? newTransaction.transferToAccountId : ""
                        });
                        lastAppliedSuggestion.current = null;
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TRANSFER_CATEGORY_ID} className="font-medium text-blue-600">
                          Transfer
                        </SelectItem>
                        <div className="my-1 border-t border-gray-200" />
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {suggestionLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!suggestionLoading && suggestion && suggestion.confidence >= 0.5 && (
                      <div
                        className="cursor-pointer"
                        title={`AI suggests: ${suggestion.suggestedCategoryName} (${Math.round(suggestion.confidence * 100)}% confident)\n${suggestion.reasoning || ''}`}
                        onClick={() => {
                          if (suggestion.suggestedCategoryId) {
                            setNewTransaction(prev => ({
                              ...prev,
                              categoryId: suggestion.suggestedCategoryId!.toString()
                            }));
                          }
                        }}
                      >
                        <Sparkles className="h-4 w-4 text-amber-500" />
                      </div>
                    )}
                  </div>
                  {newTransaction.categoryId === TRANSFER_CATEGORY_ID && (
                    <Select
                      value={newTransaction.transferToAccountId}
                      onValueChange={(value) => setNewTransaction({...newTransaction, transferToAccountId: value})}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Transfer to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allAccounts
                          .filter(acc => acc.id.toString() !== accountId)
                          .map((acc) => (
                            <SelectItem key={acc.id} value={acc.id.toString()}>
                              {acc.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={newTransaction.payment}
                  onChange={(e) => setNewTransaction({...newTransaction, payment: e.target.value})}
                  className="h-8 text-xs text-right"
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={newTransaction.deposit}
                  onChange={(e) => setNewTransaction({...newTransaction, deposit: e.target.value})}
                  className="h-8 text-xs text-right"
                />
              </TableCell>
              <TableCell className={`text-right font-medium ${
                transactions.length > 0 && transactions[0].balance < 0 ? "text-red-600" : ""
              }`}>
                ${formatBalance(
                  transactions.length > 0 ? transactions[0].balance || 0 : 0
                )}
              </TableCell>
              <TableCell>
                <Button 
                  size="sm" 
                  variant="default" 
                  className="h-7 px-2"
                  onClick={handleAddTransaction}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>

            {/* Existing transactions */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : filteredAndSortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {searchTerm ? 
                    `No transactions found matching "${searchTerm}"` : 
                    "No transactions found. Add your first transaction above."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs">
                    {editingId === transaction.id && editingTransaction ? (
                      <Input 
                        type="date" 
                        value={editingTransaction.date || ''}
                        onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                        className="h-7 text-xs"
                      />
                    ) : (
                      formatDate(transaction.transactionDate)
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {editingId === transaction.id && editingTransaction ? (
                      <Input
                        value={editingTransaction.checkNumber || ''}
                        onChange={(e) => setEditingTransaction({...editingTransaction, checkNumber: e.target.value})}
                        placeholder="Check #"
                        className="h-7 text-xs"
                      />
                    ) : (
                      transaction.checkNumber || '-'
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {editingId === transaction.id && editingTransaction ? (
                      <Input
                        value={editingTransaction.description || ''}
                        onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                        className="h-7 text-xs"
                      />
                    ) : (
                      transaction.description
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {editingId === transaction.id && editingTransaction ? (
                      <Select 
                        value={editingTransaction.categoryId || ''}
                        onValueChange={(value) => setEditingTransaction({...editingTransaction, categoryId: value})}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      transaction.categoryName || "Uncategorized"
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {editingId === transaction.id && editingTransaction ? (
                      <Input 
                        type="number"
                        value={editingTransaction.isPayment ? editingTransaction.amount : ''}
                        onChange={(e) => setEditingTransaction({...editingTransaction, amount: e.target.value, isPayment: true})}
                        placeholder="0.00"
                        className="h-7 text-xs text-right"
                      />
                    ) : (
                      transaction.amount < 0 ? formatCurrency(transaction.amount) : ""
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {editingId === transaction.id && editingTransaction ? (
                      <Input 
                        type="number"
                        value={!editingTransaction.isPayment ? editingTransaction.amount : ''}
                        onChange={(e) => setEditingTransaction({...editingTransaction, amount: e.target.value, isPayment: false})}
                        placeholder="0.00"
                        className="h-7 text-xs text-right"
                      />
                    ) : (
                      transaction.amount > 0 ? formatCurrency(transaction.amount) : ""
                    )}
                  </TableCell>
                  <TableCell className={`text-right text-xs font-medium ${
                    transaction.balance < 0 ? "text-red-600" : ""
                  }`}>
                    ${formatBalance(transaction.balance || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingId === transaction.id ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSave();
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCancel();
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(transaction);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(transaction.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TransactionsRegister;