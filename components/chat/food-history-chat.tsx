"use client";

import { useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const suggestions = [
  "Why is my score low?",
  "What should I change this week?",
  "Which item repeated most?",
  "Give me a cheaper healthy grocery list."
];

type ChatResponse = {
  answer?: string;
  error?: string;
};

export function FoodHistoryChat() {
  const [question, setQuestion] = useState(suggestions[0]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(nextQuestion = question) {
    const cleanQuestion = nextQuestion.trim();
    if (!cleanQuestion) {
      setError("Ask a question first.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);
    setQuestion(cleanQuestion);

    try {
      const response = await fetch("/api/food-history-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion })
      });
      const payload = (await response.json().catch(() => ({}))) as ChatResponse;
      if (!response.ok || !payload.answer) {
        setError(payload.error ?? "Could not answer from history yet.");
        return;
      }
      setAnswer(payload.answer);
    } catch {
      setError("Could not reach DabbaDoc chat. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Ask your food history
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => ask(item)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary"
            >
              {item}
            </button>
          ))}
        </div>
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-h-28"
          placeholder="Ask about your saved receipts, labels, diary, repeated foods, or cheaper swaps..."
        />
        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        {answer ? (
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-primary">
            {answer}
          </div>
        ) : null}
        <Button onClick={() => ask()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask DabbaDoc
        </Button>
      </CardContent>
    </Card>
  );
}
