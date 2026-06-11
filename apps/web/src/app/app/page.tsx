"use client";

import { Navbar } from "@/components/Navbar";
import { BudgetMeter } from "@/components/BudgetMeter";
import { DelegationChain } from "@/components/DelegationChain";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ResultPanel } from "@/components/ResultPanel";
import { PromptBar } from "@/components/PromptBar";
import { MOCK_BUDGET, MOCK_DELEGATION, MOCK_FEED } from "@/lib/mock";

/**
 * Dashboard shell (UI_GUIDE §7) — composition only. Real logic and data land
 * in Fase 3–4. Data here comes from `lib/mock` (shaped to the shared contract).
 */
export default function Page() {
  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">
        <div className="mb-6">
          <BudgetMeter
            spent={MOCK_BUDGET.spent}
            cap={MOCK_BUDGET.cap}
            onRevoke={() => {}}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <DelegationChain nodes={MOCK_DELEGATION} />
            <ActivityFeed events={MOCK_FEED} />
          </div>
          <ResultPanel />
        </div>

        <div className="mt-6">
          <PromptBar />
        </div>
      </main>
    </>
  );
}
