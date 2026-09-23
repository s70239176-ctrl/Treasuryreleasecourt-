"use client";

import { useCallback, useEffect, useState } from "react";

export interface WalletState {
  address: `0x${string}` | null;
  connecting: boolean;
  error: string | null;
  provider: any | null;
}

/**
 * Minimal EIP-1193 wallet hook. Talks directly to window.ethereum — no
 * wallet-connect abstraction layer, since genlayer-js's createClient()
 * accepts an EIP-1193 provider directly.
 */
export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    connecting: false,
    error: null,
    provider: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) return;

    setState((s) => ({ ...s, provider: eth }));

    eth
      .request({ method: "eth_accounts" })
      .then((accs: string[]) => {
        if (accs?.[0]) {
          setState((s) => ({ ...s, address: accs[0] as `0x${string}` }));
        }
      })
      .catch(() => {});

    const handleAccountsChanged = (accs: string[]) => {
      setState((s) => ({
        ...s,
        address: (accs?.[0] as `0x${string}`) ?? null,
      }));
    };
    eth.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setState((s) => ({
        ...s,
        error: "No wallet found. Install an EIP-1193 wallet extension (e.g. MetaMask).",
      }));
      return;
    }
    const eth = (window as any).ethereum;
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const accs: string[] = await eth.request({ method: "eth_requestAccounts" });
      setState((s) => ({
        ...s,
        address: (accs?.[0] as `0x${string}`) ?? null,
        connecting: false,
        provider: eth,
      }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err?.message ?? "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({ ...s, address: null }));
  }, []);

  return { ...state, connect, disconnect };
}
