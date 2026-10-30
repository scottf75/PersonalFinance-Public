
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send } from "lucide-react";

const AIQueryBox = () => {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // In a real app, this would call an AI API
    setIsSubmitting(true);
    
    // Simulate AI response
    setTimeout(() => {
      setResponse(`Based on your financial data, I can see that your total balance is $5,280.45. 
      Your monthly income is $2,950.00 and your expenses are $1,775.00.
      
      The largest expense category is Housing at $850.00, followed by Food at $420.00.
      
      I notice you've recently made a grocery shopping transaction of $85.75 on May 19th, 2025.`);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Ask Finance AI</CardTitle>
        </div>
        <CardDescription>
          Ask questions about your transactions, budgets, or financial insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Example: What was my largest expense last month? How much did I spend on groceries?"
            className="min-h-24 resize-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          {response && (
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="whitespace-pre-line">{response}</p>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={isSubmitting || !query.trim()}
        >
          {isSubmitting ? "Processing..." : "Ask AI"}
          <Send className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIQueryBox;
