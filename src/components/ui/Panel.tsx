import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  tone = "card",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; tone?: "card" | "dark" }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] p-5",
        tone === "card" && "surface-card",
        tone === "dark" &&
          "bg-navy-800/80 border border-gold-500/15 text-ivory-100 shadow-[var(--shadow-lifted)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
