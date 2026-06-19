import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type DabbaDocLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg" | "hero";
  showText?: boolean;
  className?: string;
};

const imageSize = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  hero: "h-28 w-28 sm:h-36 sm:w-36"
};

export function DabbaDocLogo({
  href,
  size = "md",
  showText = true,
  className
}: DabbaDocLogoProps) {
  const content = (
    <div className={cn("group inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-primary/30 bg-black/20 shadow-[0_0_32px_rgba(129,247,89,0.2)]",
          imageSize[size]
        )}
      >
        <Image
          src="/dabbadoc-logo.png"
          alt="DabbaDoc"
          fill
          sizes={size === "hero" ? "144px" : "64px"}
          className="object-cover transition duration-500 group-hover:scale-105"
          priority={size === "hero"}
        />
      </span>
      {showText ? (
        <span className="leading-none">
          <span className="block text-lg font-black tracking-normal text-white">
            Dabba<span className="text-primary">Doc</span>
          </span>
          <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200 sm:block">
            Label Padhega India
          </span>
        </span>
      ) : null}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}
