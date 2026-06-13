import { ShieldAlert } from "lucide-react";
import { DABBADOC_DISCLAIMER } from "@/types";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-orange-300/20 bg-orange-500/10 p-4 text-sm leading-6 text-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{DABBADOC_DISCLAIMER}</p>
    </div>
  );
}
