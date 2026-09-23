"use client";

import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from "@/hooks/useWallet";
import { Gavel, FileText, Scale, ShieldAlert, Coins } from "lucide-react";

const STEPS = [
  { icon: FileText, label: "Charter", desc: "A written, immutable definition of DONE." },
  { icon: Gavel, label: "Work", desc: "Humans and agents file packets with live URLs." },
  { icon: Scale, label: "AI Jury", desc: "Live consensus reads the charter and evidence." },
  { icon: ShieldAlert, label: "Re-read", desc: "A minority can bond to force a second look." },
  { icon: Coins, label: "GEN moves", desc: "Funds release only after judgment, on-chain." },
];

export function Landing() {
  const { address } = useWallet();

  return (
    <div className="mb-10 rounded-2xl border border-court-border bg-gradient-to-b from-court-panel to-transparent px-6 py-8 sm:px-10 sm:py-10">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-court-violet">
            <Gavel className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Treasury Release Court
            </span>
          </div>
          <h1 className="max-w-2xl text-2xl font-semibold text-court-text sm:text-3xl">
            A DAO tranche sits in escrow until an AI jury judges the work{" "}
            <span className="text-court-blue">DONE</span> against a written charter.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-court-muted">
            Not a multisig vote dressed up as review. Judgment over natural language,
            live URLs, and equivalence consensus — with a built-in appeal for the
            minority.
          </p>
        </div>
        <WalletConnect />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            className="rounded-xl border border-court-border bg-court-panel2/60 px-3 py-3"
          >
            <div className="flex items-center gap-1.5 text-court-blue">
              <s.icon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold text-court-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-1.5 text-xs font-medium text-court-text">{s.label}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-court-muted">{s.desc}</div>
          </div>
        ))}
      </div>

      {!address && (
        <p className="mt-6 text-xs text-court-muted">
          Connect a wallet to fund the court, file work, or act as a jury trigger.
          Reads work without a wallet.
        </p>
      )}
    </div>
  );
}
