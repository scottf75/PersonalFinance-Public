import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CreditCard, PiggyBank, LineChart, ArrowUpRight, RefreshCw, Link2, Loader2, Sparkles } from "lucide-react";
import AddAccountDialog from "@/components/accounts/AddAccountDialog";
import EditAccountDialog from "@/components/accounts/EditAccountDialog";
import LinkBankDialog from "@/components/accounts/LinkBankDialog";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import { useTellerConnect } from "@/hooks/use-teller-connect";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Accounts = () => {
  const navigate = useNavigate();
  
  // Sample account data
 /* const bankAccounts = [
    {
      id: "bank1",
      name: "Main Checking",
      institution: "Bank of America",
      balance: 3280.45,
      lastUpdate: "2025-05-20",
      icon: <Wallet className="h-6 w-6" />,
    },
    {
      id: "bank2",
      name: "Savings Account",
      institution: "Chase",
      balance: 12750.89,
      lastUpdate: "2025-05-19",
      icon: <PiggyBank className="h-6 w-6" />,
    },
  ];

  const creditCards = [
    {
      id: "cc1",
      name: "Visa Rewards",
      institution: "Chase",
      balance: 750.32,
      limit: 5000,
      dueDate: "2025-06-15",
      icon: <CreditCard className="h-6 w-6" />,
    },
    {
      id: "cc2",
      name: "Mastercard",
      institution: "Citi",
      balance: 230.15,
      limit: 4000,
      dueDate: "2025-06-10",
      icon: <CreditCard className="h-6 w-6" />,
    },
  ];

  const investments = [
    {
      id: "inv1",
      name: "401(k)",
      institution: "Fidelity",
      balance: 42680.75,
      performance: "+5.2%",
      performanceDirection: "up",
      icon: <LineChart className="h-6 w-6" />,
    },
    {
      id: "inv2",
      name: "Brokerage Account",
      institution: "Vanguard",
      balance: 8430.22,
      performance: "+3.7%",
      performanceDirection: "up",
      icon: <LineChart className="h-6 w-6" />,
    },
  ];*/

  // Set this flag at the top of your component
const USE_SAMPLE_DATA = false;

// Sample data - kept for testing/demo purposes
const sampleBankAccounts = [
  {
    id: "bank1",
    name: "Main Checking",
    institution: "Bank of America",
    balance: 3280.45,
    lastUpdate: "2025-05-20",
    icon: <Wallet className="h-6 w-6" />,
  },
  {
    id: "bank2",
    name: "Savings Account",
    institution: "Chase",
    balance: 12750.89,
    lastUpdate: "2025-05-19",
    icon: <PiggyBank className="h-6 w-6" />,
  },
];

const sampleCreditCards = [
  {
    id: "cc1",
    name: "Visa Rewards",
    institution: "Chase",
    balance: 750.32,
    limit: 5000,
    dueDate: "2025-06-15",
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    id: "cc2",
    name: "Mastercard",
    institution: "Citi",
    balance: 230.15,
    limit: 4000,
    dueDate: "2025-06-10",
    icon: <CreditCard className="h-6 w-6" />,
  },
];

const sampleInvestments = [
  {
    id: "inv1",
    name: "401(k)",
    institution: "Fidelity",
    balance: 42680.75,
    performance: "+5.2%",
    performanceDirection: "up",
    icon: <LineChart className="h-6 w-6" />,
  },
  {
    id: "inv2",
    name: "Brokerage Account",
    institution: "Vanguard",
    balance: 8430.22,
    performance: "+3.7%",
    performanceDirection: "up",
    icon: <LineChart className="h-6 w-6" />,
  },
];

// State for API data
const [apiAccounts, setApiAccounts] = useState([]);
const [loading, setLoading] = useState(!USE_SAMPLE_DATA);
const [syncingAccountId, setSyncingAccountId] = useState<number | null>(null);
const [autoCategorize, setAutoCategorize] = useState(true);
const [isCategorizing, setIsCategorizing] = useState(false);

// Teller sync hook
const { syncAccount, syncAllAccounts, categorizeUncategorized, isLoading: isSyncing } = useTellerConnect();

// Fetch from API
useEffect(() => {
  if (!USE_SAMPLE_DATA) {
    fetchAccounts();
  }
}, []);

const fetchAccounts = async () => {
  try {
    const response = await apiClient.fetch(api.accounts);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to fetch accounts");
    }

    const data = await response.json();
    setApiAccounts(data);
    setLoading(false);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    setLoading(false);
  }
};

