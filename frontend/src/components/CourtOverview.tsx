"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateTimeline } from "@/components/StateTimeline";
import { useCourt } from "@/hooks/useCourt";
import { weiToGen, CONTRACT_ADDRESS } from "@/lib/genlayer";
import { shortAddress, formatDuration } from "@/lib/utils";
import { Gavel, ShieldCheck, Users, Clock, ScrollText } from "lucide-react";

function useCountdown(deadlineUnix?: bigint) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!deadlineUnix) {
      setRemaining(null);
      return;
    }
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      setRemaining(Number(deadlineUnix) - now);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineUnix]);
  return remaining;
}

export function CourtOverview() {
  const { data: court, isLoading, error } = useCourt();
  const remaining = useCountdown(
    court?.state === "ADJUDICATED" ? court.appealDeadline : undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-4 w-4 text-court-blue" />
          Court Dashboard
        </CardTitle>
        {court && (
          <Badge tone={court.state === "SETTLED" ? "done" : "blue"}>{court.state}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-1/2 rounded bg-court-panel2" />
            <div className="h-4 w-1/3 rounded bg-court-panel2" />
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-lg border border-court-notdone/30 bg-court-notdone/10 px-3 py-2 text-sm text-court-notdone">
            Could not reach the contract at {shortAddress(CONTRACT_ADDRESS)}. Confirm
            NEXT_PUBLIC_CONTRACT_ADDRESS and NEXT_PUBLIC_CHAIN are set correctly.
          </div>
        )}

        {court && (
          <>
            <StateTimeline state={court.state} />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Stat label="Tranche" value={`${weiToGen(court.tranche)} GEN`} />
              <Stat label="Held balance" value={`${weiToGen(court.genBalance)} GEN`} />
              <Stat label="Appeal bond" value={`${weiToGen(court.appealBond)} GEN`} />
              <Stat label="Beneficiary" value={shortAddress(court.beneficiary)} mono />
              <Stat label="Treasury" value={shortAddress(court.treasury)} mono />
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-court-border bg-court-panel2 px-3 py-2.5">
              <ScrollText className="h-4 w-4 mt-0.5 text-court-violet shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-court-muted">Evidence digest (frozen)</div>
                <div className="truncate font-mono text-xs text-court-text">
                  {court.evidenceDigest || "not yet frozen"}
                </div>
              </div>
            </div>

            {court.lastVerdict && (
              <div
                className={
                  "rounded-lg border px-4 py-3 " +
                  (court.lastVerdict === "DONE"
                    ? "border-court-done/30 bg-court-done/10"
                    : "border-court-notdone/30 bg-court-notdone/10")
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className={`h-4 w-4 ${
                        court.lastVerdict === "DONE" ? "text-court-done" : "text-court-notdone"
                      }`}
                    />
                    <span
                      className={`font-semibold text-sm ${
                        court.lastVerdict === "DONE" ? "text-court-done" : "text-court-notdone"
                      }`}
                    >
                      {court.lastVerdict}
                    </span>
                    <span className="text-xs text-court-muted">
                      round {court.juryRound} · score {court.lastScore}/100
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-sm text-court-text/90">{court.lastReason}</p>
              </div>
            )}

            {court.state === "ADJUDICATED" && remaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-court-warn" />
                <span className="text-court-muted">
                  Appeal window{" "}
                  {remaining > 0 ? (
                    <>closes in <span className="text-court-warn font-medium">{formatDuration(remaining)}</span></>
                  ) : (
                    <span className="text-court-done font-medium">closed — ready to settle</span>
                  )}
                </span>
              </div>
            )}

            {court.state === "APPEAL_PENDING" && (
              <div className="flex items-center gap-2 text-sm text-court-warn">
                <Clock className="h-4 w-4" />
                Appeal bond of {weiToGen(court.appealBondHeld)} GEN held from{" "}
                {shortAddress(court.appellant)} — awaiting reread.
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-court-muted">
                <Users className="h-3.5 w-3.5" />
                Committee
              </div>
              <div className="flex flex-wrap gap-2">
                {court.committee.map((m) => (
                  <Badge key={m.address} tone={m.kind === "agent" ? "violet" : "blue"}>
                    {m.kind === "agent" ? "🤖" : "👤"} {shortAddress(m.address)}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-court-muted">{label}</div>
      <div className={`text-sm font-medium text-court-text ${mono ? "font-mono-tabular" : ""}`}>
        {value}
      </div>
    </div>
  );
}
