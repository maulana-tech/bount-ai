"use client";

import { useState } from "react";
import type { SpikeResult } from "@concierge/shared";
import { Navbar } from "@/components/Navbar";
import { BudgetMeter } from "@/components/BudgetMeter";
import { DelegationChain } from "@/components/DelegationChain";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ResultPanel } from "@/components/ResultPanel";
import { PromptBar } from "@/components/PromptBar";
import { MOCK_BUDGET, MOCK_DELEGATION, MOCK_FEED } from "@/lib/mock";
import { runSpike } from "@/lib/agent";
import { getCustomAgents } from "@/lib/customAgents";

/**
 * Dashboard. Tanpa hasil agent, menampilkan data mock (membuktikan arah visual).
 * Submit di PromptBar memanggil service agent (/spike) dan merender jejak NYATA:
 * delegasi + redelegasi (dengan caveat) + pembayaran x402. Lihat PROJECT.md §11.
 */
export default function Page() {
  const [result, setResult] = useState<SpikeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budget = result?.budget ?? MOCK_BUDGET;
  const delegation = result?.delegation ?? MOCK_DELEGATION;
  const feed = result?.activity ?? MOCK_FEED;

  async function handleRun(request: string) {
    setLoading(true);
    setError(null);
    try {
      setResult(await runSpike(request, getCustomAgents()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">
        <div className="mb-6">
          <BudgetMeter
            spent={budget.spent}
            cap={budget.cap}
            onRevoke={() => setResult(null)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <DelegationChain nodes={delegation} />
            <ActivityFeed events={feed} />
          </div>
          <ResultPanel outputs={result?.outputs ?? []} />
        </div>

        {error && (
          <p className="mt-4 font-mono text-xs text-danger">
            agent error: {error} — is the agent running? (`pnpm dev:agent`)
          </p>
        )}

        <div className="mt-6">
          <PromptBar onSubmit={handleRun} loading={loading} />
        </div>
      </main>
    </>
  );
}
