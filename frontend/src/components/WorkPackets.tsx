"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { TxStatusInline, useWriteAction } from "@/components/TxStatus";
import { useCourt, usePackets } from "@/hooks/useCourt";
import { shortAddress, formatTimestamp } from "@/lib/utils";
import { FileText, Lock, Link as LinkIcon, Send } from "lucide-react";

export function WorkPackets() {
  const { data: court } = useCourt();
  const { data: packets, isLoading } = usePackets();
  const submitAction = useWriteAction();
  const freezeAction = useWriteAction();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const canSubmit = court?.state === "FUNDED";
  const canFreeze = court?.state === "FUNDED" && (court?.packetCount ?? 0) > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await submitAction.run({
      functionName: "submit_work",
      args: [title, body, sourceUrl],
    });
    setTitle("");
    setBody("");
    setSourceUrl("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-court-blue" />
          Work Packets
        </CardTitle>
        {court && <Badge tone="muted">{court.packetCount} filed</Badge>}
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-10 rounded bg-court-panel2" />
            <div className="h-10 rounded bg-court-panel2" />
          </div>
        )}

        {packets && packets.length === 0 && !isLoading && (
          <p className="text-sm text-court-muted">
            No work has been filed yet. Committee members can submit below once the
            court is funded.
          </p>
        )}

        {packets && packets.length > 0 && (
          <ul className="space-y-3">
            {packets.map((p) => (
              <li
                key={p.packetId}
                className="rounded-lg border border-court-border bg-court-panel2 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge tone={p.kind === "agent" ? "violet" : "blue"}>
                      {p.kind === "agent" ? "🤖 agent" : "👤 human"}
                    </Badge>
                    <span className="truncate text-sm font-medium text-court-text">
                      {p.title}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-court-muted font-mono-tabular">
                    {shortAddress(p.author)}
                  </span>
                </div>
                {p.body && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-court-muted">{p.body}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  {p.sourceUrl ? (
                    <a
                      href={p.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-court-blue hover:underline"
                    >
                      <LinkIcon className="h-3 w-3" />
                      {p.sourceUrl}
                    </a>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-court-muted">
                    {formatTimestamp(p.submittedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {canSubmit && (
          <form onSubmit={onSubmit} className="space-y-3 border-t border-court-border pt-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Public treasury dashboard v1"
                required
              />
            </div>
            <div>
              <Label htmlFor="body">Description</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What was built and how it satisfies the charter"
              />
            </div>
            <div>
              <Label htmlFor="source_url">Source URL (live evidence)</Label>
              <Input
                id="source_url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://your-live-demo.example.com"
              />
            </div>
            <Button type="submit" loading={submitAction.pending} disabled={!title.trim()}>
              <Send className="h-4 w-4" />
              Submit work packet
            </Button>
            <TxStatusInline progress={submitAction.progress} />
          </form>
        )}

        {court && (canSubmit || court.state === "FROZEN") && (
          <div className="border-t border-court-border pt-4">
            <Button
              variant="secondary"
              disabled={!canFreeze}
              loading={freezeAction.pending}
              onClick={() => freezeAction.run({ functionName: "freeze_submissions", args: [] })}
            >
              <Lock className="h-4 w-4" />
              {court.state === "FROZEN" ? "Submissions frozen" : "Freeze submissions"}
            </Button>
            {!canFreeze && court.state === "FUNDED" && (
              <p className="mt-1.5 text-xs text-court-muted">
                At least one packet must be filed before freezing.
              </p>
            )}
            <TxStatusInline progress={freezeAction.progress} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
