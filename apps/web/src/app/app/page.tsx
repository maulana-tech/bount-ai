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

        {/* preview cards — showcase UI */}
        <div className="mb-8">
          <CornerFrame label="Preview">
            <div className="grid gap-4 sm:grid-cols-3">
              <PreviewCard
                title="Chat"
                desc="Conversational interface with real AI responses, markdown rendering, and image support."
                href="/app/chat"
              >
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <div className="w-3/4 rounded border border-gold/30 bg-gold-tint px-3 py-2">
                      <p className="font-mono text-[10px] text-ink">
                        research the latest AI trends
                      </p>
                    </div>
                  </div>
                  <div className="w-3/4 rounded border border-line bg-panel px-3 py-2">
                    <div className="mb-1 flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold/60" />
                      <span className="font-mono text-[9px] uppercase text-ink-faint">
                        agent
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-ink-muted">
                      Here are the latest AI trends in 2026…
                    </p>
                  </div>
                </div>
              </PreviewCard>

              <PreviewCard
                title="Agents"
                desc="Specialist capabilities — research, writing, image, video, audio, translation."
                href="/app/agents"
              >
                <div className="space-y-1.5">
                  {["Research", "Copywriting", "Image"].map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between border border-line bg-panel px-3 py-2"
                    >
                      <span className="font-mono text-[10px] text-ink">{name}</span>
                      <span className="font-mono text-[9px] text-gold">$2</span>
                    </div>
                  ))}
                </div>
              </PreviewCard>

              <PreviewCard
                title="Delegation"
                desc="On-chain budget delegation with ERC-7710 smart accounts and x402 payments."
                href="/app"
              >
                <div className="rounded border border-line bg-panel p-3">
                  <div className="mb-2 font-mono text-[9px] uppercase text-ink-faint">
                    budget
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-lg tnum text-gold">$39</span>
                    <span className="font-mono text-[10px] text-ink-faint">remaining</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
                    <div className="h-full w-1/4 rounded-full bg-gold" />
                  </div>
                  <div className="mt-1.5 flex justify-between font-mono text-[9px] text-ink-faint">
                    <span>$11 spent</span>
                    <span>$50 cap</span>
                  </div>
                </div>
              </PreviewCard>
            </div>
          </CornerFrame>
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

function PreviewCard({
  title,
  desc,
  href,
  children,
}: {
  title: string;
  desc: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col border border-line bg-panel transition-colors hover:border-gold/50"
    >
      <div className="border-b border-line bg-panel-2/50 p-4">{children}</div>
      <div className="p-4">
        <h3 className="text-sm font-semibold tracking-tight group-hover:text-gold">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{desc}</p>
      </div>
    </Link>
  );
}
