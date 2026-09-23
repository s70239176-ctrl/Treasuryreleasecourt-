"use client";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-court-border bg-court-panel2 px-3 py-2 text-sm text-court-text",
        "placeholder:text-court-muted focus:outline-none focus:ring-2 focus:ring-court-blue/40 focus:border-court-blue/50",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-court-border bg-court-panel2 px-3 py-2 text-sm text-court-text",
        "placeholder:text-court-muted focus:outline-none focus:ring-2 focus:ring-court-blue/40 focus:border-court-blue/50",
        "min-h-[90px] resize-y",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium text-court-muted mb-1.5", className)}
      {...props}
    />
  );
}
