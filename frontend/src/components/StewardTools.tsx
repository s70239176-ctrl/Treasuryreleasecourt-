"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { TxStatusInline, useWriteAction } from "@/components/TxStatus";
import { useCourt } from "@/hooks/useCourt";
import { weiToGen } from "@/lib/genlayer";
import { Wallet, Ban, UserPlus, Landmark } from "lucide-react";

export function StewardTools() {
  const { data: court } = useCourt();
  const fundAction = useWriteAction();
  const cancelAction = useWriteAction();
  const addMemberAction = useWriteAction();

  const [memberAddr, setMemberAddr] = useState("");
  const [memberKind, setMemberKind] = useState<"human" | "agent">("human");

  if (!court) return null;

  const canFund = court.state === "SETUP";
  const canCancel = ["SETUP", "FUNDED", "FROZEN"].includes(court.state);
  const canAddMember = court.state === "SETUP";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-court-blue" />
          Steward Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-court-border/60 px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <Wallet className="mt-0.5 h-4 w-4 text-court-blue" />
            <div className="flex-1">
              <div className="text-sm font-medium text-court-text">Fund court</div>
              <p className="mt-0.5 text-xs text-court-muted">
                Sends the exact tranche ({weiToGen(court.tranche)} GEN) into escrow.
              </p>
              <div className="mt-2.5">
                <Button
                  disabled={!canFund}
                  loading={fundAction.pending}
                  onClick={() =>
                    fundAction.run({
                      functionName: "fund",
                      args: [],
                      value: court.tranche,
                    })
                  }
                >
                  Fund {weiToGen(court.tranche)} GEN
                </Button>
                <TxStatusInline progress={fundAction.progress} />
              </div>
            </div>
          </div>
        </div>

        {canAddMember && (
          <div className="rounded-lg border border-court-border/60 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <UserPlus className="mt-0.5 h-4 w-4 text-court-violet" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-court-text">Add committee member</div>
                <p className="mt-0.5 text-xs text-court-muted">
                  Only available while the court is in SETUP.
                </p>
                <div className="mt-2.5 space-y-2">
                  <div>
                    <Label htmlFor="member_addr">Address</Label>
                    <Input
                      id="member_addr"
                      value={memberAddr}
                      onChange={(e) => setMemberAddr(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-court-muted">
                      <input
                        type="radio"
                        name="kind"
                        checked={memberKind === "human"}
                        onChange={() => setMemberKind("human")}
                      />
                      Human
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-court-muted">
                      <input
                        type="radio"
                        name="kind"
                        checked={memberKind === "agent"}
                        onChange={() => setMemberKind("agent")}
                      />
                      Agent
                    </label>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={!memberAddr.trim()}
                    loading={addMemberAction.pending}
                    onClick={() =>
                      addMemberAction.run({
                        functionName: "add_committee_member",
                        args: [memberAddr, memberKind],
                      })
                    }
                  >
                    Add member
                  </Button>
                  <TxStatusInline progress={addMemberAction.progress} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-court-notdone/20 px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <Ban className="mt-0.5 h-4 w-4 text-court-notdone" />
            <div className="flex-1">
              <div className="text-sm font-medium text-court-text">Cancel court</div>
              <p className="mt-0.5 text-xs text-court-muted">
                Only before any jury verdict. Refunds the full balance to treasury.
              </p>
              <div className="mt-2.5">
                <Button
                  variant="danger"
                  disabled={!canCancel}
                  loading={cancelAction.pending}
                  onClick={() => cancelAction.run({ functionName: "cancel", args: [] })}
                >
                  Cancel court
                </Button>
                <TxStatusInline progress={cancelAction.progress} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
