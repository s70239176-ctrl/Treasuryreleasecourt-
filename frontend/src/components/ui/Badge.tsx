import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "blue" | "violet" | "done" | "notdone" | "warn" | "muted";
}

export function Badge({ className, tone = "muted", ...props }: BadgeProps) {
  const tones: Record<string, string> = {
    blue: "bg-court-blue/15 text-court-blue border-court-blue/30",
    violet: "bg-court-violet/15 text-court-violet border-court-violet/30",
    done: "bg-court-done/15 text-court-done border-court-done/30",
    notdone: "bg-court-notdone/15 text-court-notdone border-court-notdone/30",
    warn: "bg-court-warn/15 text-court-warn border-court-warn/30",
    muted: "bg-white/5 text-court-muted border-court-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
