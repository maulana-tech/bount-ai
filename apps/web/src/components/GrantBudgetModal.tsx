"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useBudget } from "@/lib/budget";
import { signBudgetGrantWithPrivateKey } from "@/lib/grant";

/**
 * Grant budget nyata: user menandatangani spending-limit (ERC-7710) dengan
 * T3N identity-nya. Popup MetaMask tidak diperlukan. Hasilnya disimpan di budget
 * store dan dikirim ke `/spike` sebagai root delegation.
 */
export function GrantBudgetModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { grant } = useBudget();
  const [cap, setCap] = useState("5");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSessionKey, setHasSessionKey] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bountai.session");
      if (raw) {
        const session = JSON.parse(raw);
        setHasSessionKey(!!session.apiKey);
      }
    } catch {}
  }, []);

  async function submit() {
    setError(null);
    const amount = Number(cap);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("enter a valid amount");
      return;
    }
    
    let sessionApiKey = "";
    try {
      const raw = localStorage.getItem("bountai.session");
      if (raw) {
        const session = JSON.parse(raw);
        sessionApiKey = session.apiKey || "";
      }
    } catch {}

    setBusy(true);
    try {
      if (sessionApiKey) {
        const signed = await signBudgetGrantWithPrivateKey(
          sessionApiKey,
          Math.min(amount, 1000)
        );
        grant(signed.cap, signed.rootDelegation);
        onClose();
      } else {
        // Fallback for demo credentials
        grant(amount, null as any);
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "signing failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Grant budget">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          Sign a spending limit with your T3N identity. bount-AI may spend up to this cap
          on your behalf via ERC-7710 delegation — and nothing more.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Cap (USDC)
          </span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            className="w-full border border-line bg-panel px-3 py-2 font-mono text-sm tnum outline-none focus:border-gold"
          />
        </label>
        {error && <p className="font-mono text-xs text-danger">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={busy}
            className="rounded bg-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-hover disabled:opacity-50"
          >
            {busy
              ? "Signing..."
              : hasSessionKey
              ? "Sign grant with T3N DID"
              : "Confirm demo budget"}
          </button>
          <button
            onClick={onClose}
            className="rounded border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-panel-2"
          >
            Cancel
          </button>
        </div>
        <p className="font-mono text-[10px] text-ink-faint">
          Confidential signature · Base Sepolia · no gas. On-chain settlement still
          simulated.
        </p>
      </div>
    </Modal>
  );
}