// Choose data source based on flag
let bankAccounts, creditCards, investments;

if (USE_SAMPLE_DATA) {
  // Use sample data directly
  bankAccounts = sampleBankAccounts;
  creditCards = sampleCreditCards;
  investments = sampleInvestments;
} else {
  // Transform API data to match sample data format
  bankAccounts = apiAccounts.filter(acc => acc.accountType === 1).map(acc => ({
    id: acc.id,
    name: acc.name,
    institution: acc.institution,
    balance: acc.balance,
    lastUpdate: acc.lastSyncDate || acc.lastUpdate || new Date().toISOString(),
    icon: <Wallet className="h-6 w-6" />,
    tellerAccountId: acc.tellerAccountId,
    tellerEnrollmentId: acc.tellerEnrollmentId,
  }));

  creditCards = apiAccounts.filter(acc => acc.accountType === 2).map(acc => ({
    id: acc.id,
    name: acc.name,
    institution: acc.institution,
    balance: acc.balance,
    limit: acc.additionalInfo?.limit || 0,
    dueDate: acc.additionalInfo?.dueDate || new Date().toISOString(),
    icon: <CreditCard className="h-6 w-6" />,
    tellerAccountId: acc.tellerAccountId,
    tellerEnrollmentId: acc.tellerEnrollmentId,
  }));

  investments = apiAccounts.filter(acc => acc.accountType === 3).map(acc => ({
    id: acc.id,
    name: acc.name,
    institution: acc.institution,
    balance: acc.balance,
    performance: acc.additionalInfo?.performance || "+0%",
    performanceDirection: "up",
    icon: <LineChart className="h-6 w-6" />,
    tellerAccountId: acc.tellerAccountId,
    tellerEnrollmentId: acc.tellerEnrollmentId,
  }));
}

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const handleViewTransactions = (accountId: string | number, accountName: string) => {
    navigate(`/register/${accountId}`);
  };

  const handleSyncAccount = async (accountId: number) => {
    setSyncingAccountId(accountId);
    const result = await syncAccount(accountId, autoCategorize);
    setSyncingAccountId(null);

    if (result) {
      if (result.success) {
        toast.success(
          `Synced ${result.accountName}: ${result.transactionsImported} new transactions`
        );
        fetchAccounts(); // Refresh accounts to get updated balances
      } else {
        toast.error(result.errorMessage || "Failed to sync account");
      }
    }
  };

  const handleSyncAll = async () => {
    const results = await syncAllAccounts(autoCategorize);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      const totalImported = successful.reduce((sum, r) => sum + r.transactionsImported, 0);
      toast.success(`Synced ${successful.length} accounts: ${totalImported} new transactions`);
      fetchAccounts(); // Refresh accounts to get updated balances
    }

    if (failed.length > 0) {
      toast.error(`${failed.length} accounts failed to sync`);
    }
  };

  const handleCategorizeAll = async () => {
    setIsCategorizing(true);
    try {
      const result = await categorizeUncategorized();

      if (result) {
        if (result.errors && result.errors.length > 0) {
          toast.error(`Errors: ${result.errors[0]}`);
        } else if (result.totalProcessed === 0) {
          toast.info("No uncategorized transactions found");
        } else {
          toast.success(`Categorized ${result.categorized} transactions (${result.skipped} skipped)`);
        }
      } else {
        toast.error("Failed to categorize transactions");
      }
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsCategorizing(false);
    }
  };

  // Check if an account is linked to Teller
  const isAccountLinked = (account: any) => {
    return account.tellerAccountId && account.tellerEnrollmentId;
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={autoCategorize ? "default" : "outline"}
                size="icon"
                onClick={() => setAutoCategorize(!autoCategorize)}
                className="h-9 w-9"
              >
                <Sparkles className={`h-4 w-4 ${autoCategorize ? "text-yellow-300" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI Auto-Categorize: {autoCategorize ? "ON" : "OFF"}</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync All
          </Button>
          <Button
            variant="outline"
            onClick={handleCategorizeAll}
            disabled={isCategorizing}
          >
            {isCategorizing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Categorize
          </Button>
          <AddAccountDialog />
        </div>
      </div>

      <Tabs defaultValue="bank">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bank">Bank Accounts</TabsTrigger>
          <TabsTrigger value="credit">Credit Cards</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {bankAccounts.map(account => (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full bg-muted p-2">
                      {account.icon}
                    </div>
                    <div>
                      <CardTitle>{account.name}</CardTitle>
                      <CardDescription>{account.institution}</CardDescription>
                    </div>
                  </div>
                  <EditAccountDialog
                    account={{ id: account.id, name: account.name, institution: account.institution }}
                    onAccountUpdated={fetchAccounts}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(account.balance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {formatDate(account.lastUpdate)}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewTransactions(account.id, account.name)}
                  >
                    View Transactions
                  </Button>
                  {account.tellerAccountId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncAccount(account.id)}
                      disabled={syncingAccountId === account.id}
                      title="Sync transactions"
                    >
                      {syncingAccountId === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <LinkBankDialog
                      account={{ id: account.id, name: account.name, institution: account.institution }}
                      onAccountLinked={fetchAccounts}
                    />
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="credit" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {creditCards.map(card => (
              <Card key={card.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full bg-muted p-2">
                      {card.icon}
                    </div>
                    <div>
                      <CardTitle>{card.name}</CardTitle>
                      <CardDescription>{card.institution}</CardDescription>
                    </div>
                  </div>
                  <EditAccountDialog
                    account={{ id: card.id, name: card.name, institution: card.institution }}
                    onAccountUpdated={fetchAccounts}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(card.balance)}
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span>{formatCurrency(card.limit)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{formatDate(card.dueDate)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewTransactions(card.id, card.name)}
                  >
                    View Transactions
                  </Button>
                  {card.tellerAccountId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncAccount(card.id)}
                      disabled={syncingAccountId === card.id}
                      title="Sync transactions"
                    >
                      {syncingAccountId === card.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <LinkBankDialog
                      account={{ id: card.id, name: card.name, institution: card.institution }}
                      onAccountLinked={fetchAccounts}
                    />
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {investments.map(investment => (
              <Card key={investment.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full bg-muted p-2">
                      {investment.icon}
                    </div>
                    <div>
                      <CardTitle>{investment.name}</CardTitle>
                      <CardDescription>{investment.institution}</CardDescription>
                    </div>
                  </div>
                  <EditAccountDialog
                    account={{ id: investment.id, name: investment.name, institution: investment.institution }}
                    onAccountUpdated={fetchAccounts}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(investment.balance)}
                  </div>
                  <div className="mt-1 flex items-center">
                    <span className={`text-sm ${
                      investment.performanceDirection === "up"
                        ? "text-finance-success"
                        : "text-finance-danger"
                    }`}>
                      {investment.performance}
                      {investment.performanceDirection === "up" ? (
                        <ArrowUpRight className="ml-1 inline h-4 w-4" />
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">YTD</span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  {investment.tellerAccountId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncAccount(investment.id)}
                      disabled={syncingAccountId === investment.id}
                      title="Sync transactions"
                    >
                      {syncingAccountId === investment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <LinkBankDialog
                      account={{ id: investment.id, name: investment.name, institution: investment.institution }}
                      onAccountLinked={fetchAccounts}
                    />
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
};

export default Accounts;
