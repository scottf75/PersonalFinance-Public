import { useCallback, useState } from "react";
import { api, tellerConfig } from "@/lib/config";
import { apiClient } from "@/lib/api";

// Type definitions for Teller Connect SDK
declare global {
  interface Window {
    TellerConnect: {
      setup: (config: TellerConnectConfig) => TellerConnectInstance;
    };
  }
}

interface TellerConnectConfig {
  applicationId: string;
  environment?: "sandbox" | "development" | "production";
  onSuccess: (enrollment: TellerEnrollmentResult) => void;
  onExit?: () => void;
  onFailure?: (error: TellerError) => void;
}

interface TellerConnectInstance {
  open: () => void;
  destroy: () => void;
}

interface TellerEnrollmentResult {
  accessToken: string;
  enrollment: {
    id: string;
    institution: {
      name: string;
    };
  };
}

interface TellerError {
  message: string;
  type: string;
}

interface TellerAccount {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  status: string;
  institution: {
    id: string;
    name: string;
  };
  lastFour?: string;
}

interface EnrollmentResponse {
  id: number;
  enrollmentId: string;
  institutionName?: string;
}

interface ExistingEnrollment {
  id: number;
  enrollmentId: string;
  institutionName?: string;
  lastSyncAt?: string;
  isActive: boolean;
}

interface UseTellerConnectReturn {
  openTellerConnect: () => void;
  isLoading: boolean;
  error: string | null;
  enrollment: EnrollmentResponse | null;
  tellerAccounts: TellerAccount[];
  existingEnrollments: ExistingEnrollment[];
  fetchExistingEnrollments: () => Promise<void>;
  selectExistingEnrollment: (enrollment: ExistingEnrollment) => Promise<void>;
  fetchTellerAccounts: (enrollmentId: number) => Promise<void>;
  linkAccountToTeller: (localAccountId: number, tellerAccountId: string, enrollmentId: number) => Promise<boolean>;
  syncAccount: (accountId: number, autoCategorize?: boolean) => Promise<SyncResult | null>;
  syncAllAccounts: (autoCategorize?: boolean) => Promise<SyncResult[]>;
  categorizeUncategorized: (accountId?: number) => Promise<BatchCategorizationResult | null>;
}

interface BatchCategorizationResult {
  totalProcessed: number;
  categorized: number;
  skipped: number;
  errors: string[];
}

interface SyncResult {
  accountId: number;
  accountName: string;
  transactionsImported: number;
  transactionsSkipped: number;
  newBalance?: number;
  success: boolean;
  errorMessage?: string;
}

export function useTellerConnect(onSuccess?: () => void): UseTellerConnectReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [tellerAccounts, setTellerAccounts] = useState<TellerAccount[]>([]);
  const [existingEnrollments, setExistingEnrollments] = useState<ExistingEnrollment[]>([]);

  const fetchTellerAccounts = useCallback(async (enrollmentId: number) => {
    try {
      const response = await apiClient.fetch(`${api.teller}/enrollments/${enrollmentId}/accounts`);
      if (!response.ok) {
        throw new Error("Failed to fetch Teller accounts");
      }
      const accounts = await response.json();
      setTellerAccounts(accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    }
  }, []);

  const fetchExistingEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.fetch(`${api.teller}/status`);
      if (!response.ok) {
        throw new Error("Failed to fetch enrollments");
      }
      const data = await response.json();
      // Extract enrollments from the status response
      const enrollments = data.enrollments?.map((e: any) => ({
        id: e.id,
        enrollmentId: e.enrollmentId,
        institutionName: e.institutionName,
        lastSyncAt: e.lastSyncAt,
        isActive: e.isActive,
      })) || [];
      setExistingEnrollments(enrollments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch enrollments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectExistingEnrollment = useCallback(async (existingEnrollment: ExistingEnrollment) => {
    try {
      setIsLoading(true);
      setError(null);

      // Set the enrollment
      setEnrollment({
        id: existingEnrollment.id,
        enrollmentId: existingEnrollment.enrollmentId,
        institutionName: existingEnrollment.institutionName,
      });

      // Fetch accounts for this enrollment
      await fetchTellerAccounts(existingEnrollment.id);

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select enrollment");
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, fetchTellerAccounts]);

  const openTellerConnect = useCallback(() => {
    if (!tellerConfig.applicationId) {
      setError("Teller Application ID not configured. Please set VITE_TELLER_APP_ID.");
      return;
    }

    if (!window.TellerConnect) {
      setError("Teller Connect SDK not loaded. Please refresh the page.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const teller = window.TellerConnect.setup({
      applicationId: tellerConfig.applicationId,
      environment: tellerConfig.environment as "sandbox" | "development" | "production",
      onSuccess: async (result) => {
        try {
          // Send enrollment to backend
          const response = await apiClient.fetch(`${api.teller}/link`, {
            method: "POST",
            body: JSON.stringify({
              enrollmentId: result.enrollment.id,
              accessToken: result.accessToken,
              institutionName: result.enrollment.institution.name,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save enrollment");
          }

          const enrollmentData = await response.json();
          setEnrollment(enrollmentData);

          // Fetch available Teller accounts
          await fetchTellerAccounts(enrollmentData.id);

          onSuccess?.();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to link bank");
        } finally {
          setIsLoading(false);
        }
      },
      onExit: () => {
        setIsLoading(false);
      },
      onFailure: (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    });

    teller.open();
  }, [onSuccess, fetchTellerAccounts]);

  const linkAccountToTeller = useCallback(async (
    localAccountId: number,
    tellerAccountId: string,
    enrollmentId: number
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiClient.fetch(`${api.teller}/accounts/${localAccountId}/link`, {
        method: "POST",
        body: JSON.stringify({
          tellerAccountId,
          enrollmentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to link account");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link account");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncAccount = useCallback(async (accountId: number, autoCategorize: boolean = true): Promise<SyncResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.fetch(`${api.teller}/sync/${accountId}?autoCategorize=${autoCategorize}`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.errorMessage || "Failed to sync account");
        return result;
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync account");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncAllAccounts = useCallback(async (autoCategorize: boolean = true): Promise<SyncResult[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.fetch(`${api.teller}/sync-all?autoCategorize=${autoCategorize}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to sync accounts");
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync accounts");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const categorizeUncategorized = useCallback(async (accountId?: number): Promise<BatchCategorizationResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const url = accountId
        ? `${api.categorization}/batch?accountId=${accountId}`
        : `${api.categorization}/batch`;

      const response = await apiClient.fetch(url, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to categorize transactions");
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to categorize transactions");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    openTellerConnect,
    isLoading,
    error,
    enrollment,
    tellerAccounts,
    existingEnrollments,
    fetchExistingEnrollments,
    selectExistingEnrollment,
    fetchTellerAccounts,
    linkAccountToTeller,
    syncAccount,
    syncAllAccounts,
    categorizeUncategorized,
  };
}
