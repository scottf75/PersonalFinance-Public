
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PiggyBank,
  BarChart3,
  CreditCard,
  Settings,
  ChevronRight,
  ChevronDown,
  Folder,
  TrendingUp,
  Building2,
  ClipboardList,
} from "lucide-react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";

// Account type enum values from backend
const AccountType = {
  Bank: 1,
  Credit: 2,
  Investment: 3,
} as const;

interface Account {
  id: number;
  name: string;
  accountType: number;
  balance: number;
}

interface AccountGroup {
  label: string;
  type: number;
  icon: typeof Banknote;
  accounts: Account[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const AppSidebar = () => {
  const { state, open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({
    [AccountType.Bank]: true,
    [AccountType.Credit]: true,
    [AccountType.Investment]: true,
  });

  const toggleGroup = (type: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const groupedAccounts: AccountGroup[] = [
    {
      label: "Bank Accounts",
      type: AccountType.Bank,
      icon: Building2,
      accounts: accounts.filter((a) => a.accountType === AccountType.Bank),
    },
    {
      label: "Credit Cards",
      type: AccountType.Credit,
      icon: CreditCard,
      accounts: accounts.filter((a) => a.accountType === AccountType.Credit),
    },
    {
      label: "Investments",
      type: AccountType.Investment,
      icon: TrendingUp,
      accounts: accounts.filter((a) => a.accountType === AccountType.Investment),
    },
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.fetch(api.accounts);

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      setAccounts(data);
      setAccountsLoading(false);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setAccountsLoading(false);
    }
  };

  const navItems = [
    { title: "Dashboard", url: "/", icon: PiggyBank },
    { title: "Budget Plans", url: "/budget-plans", icon: ClipboardList },
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Accounts", url: "/accounts", icon: CreditCard },
    { title: "Categories", url: "/categories", icon: Folder },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-primary font-medium"
      : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar
      className={`border-r transition-all duration-300 ${
        state === "collapsed" ? "w-14" : "w-64"
      }`}
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent className="pt-5">
        <SidebarGroup>
          <SidebarGroupLabel className={state === "collapsed" ? "sr-only" : ""}>
            Main Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md ${getNavClass({
                        isActive: isActive(item.url),
                      })}`}
                      end={item.url === "/"}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive(item.url)
                            ? "text-finance-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      {state === "collapsed" ? null : <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Accounts Section */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={state === "collapsed" ? "sr-only" : ""}>
            Accounts
          </SidebarGroupLabel>

          <SidebarGroupContent>
            {accountsLoading ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <span className="px-3 py-2 text-sm text-muted-foreground">
                    {state === "collapsed" ? "..." : "Loading accounts..."}
                  </span>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : accounts.length === 0 ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <span className="px-3 py-2 text-sm text-muted-foreground">
                    {state === "collapsed" ? "-" : "No accounts"}
                  </span>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              groupedAccounts
                .filter((group) => group.accounts.length > 0)
                .map((group) => (
                  <Collapsible
                    key={group.type}
                    open={expandedGroups[group.type]}
                    onOpenChange={() => toggleGroup(group.type)}
                    className="mb-1"
                  >
                    <CollapsibleTrigger
                      className={`flex items-center gap-2 px-3 py-1.5 w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${
                        state === "collapsed" ? "justify-center" : ""
                      }`}
                    >
                      {expandedGroups[group.type] ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <group.icon className="h-3.5 w-3.5" />
                      {state === "collapsed" ? null : (
                        <span className="uppercase tracking-wider">
                          {group.label}
                        </span>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu>
                        {group.accounts.map((account) => (
                          <SidebarMenuItem key={account.id}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={`/register/${account.id}`}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md ${getNavClass({
                                  isActive: isActive(`/register/${account.id}`),
                                })}`}
                              >
                                <group.icon
                                  className={`h-4 w-4 flex-shrink-0 ${
                                    isActive(`/register/${account.id}`)
                                      ? "text-finance-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                                {state === "collapsed" ? null : (
                                  <div className="flex items-center justify-between flex-1 min-w-0">
                                    <span className="text-sm truncate">
                                      {account.name}
                                    </span>
                                    <span
                                      className={`text-xs ml-2 flex-shrink-0 ${
                                        account.balance < 0
                                          ? "text-red-500"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {formatCurrency(account.balance)}
                                    </span>
                                  </div>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                ))
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
