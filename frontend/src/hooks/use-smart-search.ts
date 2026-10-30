import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";

export interface SearchFilters {
  keywords: string | null;
  categoryIds: number[] | null;
  minAmount: number | null;
  maxAmount: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  accountId: number | null;
}

export interface SearchParseResponse {
  filters: SearchFilters;
  explanation: string | null;
}

const searchCache = new Map<string, SearchParseResponse>();

export function useSmartSearch(query: string, enabled: boolean, accountId?: number) {
  const [parseResult, setParseResult] = useState<SearchParseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // If not enabled or query too short, clear results
    if (!enabled || query.length < 2) {
      setParseResult(null);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Check cache first
    const cached = searchCache.get(normalizedQuery);
    if (cached) {
      // Update accountId from cache
      const result = {
        ...cached,
        filters: { ...cached.filters, accountId: accountId ?? null }
      };
      setParseResult(result);
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const response = await apiClient.fetch(`${api.search}/parse`, {
          method: "POST",
          body: JSON.stringify({ query, accountId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to parse search query");
        }

        const result: SearchParseResponse = await response.json();

        // Cache the result (without accountId for reusability)
        const cacheResult = {
          ...result,
          filters: { ...result.filters, accountId: null }
        };
        searchCache.set(normalizedQuery, cacheResult);

        // Set result with current accountId
        result.filters.accountId = accountId ?? null;
        setParseResult(result);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Smart search failed:", error);
          setParseResult(null);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, enabled, accountId]);

  return { parseResult, isLoading };
}
