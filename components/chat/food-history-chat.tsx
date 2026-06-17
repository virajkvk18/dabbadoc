"use client";

import { useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

type ChatMessage = {
  role: "user" | "bot";
  content: string;
};

function FoodHistoryChatSurface({
  compact = false,
  onClose
}: {
  compact?: boolean;
  onClose?: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi, I'm DabbaBot. Ask me about your score, repeated foods, cheaper swaps, or this week's next change."
    }
  ]);
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
    setQuestion("");
    setMessages((items) => [...items, { role: "user", content: cleanQuestion }]);

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
      setMessages((items) => [...items, { role: "bot", content: payload.answer ?? "" }]);
    } catch {
      setError("Could not reach DabbaDoc chat. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={cn("glass-panel", compact && "h-full rounded-2xl border-white/15")}>
      <CardHeader className={cn(compact && "p-4")}>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Ask your food history
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition hover:text-white"
              aria-label="Close DabbaBot"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4", compact && "p-4 pt-0")}>
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
        <div
          className={cn(
            "custom-scrollbar space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3",
            compact ? "max-h-[260px]" : "max-h-[360px]"
          )}
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
              className={cn(
                "rounded-xl px-3 py-2 text-sm leading-6",
                message.role === "bot"
                  ? "border border-primary/20 bg-primary/10 text-primary"
                  : "ml-auto max-w-[88%] border border-white/10 bg-white/10 text-white"
              )}
            >
              {message.content}
            </div>
          ))}
        </div>
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              ask();
            }
          }}
          className={cn("min-h-28", compact && "min-h-20")}
          placeholder="Ask about your saved receipts, labels, diary, repeated foods, or cheaper swaps..."
        />
        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        <Button onClick={() => ask()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask DabbaDoc
        </Button>
      </CardContent>
    </Card>
  );
}

export function FoodHistoryChat() {
  return <FoodHistoryChatSurface />;
}

export function FloatingFoodChatbot() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-50 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="mb-3 h-[560px] w-[min(calc(100vw-2rem),390px)]">
          <FoodHistoryChatSurface compact onClose={() => setOpen(false)} />
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_28px_rgba(129,247,89,0.45)] transition hover:scale-105 active:scale-95"
        aria-label="Open DabbaBot"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
