"use client";

import { useCallback, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Send, Coins } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useInvalidateCourt } from "@/hooks/useCourt";
import { writeWithFees, extractErrorMessage, type WriteCall, type WriteProgress, type WriteStage } from "@/lib/genlayer";
import { cn, shortAddress } from "@/lib/utils";

const STAGES: { key: WriteStage; label: string }[] = [
  { key: "estimating", label: "Estimating fees" },
  { key: "submitted", label: "Submitted" },
  { key: "accepted", label: "Accepted" },
  { key: "finalized", label: "Finalized" },
];

function stageIndex(stage?: WriteStage) {
  return STAGES.findIndex((s) => s.key === stage);
}

/**
 * Shared hook for every write action in the app. Drives fee estimation,
 * submission, and consensus waiting, and exposes progress state a panel can
 * render inline. Invalidates court/packets/verdicts queries on success.
 */
export function useWriteAction() {
  const { address, provider } = useWallet();
  const invalidate = useInvalidateCourt();
  const [progress, setProgress] = useState<WriteProgress | null>(null);
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async (call: WriteCall) => {
      if (!address || !provider) {
        setProgress({ stage: "error", error: "Connect a wallet first." });
        return;
      }
      setPending(true);
      setProgress({ stage: "estimating" });
      try {
        await writeWithFees(address as `0x${string}`, provider, call, (p) =>
          setProgress(p)
        );
        invalidate();
      } catch (err: any) {
        setProgress({ stage: "error", error: extractErrorMessage(err) });
      } finally {
        setPending(false);
      }
    },
    [address, provider, invalidate]
  );

  const reset = useCallback(() => setProgress(null), []);

  return { run, progress, pending, reset, walletConnected: Boolean(address) };
}

export function TxStatusInline({ progress }: { progress: WriteProgress | null }) {
  if (!progress) return null;

  if (progress.stage === "error") {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-court-notdone/30 bg-court-notdone/10 px-3 py-2 text-sm text-court-notdone">
        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{progress.error}</span>
      </div>
    );
  }

  const idx = stageIndex(progress.stage);

  return (
    <div className="mt-3 rounded-lg border border-court-border bg-court-panel2 px-3 py-2.5">
      <div className="flex items-center gap-3">
        {STAGES.map((s, i) => {
          const done = i < idx || progress.stage === "finalized";
          const active = i === idx && progress.stage !== "finalized";
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-court-done" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-court-blue" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-court-border" />
              )}
              <span
                className={cn(
                  "text-xs",
                  done ? "text-court-done" : active ? "text-court-blue" : "text-court-muted"
                )}
              >
                {s.label}
              </span>
              {i < STAGES.length - 1 && <span className="w-3 h-px bg-court-border ml-1.5" />}
            </div>
          );
        })}
      </div>
      {progress.txId && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-court-muted font-mono-tabular">
          <Send className="h-3 w-3" />
          tx {shortAddress(progress.txId, 6)}
        </div>
      )}
    </div>
  );
}

export function FeeNote() {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-court-muted">
      <Coins className="h-3 w-3" />
      Fees are estimated live before every write.
    </div>
  );
}
