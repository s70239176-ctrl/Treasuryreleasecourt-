import { createClient, type GenLayerClient } from "genlayer-js";
import { studionet, studioDev } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export type ChainName = "studionet" | "studio-dev";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "") as `0x${string}`;

export const CHAIN_NAME = (process.env.NEXT_PUBLIC_CHAIN ??
  "studionet") as ChainName;

export function resolveChain(name: ChainName) {
  switch (name) {
    case "studionet":
      return studionet;
    case "studio-dev":
      return studioDev;
    default:
      throw new Error(`Unsupported chain "${name}"`);
  }
}

let readClient: GenLayerClient<typeof studionet> | null = null;

/** A read-only client, no wallet required. Used for polling get_court / views. */
export function getReadClient() {
  if (!readClient) {
    readClient = createClient({
      chain: resolveChain(CHAIN_NAME),
    }) as GenLayerClient<typeof studionet>;
  }
  return readClient;
}

/** A write-capable client bound to the connected wallet account + provider. */
export function getWriteClient(account: `0x${string}`, provider: any) {
  const client = createClient({
    chain: resolveChain(CHAIN_NAME),
    account,
    provider,
  });
  return client;
}

export interface WriteCall {
  functionName: string;
  args: unknown[];
  value?: bigint;
}

export type WriteStage =
  | "estimating"
  | "submitted"
  | "accepted"
  | "finalized"
  | "error";

export interface WriteProgress {
  stage: WriteStage;
  txId?: string;
  error?: string;
}

/**
 * Perform a real fee-estimated write against the deployed contract, driving
 * onProgress through estimating -> submitted -> accepted -> finalized.
 * Never mocked: every call here hits the live GenLayer network.
 */
export async function writeWithFees(
  account: `0x${string}`,
  provider: any,
  call: WriteCall,
  onProgress?: (p: WriteProgress) => void
): Promise<string> {
  const client = getWriteClient(account, provider);
  await client.connect(CHAIN_NAME);

  const writeRequest = {
    address: CONTRACT_ADDRESS,
    functionName: call.functionName,
    args: call.args,
    ...(call.value !== undefined ? { value: call.value } : {}),
  };

  onProgress?.({ stage: "estimating" });
  let estimate;
  try {
    estimate = await client.estimateTransactionFeesForWrite(writeRequest as any);
  } catch (err: any) {
    const message = extractErrorMessage(err);
    onProgress?.({ stage: "error", error: message });
    throw new Error(message);
  }

  let txId: string;
  try {
    txId = await client.writeContract({
      ...writeRequest,
      fees: {
        distribution: estimate.distribution,
        feeValue: estimate.feeValue,
      },
    } as any);
  } catch (err: any) {
    const message = extractErrorMessage(err);
    onProgress?.({ stage: "error", error: message });
    throw new Error(message);
  }

  onProgress?.({ stage: "submitted", txId });

  try {
    await client.waitForTransactionReceipt({
      hash: txId as `0x${string}`,
      status: TransactionStatus.ACCEPTED,
    });
    onProgress?.({ stage: "accepted", txId });

    await client.waitForTransactionReceipt({
      hash: txId as `0x${string}`,
      status: TransactionStatus.FINALIZED,
    });
    onProgress?.({ stage: "finalized", txId });
  } catch (err: any) {
    const message = extractErrorMessage(err);
    onProgress?.({ stage: "error", txId, error: message });
    throw new Error(message);
  }

  return txId;
}

/** Read a view function from the contract, always against "accepted" state. */
export async function readView<T = unknown>(
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  const client = getReadClient();
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    stateStatus: "accepted",
  } as any);
  return result as T;
}

/** Best-effort extraction of a clean, user-facing message from a genlayer-js error. */
export function extractErrorMessage(err: any): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  // genlayer-js surfaces contract UserError text in various shapes depending
  // on transport (RPC error, VM revert, provider rejection).
  const candidates = [
    err?.data?.message,
    err?.data?.error,
    err?.error?.message,
    err?.cause?.message,
    err?.shortMessage,
    err?.message,
  ].filter(Boolean);
  const raw = candidates[0] ?? "Transaction failed";
  // Strip common RPC prefixes so UserError text reads cleanly.
  return String(raw).replace(/^execution reverted:\s*/i, "").trim();
}

// ---------------------------------------------------------------------------
// Normalizers: raw genlayer-js dict returns -> typed frontend shapes
// ---------------------------------------------------------------------------

