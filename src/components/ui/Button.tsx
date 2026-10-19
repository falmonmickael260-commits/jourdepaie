"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSfx } from "@/lib/audio/useSfx";

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
>;

interface ButtonProps extends NativeButtonProps {
  variant?: "gold" | "ghost" | "outline" | "danger";
  icon?: ReactNode;
  className?: string;
  silent?: boolean;
}

export function Button({
  variant = "gold",
  icon,
  children,
  className,
  silent,
  onClick,
  ...props
}: ButtonProps) {
  const playClick = useSfx();

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ y: 1, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onClick={(e) => {
        if (!silent) playClick("click");
        onClick?.(e);
      }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5",
        "font-sans font-semibold text-[0.95rem] tracking-wide",
        "transition-colors duration-200 select-none cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "gold" &&
          "surface-gold shadow-[var(--shadow-gold-glow)] hover:brightness-[1.06]",
        variant === "ghost" &&
          "bg-navy-800/60 text-ivory-100 border border-gold-500/25 hover:border-gold-400/50 hover:bg-navy-800/80",
        variant === "outline" &&
          "bg-ivory-50 text-navy-900 border-2 border-copper-600/30 hover:border-gold-500/60 hover:bg-gold-500/8",
        variant === "danger" &&
          "bg-garnet-600 text-ivory-50 hover:bg-garnet-500",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  );
}
