"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CornerFrame } from "@/components/CornerFrame";
import { BudgetMeter } from "@/components/BudgetMeter";
import { ActivityFeed } from "@/components/ActivityFeed";
import { MOCK_BUDGET, MOCK_FEED, MOCK_DELEGATION } from "@/lib/mock";
import { CAPABILITIES } from "@concierge/shared";
import { usd } from "@/lib/utils";

export default function Page() {
  const budget = MOCK_BUDGET;
  const feed = MOCK_FEED;
  const capTotal = MOCK_DELEGATION.filter((n) => n.role !== "user").reduce(
    (s, n) => s + n.spent,
    0,
  );

  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">
        {/* hero: budget */}
        <div className="mb-8">
          <BudgetMeter spent={budget.spent} cap={budget.cap} />
        </div>

        {/* quick actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/app/chat"
            className="flex items-center justify-between border border-line bg-panel p-5 transition-colors hover:border-gold/50"
          >
            <div>
              <div className="text-sm font-semibold tracking-tight">Chat with AI</div>
              <p className="mt-1 text-xs text-ink-muted">
                Send requests and get results
              </p>
            </div>
            <span className="font-mono text-xs text-gold">&rarr;</span>
          </Link>
          <Link
            href="/app/agents"
            className="flex items-center justify-between border border-line bg-panel p-5 transition-colors hover:border-gold/50"
          >
            <div>
              <div className="text-sm font-semibold tracking-tight">Manage Agents</div>
              <p className="mt-1 text-xs text-ink-muted">
                View and create specialist agents
              </p>
            </div>
            <span className="font-mono text-xs text-gold">&rarr;</span>
          </Link>
          <div className="border border-line bg-panel p-5">
            <div className="text-sm font-semibold tracking-tight">Total Spent</div>
            <p className="mt-1 font-mono text-2xl tnum text-gold">${usd(capTotal)}</p>
          </div>
        </div>

        {/* agent capabilities grid */}
        <div className="mb-8">
          <CornerFrame label="Capabilities">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((c) => (
                <Link
                  key={c.id}
                  href="/app/chat"
                  className="group border border-line bg-panel p-4 transition-colors hover:border-line-strong"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-sm font-semibold tracking-tight">{c.label}</h3>
                    <span className="font-mono text-xs tnum text-gold">
                      ${usd(c.unitCostUsd)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-muted">
                    {c.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.keywords.slice(0, 3).map((k) => (
                      <span
                        key={k}
                        className="rounded bg-line/30 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </CornerFrame>
        </div>

        {/* activity */}
        <ActivityFeed events={feed} />
      </main>
    </>
  );
}
