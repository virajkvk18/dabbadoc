import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/15 text-primary shadow-[0_0_18px_rgba(129,247,89,0.12)]",
        secondary: "border-secondary/25 bg-secondary/15 text-orange-100 shadow-[0_0_18px_rgba(253,139,0,0.1)]",
        outline: "border-white/10 bg-white/5 text-muted-foreground",
        danger: "border-red-400/25 bg-red-500/10 text-red-200"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
