"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const healthGoalOptions = [
  "Weight loss",
  "Diabetes-friendly",
  "High protein",
  "Low sodium",
  "Kids lunchbox",
  "Heart-friendly"
];

export function HealthGoalSelector({
  selectedGoals,
  onChange
}: {
  selectedGoals: string[];
  onChange: (goals: string[]) => void;
}) {
  const [customGoal, setCustomGoal] = useState("");

  function cleanGoal(goal: string) {
    return goal.replace(/[^a-zA-Z0-9 ,+&()./-]/g, "").replace(/\s+/g, " ").trim();
  }

  function toggleGoal(goal: string) {
    onChange(
      selectedGoals.includes(goal)
        ? selectedGoals.filter((item) => item !== goal)
        : [...selectedGoals, goal]
    );
  }

  function addCustomGoal() {
    const goal = cleanGoal(customGoal);
    if (goal.length < 2 || selectedGoals.includes(goal)) return;
    onChange([...selectedGoals, goal].slice(0, 6));
    setCustomGoal("");
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div>
        <p className="font-semibold text-white">Personal health goals</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose suggested goals or add your own.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {healthGoalOptions.map((goal) => {
          const selected = selectedGoals.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                selected
                  ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_18px_rgba(129,247,89,0.16)]"
                  : "border-white/10 bg-black/20 text-muted-foreground hover:border-white/20 hover:text-white"
              )}
            >
              {goal}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={customGoal}
          onChange={(event) => setCustomGoal(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustomGoal();
            }
          }}
          placeholder="Add custom goal, e.g. PCOS-friendly, gym diet, acidity control"
          maxLength={60}
        />
        <Button type="button" variant="outline" onClick={addCustomGoal}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      {selectedGoals.some((goal) => !healthGoalOptions.includes(goal)) ? (
        <div className="flex flex-wrap gap-2">
          {selectedGoals
            .filter((goal) => !healthGoalOptions.includes(goal))
            .map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className="inline-flex items-center gap-1 rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1.5 text-sm font-semibold text-sky-100"
              >
                {goal}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