export type CourtState =
  | "SETUP"
  | "FUNDED"
  | "FROZEN"
  | "ADJUDICATED"
  | "APPEAL_PENDING"
  | "SETTLED"
  | "CANCELLED";

export interface CommitteeMember {
  address: string;
  kind: "human" | "agent";
}

export interface Court {
  steward: string;
  treasury: string;
  beneficiary: string;
  tranche: bigint;
  genBalance: bigint;
  appealBond: bigint;
  submissionWindow: bigint;
  appealWindow: bigint;
  funded: boolean;
  submissionsFrozen: boolean;
  settled: boolean;
  cancelled: boolean;
  appealUsed: boolean;
  state: CourtState;
  openedAt: bigint;
  fundedAt: bigint;
  frozenAt: bigint;
  appealDeadline: bigint;
  packetCount: number;
  juryRound: number;
  evidenceDigest: string;
  lastVerdict: "" | "DONE" | "NOT_DONE";
  lastScore: number;
  lastReason: string;
  appellant: string;
  appealBondHeld: bigint;
  committee: CommitteeMember[];
}

export function normalizeCourt(raw: any): Court {
  return {
    steward: raw.steward,
    treasury: raw.treasury,
    beneficiary: raw.beneficiary,
    tranche: BigInt(raw.tranche ?? 0),
    genBalance: BigInt(raw.gen_balance ?? 0),
    appealBond: BigInt(raw.appeal_bond ?? 0),
    submissionWindow: BigInt(raw.submission_window ?? 0),
    appealWindow: BigInt(raw.appeal_window ?? 0),
    funded: Boolean(raw.funded),
    submissionsFrozen: Boolean(raw.submissions_frozen),
    settled: Boolean(raw.settled),
    cancelled: Boolean(raw.cancelled),
    appealUsed: Boolean(raw.appeal_used),
    state: raw.state as CourtState,
    openedAt: BigInt(raw.opened_at ?? 0),
    fundedAt: BigInt(raw.funded_at ?? 0),
    frozenAt: BigInt(raw.frozen_at ?? 0),
    appealDeadline: BigInt(raw.appeal_deadline ?? 0),
    packetCount: Number(raw.packet_count ?? 0),
    juryRound: Number(raw.jury_round ?? 0),
    evidenceDigest: raw.evidence_digest ?? "",
    lastVerdict: (raw.last_verdict ?? "") as Court["lastVerdict"],
    lastScore: Number(raw.last_score ?? 0),
    lastReason: raw.last_reason ?? "",
    appellant: raw.appellant,
    appealBondHeld: BigInt(raw.appeal_bond_held ?? 0),
    committee: (raw.committee ?? []).map((c: any) => ({
      address: c.address,
      kind: c.kind,
    })),
  };
}

export interface WorkPacket {
  packetId: number;
  author: string;
  kind: "human" | "agent";
  title: string;
  body: string;
  sourceUrl: string;
  submittedAt: bigint;
}

export function normalizePackets(raw: any[]): WorkPacket[] {
  return (raw ?? []).map((p) => ({
    packetId: Number(p.packet_id),
    author: p.author,
    kind: p.kind,
    title: p.title,
    body: p.body,
    sourceUrl: p.source_url,
    submittedAt: BigInt(p.submitted_at ?? 0),
  }));
}

export interface VerdictRecord {
  roundNo: number;
  verdict: "DONE" | "NOT_DONE";
  score: number;
  reason: string;
  evidenceDigest: string;
  decidedAt: bigint;
}

export function normalizeVerdicts(raw: any[]): VerdictRecord[] {
  return (raw ?? []).map((v) => ({
    roundNo: Number(v.round_no),
    verdict: v.verdict,
    score: Number(v.score),
    reason: v.reason,
    evidenceDigest: v.evidence_digest,
    decidedAt: BigInt(v.decided_at ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// GEN <-> wei formatting
// ---------------------------------------------------------------------------

export function weiToGen(wei: bigint, decimals = 4): string {
  const negative = wei < BigInt(0);
  const abs = negative ? -wei : wei;
  const whole = abs / BigInt(1e18);
  const frac = abs % BigInt(1e18);
  const fracStr = frac.toString().padStart(18, "0").slice(0, decimals);
  const trimmed = fracStr.replace(/0+$/, "");
  const out = trimmed ? `${whole}.${trimmed}` : `${whole}`;
  return negative ? `-${out}` : out;
}

export function genToWei(gen: string | number): bigint {
  const [whole, frac = ""] = String(gen).split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  return BigInt(whole || "0") * BigInt(1e18) + BigInt(fracPadded || "0");
}
