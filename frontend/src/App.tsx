import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { oauthConfig } from "@/lib/config";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import BudgetPlans from "./pages/BudgetPlans";
import BudgetPlanEditor from "./pages/BudgetPlanEditor";
import BudgetPlanReport from "./pages/BudgetPlanReport";
import Reports from "./pages/Reports";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import Categories from "./pages/Categories";
import TransactionsRegister from "./pages/TransactionsRegister";
import Settings from "./pages/Settings";
import { useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

// Redirect authenticated users away from login/register
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />

    {/* Protected routes */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
    />
    <Route
      path="/transactions"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Transactions />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/budgets"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Budgets />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/budget-plans"
      element={
        <ProtectedRoute>
          <AppLayout>
            <BudgetPlans />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/budget-plans/:id/edit"
      element={
        <ProtectedRoute>
          <AppLayout>
            <BudgetPlanEditor />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/budget-plans/:id/report"
      element={
        <ProtectedRoute>
          <AppLayout>
            <BudgetPlanReport />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Reports />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/accounts"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Accounts />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/categories"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Categories />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/register/:accountId"
      element={
        <ProtectedRoute>
          <AppLayout>
            <TransactionsRegister />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <GoogleOAuthProvider clientId={oauthConfig.googleClientId}>
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);

export default App;
