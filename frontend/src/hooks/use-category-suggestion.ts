import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";

export interface CategorySuggestion {
  suggestedCategoryId: number | null;
  suggestedCategoryName: string | null;
  confidence: number;
  reasoning: string | null;
}

const suggestionCache = new Map<string, CategorySuggestion>();

export function useCategorySuggestion(description: string) {
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (description.length < 3) {
      setSuggestion(null);
      return;
    }

    const normalizedDesc = description.toLowerCase().trim();

    // Check cache first
    const cached = suggestionCache.get(normalizedDesc);
    if (cached) {
      setSuggestion(cached);
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
        const response = await apiClient.fetch(`${api.categorization}/suggest`, {
          method: "POST",
          body: JSON.stringify({ description }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to get suggestion");
        }

        const result: CategorySuggestion = await response.json();

        // Cache the result
        suggestionCache.set(normalizedDesc, result);

        setSuggestion(result);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Category suggestion failed:", error);
          setSuggestion(null);
        }
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [description]);

  return { suggestion, isLoading };
}
