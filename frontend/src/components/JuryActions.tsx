"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TxStatusInline, FeeNote, useWriteAction } from "@/components/TxStatus";
import { useCourt, useVerdicts } from "@/hooks/useCourt";
import { weiToGen } from "@/lib/genlayer";
import { Scale, ShieldAlert, RefreshCw, Landmark } from "lucide-react";
import { useState } from "react";

export function JuryActions() {
  const { data: court } = useCourt();
  const { data: verdicts } = useVerdicts();

  const scoreAction = useWriteAction();
  const appealAction = useWriteAction();
  const rereadAction = useWriteAction();
  const settleAction = useWriteAction();

  const [confirmAppeal, setConfirmAppeal] = useState(false);

  if (!court) return null;

  const now = Math.floor(Date.now() / 1000);
  const appealWindowOpen =
    court.state === "ADJUDICATED" && now <= Number(court.appealDeadline);
  const appealWindowClosed =
    court.state === "ADJUDICATED" && now > Number(court.appealDeadline);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-court-violet" />
          Jury Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score work — first jury */}
        <ActionRow
          icon={<Scale className="h-4 w-4" />}
          title="Score work"
          description="Runs the first AI jury: fetches every source URL and reaches consensus on DONE vs NOT_DONE against the charter."
        >
          <Button
            disabled={court.state !== "FROZEN"}
            loading={scoreAction.pending}
            onClick={() => scoreAction.run({ functionName: "score_work", args: [] })}
          >
            Run first jury
          </Button>
          <TxStatusInline progress={scoreAction.progress} />
        </ActionRow>

        {/* Appeal */}
        <ActionRow
          icon={<ShieldAlert className="h-4 w-4" />}
          title="Appeal"
          description={`A minority committee member can post the exact ${weiToGen(
            court.appealBond
          )} GEN bond to force a second jury to re-read the same frozen evidence.`}
        >
          {!confirmAppeal ? (
            <Button
              variant="secondary"
              disabled={!appealWindowOpen || court.appealUsed}
              onClick={() => setConfirmAppeal(true)}
            >
              Post appeal bond
            </Button>
          ) : (
            <div className="rounded-lg border border-court-warn/30 bg-court-warn/10 px-3 py-2.5">
              <p className="text-sm text-court-warn">
                Confirm: send exactly {weiToGen(court.appealBond)} GEN to force a
                reread? The bond is forfeit to treasury if the verdict holds.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="danger"
                  loading={appealAction.pending}
                  onClick={async () => {
                    await appealAction.run({
                      functionName: "appeal",
                      args: [],
                      value: court.appealBond,
                    });
                    setConfirmAppeal(false);
                  }}
                >
                  Confirm appeal
                </Button>
                <Button variant="ghost" onClick={() => setConfirmAppeal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <TxStatusInline progress={appealAction.progress} />
        </ActionRow>

        {/* Reread */}
        <ActionRow
          icon={<RefreshCw className="h-4 w-4" />}
          title="Reread"
          description="Second jury re-reads the same frozen evidence digest. Bond returns to the appellant if the verdict flips, else it's forfeit to treasury."
        >
          <Button
            disabled={court.state !== "APPEAL_PENDING"}
            loading={rereadAction.pending}
            onClick={() => rereadAction.run({ functionName: "reread", args: [] })}
          >
            Run second jury
          </Button>
          <TxStatusInline progress={rereadAction.progress} />
        </ActionRow>

        {/* Settle */}
        <ActionRow
          icon={<Landmark className="h-4 w-4" />}
          title="Settle"
          description={
            court.lastVerdict === "DONE"
              ? "Moves the tranche to the beneficiary; any surplus balance returns to treasury."
              : "Moves the full remaining balance to treasury."
          }
        >
          <Button
            disabled={!appealWindowClosed || court.appealBondHeld > BigInt(0)}
            loading={settleAction.pending}
            onClick={() => settleAction.run({ functionName: "settle", args: [] })}
          >
            Settle court
          </Button>
          {court.state === "ADJUDICATED" && !appealWindowClosed && (
            <p className="mt-1.5 text-xs text-court-muted">
              Waiting for the appeal window to close before settlement is enabled.
            </p>
          )}
          <TxStatusInline progress={settleAction.progress} />
        </ActionRow>

        <FeeNote />

        {verdicts && verdicts.length > 0 && (
          <div className="border-t border-court-border pt-4">
            <div className="mb-2 text-xs font-medium text-court-muted">Verdict history</div>
            <ul className="space-y-2">
              {verdicts.map((v) => (
                <li
                  key={v.roundNo}
                  className="flex items-center justify-between rounded-lg border border-court-border bg-court-panel2 px-3 py-2 text-sm"
                >
                  <span className="text-court-muted">Round {v.roundNo}</span>
                  <span
                    className={
                      v.verdict === "DONE" ? "text-court-done" : "text-court-notdone"
                    }
                  >
                    {v.verdict} · {v.score}/100
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-court-border/60 px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-court-blue">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-court-text">{title}</div>
          <p className="mt-0.5 text-xs text-court-muted">{description}</p>
          <div className="mt-2.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
