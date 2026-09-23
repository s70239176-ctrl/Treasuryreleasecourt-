"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useCharter } from "@/hooks/useCourt";
import { BookLock } from "lucide-react";

export function CharterPanel() {
  const { data: charter, isLoading, error } = useCharter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookLock className="h-4 w-4 text-court-violet" />
          Charter (Immutable)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="h-16 animate-pulse rounded bg-court-panel2" />
        )}
        {error && !isLoading && (
          <p className="text-sm text-court-notdone">Could not load charter.</p>
        )}
        {charter && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-court-text/90">
            {charter}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
