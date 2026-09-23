"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-b from-court-blue to-[#3b63d9] text-white shadow-glow hover:brightness-110",
    secondary:
      "bg-court-panel2 text-court-text border border-court-border hover:border-court-blue/50",
    danger:
      "bg-gradient-to-b from-court-notdone to-[#dc4a4a] text-white hover:brightness-110",
    ghost: "bg-transparent text-court-muted hover:text-court-text",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
        "transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
