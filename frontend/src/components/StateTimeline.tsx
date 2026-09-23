"use client";

import { cn } from "@/lib/utils";
import type { CourtState } from "@/lib/genlayer";
import { Check, X } from "lucide-react";

const FLOW: CourtState[] = [
  "SETUP",
  "FUNDED",
  "FROZEN",
  "ADJUDICATED",
  "APPEAL_PENDING",
  "SETTLED",
];

const LABELS: Record<CourtState, string> = {
  SETUP: "Setup",
  FUNDED: "Funded",
  FROZEN: "Frozen",
  ADJUDICATED: "Adjudicated",
  APPEAL_PENDING: "Appeal Pending",
  SETTLED: "Settled",
  CANCELLED: "Cancelled",
};

export function StateTimeline({ state }: { state?: CourtState }) {
  if (state === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-court-notdone/30 bg-court-notdone/10 px-4 py-3 text-court-notdone">
        <X className="h-4 w-4" />
        <span className="text-sm font-medium">Court cancelled — funds returned to treasury</span>
      </div>
    );
  }

  const currentIdx = state ? FLOW.indexOf(state) : -1;

  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {FLOW.map((step, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        return (
          <div key={step} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "bg-court-blue border-court-blue text-white",
                  active &&
                    "border-court-blue text-court-blue shadow-glow bg-court-blue/10 animate-pulse",
                  !done && !active && "border-court-border text-court-muted"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] whitespace-nowrap",
                  done || active ? "text-court-text" : "text-court-muted"
                )}
              >
                {LABELS[step]}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <div
                className={cn(
                  "h-px w-10 mx-1.5 mb-4",
                  done ? "bg-court-blue" : "bg-court-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
