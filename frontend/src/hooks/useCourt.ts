"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  readView,
  normalizeCourt,
  normalizePackets,
  normalizeVerdicts,
  type Court,
  type WorkPacket,
  type VerdictRecord,
} from "@/lib/genlayer";

const ACTIVE_POLL_MS = 4000;

function isTerminal(state?: string) {
  return state === "SETTLED" || state === "CANCELLED";
}

export function useCourt() {
  const query = useQuery<Court>({
    queryKey: ["court"],
    queryFn: async () => normalizeCourt(await readView("get_court")),
    refetchInterval: (q) => (isTerminal(q.state.data?.state) ? false : ACTIVE_POLL_MS),
  });
  return query;
}

export function usePackets() {
  const court = useCourt();
  return useQuery<WorkPacket[]>({
    queryKey: ["packets"],
    queryFn: async () => normalizePackets(await readView<any[]>("get_packets")),
    refetchInterval: isTerminal(court.data?.state) ? false : ACTIVE_POLL_MS,
  });
}

export function useVerdicts() {
  const court = useCourt();
  return useQuery<VerdictRecord[]>({
    queryKey: ["verdicts"],
    queryFn: async () => normalizeVerdicts(await readView<any[]>("get_verdicts")),
    refetchInterval: isTerminal(court.data?.state) ? false : ACTIVE_POLL_MS,
  });
}

export function useCharter() {
  return useQuery<string>({
    queryKey: ["charter"],
    queryFn: async () => readView<string>("get_charter"),
    staleTime: Infinity, // immutable once deployed
  });
}

/** Call after any write to force-refresh all court-derived queries. */
export function useInvalidateCourt() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["court"] });
    qc.invalidateQueries({ queryKey: ["packets"] });
    qc.invalidateQueries({ queryKey: ["verdicts"] });
  };
}
