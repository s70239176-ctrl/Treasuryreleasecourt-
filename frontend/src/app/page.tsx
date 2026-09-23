"use client";

import { Landing } from "@/components/Landing";
import { CourtOverview } from "@/components/CourtOverview";
import { CharterPanel } from "@/components/CharterPanel";
import { WorkPackets } from "@/components/WorkPackets";
import { JuryActions } from "@/components/JuryActions";
import { StewardTools } from "@/components/StewardTools";
import { CONTRACT_ADDRESS } from "@/lib/genlayer";
import { AlertTriangle } from "lucide-react";

export default function Home() {
  if (!CONTRACT_ADDRESS) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
        <div className="flex items-start gap-3 rounded-xl border border-court-warn/30 bg-court-warn/10 px-5 py-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-court-warn" />
          <div>
            <p className="text-sm font-medium text-court-warn">
              No contract address configured
            </p>
            <p className="mt-1 text-sm text-court-muted">
              Set <code className="text-court-text">NEXT_PUBLIC_CONTRACT_ADDRESS</code>{" "}
              (and optionally <code className="text-court-text">NEXT_PUBLIC_CHAIN</code>)
              in <code className="text-court-text">frontend/.env.local</code> after
              deploying with <code className="text-court-text">npm run deploy</code>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Landing />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CourtOverview />
          <CharterPanel />
          <WorkPackets />
        </div>
        <div className="space-y-6">
          <JuryActions />
          <StewardTools />
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-court-muted">
        Treasury Release Court · built on GenLayer Intelligent Contracts
      </footer>
    </main>
  );
}
