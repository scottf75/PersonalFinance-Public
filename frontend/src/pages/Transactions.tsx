import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";

const USE_SAMPLE_DATA = false;

const sampleTransactions = [
  {
    id: 1,
    description: "Groceries at Walmart",
    amount: 54.23,
    categoryId: 2,
    accountId: 1,
    transactionDate: "2025-12-01T10:00:00Z",
    createdAt: "2025-12-01T10:05:00Z",
    updatedAt: "2025-12-01T10:05:00Z",
    categoryName: "Groceries",
    accountName: "Main Checking",
  },
  // ...more sample data...
];

const Transactions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const accountId = location.state?.accountId;
  const accountName = location.state?.accountName;
  
  const [apiTransactions, setApiTransactions] = useState([]);
  const [loading, setLoading] = useState(!USE_SAMPLE_DATA);

  useEffect(() => {
    if (!USE_SAMPLE_DATA) {
      fetchTransactions();
    }
    // eslint-disable-next-line
  }, [accountId]);

  const fetchTransactions = async () => {
    try {
      const url = accountId
        ? `${api.transactions}?accountId=${accountId}`
        : api.transactions;

      const response = await apiClient.fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch transactions");
      }

      const data = await response.json();
      setApiTransactions(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setLoading(false);
    }
  };

  let transactions;

  if (USE_SAMPLE_DATA) {
    transactions = sampleTransactions;
  } else {
    transactions = apiTransactions.map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      categoryId: tx.categoryId,
      accountId: tx.accountId,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      categoryName: tx.categoryName || "Unknown",
      accountName: tx.accountName || "Unknown",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {accountId && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/accounts')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {accountId ? `${accountName} Transactions` : 'All Transactions'}
            </h2>
            {accountId && (
              <p className="text-muted-foreground mt-1">
                Showing transactions for {accountName}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {transactions.map(tx => (
          <Card key={tx.id}>
            <CardHeader>
              <CardTitle>{tx.description}</CardTitle>
              <CardDescription>
                {tx.categoryName} &mdash; {tx.accountName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(tx.amount)}</div>
              <p className="text-xs text-muted-foreground">
                {formatDate(tx.transactionDate)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {loading && <div>Loading...</div>}
    </div>
  );
};

export default Transactions;