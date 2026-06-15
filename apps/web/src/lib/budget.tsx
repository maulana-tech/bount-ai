"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  ActivityEvent,
  DelegationNode,
  SpikeResult,
} from "@concierge/shared";
import type { SerializedDelegation } from "./grant";

/**
 * Budget store sesi (client-side). Sumber kebenaran tunggal untuk BudgetMeter,
 * dipakai dashboard ⇄ chat. Stage 1: `cap` = free credit demo ($5), `spent`
 * diakumulasi dari tiap `SpikeResult` nyata. Stage 2: `grant()` mengganti `cap`
 * dengan plafon yang ditandatangani wallet user (root delegation ERC-7710).
 */
export const FREE_CREDIT_USD = 5;

interface BudgetState {
  cap: number;
  spent: number;
  /** true bila user sudah grant lewat wallet (Stage 2); false = free credit demo */
  granted: boolean;
  /** root delegation ditandatangani wallet user — dikirim ke /spike saat granted */
  rootDelegation: SerializedDelegation | null;
  delegation: DelegationNode[] | null;
  activity: ActivityEvent[];
}

interface BudgetCtx extends BudgetState {
  remaining: number;
  applySpike: (r: SpikeResult) => void;
  grant: (cap: number, rootDelegation: SerializedDelegation) => void;
  revoke: () => void;
}

const KEY = "venai.budget";
const DEFAULT: BudgetState = {
  cap: FREE_CREDIT_USD,
  spent: 0,
  granted: false,
  rootDelegation: null,
  delegation: null,
  activity: [],
};

const Ctx = createContext<BudgetCtx | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetState>(DEFAULT);

  // Hydrate dari localStorage di client (hindari mismatch hidrasi SSR).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  // Persist tiap perubahan.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const applySpike = useCallback((r: SpikeResult) => {
    const stamp = Date.now();
    setState((s) => ({
      ...s,
      spent: Number((s.spent + r.budget.spent).toFixed(6)),
      delegation: r.delegation,
      activity: [
        ...r.activity.map((e, i) => ({ ...e, id: `${e.id}-${stamp}-${i}` })),
        ...s.activity,
      ].slice(0, 20),
    }));
  }, []);

  const grant = useCallback(
    (cap: number, rootDelegation: SerializedDelegation) => {
      // Grant baru = reset spend (plafon baru ditandatangani user).
      setState((s) => ({ ...s, cap, granted: true, rootDelegation, spent: 0 }));
    },
    [],
  );

  // Revoke = cabut grant + reset demo ke free credit bersih.
  const revoke = useCallback(() => setState(DEFAULT), []);

  const remaining = Math.max(state.cap - state.spent, 0);

  return (
    <Ctx.Provider value={{ ...state, remaining, applySpike, grant, revoke }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBudget(): BudgetCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
