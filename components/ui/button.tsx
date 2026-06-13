import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_28px_rgba(129,247,89,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] hover:bg-[#86fd5e] hover:shadow-[0_0_40px_rgba(129,247,89,0.42)] active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_0_28px_rgba(253,139,0,0.24),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-[#ffb77d] active:scale-[0.98]",
        outline:
          "border border-white/10 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-[0.98]",
        ghost: "text-muted-foreground hover:bg-white/10 hover:text-white",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_0_24px_rgba(239,68,68,0.22)] hover:bg-destructive/90 active:scale-[0.98]"
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 px-6 py-3 text-base",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
