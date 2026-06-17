"use client";

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
  function toggleGoal(goal: string) {
    onChange(
      selectedGoals.includes(goal)
        ? selectedGoals.filter((item) => item !== goal)
        : [...selectedGoals, goal]
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div>
        <p className="font-semibold text-white">Personal health goals</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose goals so DabbaDoc can tune swaps and tips.
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
    </div>
  );
}
