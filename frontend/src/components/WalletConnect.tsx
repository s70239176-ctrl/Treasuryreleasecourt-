"use client";

import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/Button";
import { shortAddress } from "@/lib/utils";
import { Wallet } from "lucide-react";

export function WalletConnect() {
  const { address, connecting, error, connect } = useWallet();

  if (address) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-court-border bg-court-panel2 px-3 py-1.5 text-sm">
        <span className="h-2 w-2 rounded-full bg-court-done" />
        <span className="font-mono-tabular text-court-text">{shortAddress(address)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={connect} loading={connecting} variant="primary">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
      {error && <span className="text-xs text-court-notdone">{error}</span>}
    </div>
  );
}
