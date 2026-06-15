"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CornerFrame } from "@/components/CornerFrame";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BudgetMeter } from "@/components/BudgetMeter";
import { ActivityFeed } from "@/components/ActivityFeed";
import { MOCK_FEED } from "@/lib/mock";

// Toolkit delegation berat → muat hanya saat modal grant dibuka.
const GrantBudgetModal = dynamic(
  () => import("@/components/GrantBudgetModal").then((m) => m.GrantBudgetModal),
  { ssr: false },
);
import { useBudget } from "@/lib/budget";
import { getCustomAgents } from "@/lib/customAgents";
import { CAPABILITIES, type Capability } from "@concierge/shared";
import { usd } from "@/lib/utils";

export default function Page() {
  const { cap, spent, activity, revoke, granted, usage } = useBudget();
  const [grantOpen, setGrantOpen] = useState(false);
  const [custom, setCustom] = useState<Capability[]>([]);
  useEffect(() => setCustom(getCustomAgents()), []);

  // Gabung bawaan + custom, urutkan: paling sering dipakai dulu, lalu earnings.
  const ranked = useMemo(() => {
    const pool = [...CAPABILITIES, ...custom];
    return pool
      .map((c) => ({ c, u: usage[c.id] ?? { count: 0, earned: 0 } }))
      .sort(
        (a, b) => b.u.count - a.u.count || b.u.earned - a.u.earned,
      );
  }, [custom, usage]);

  // Tampilkan aktivitas nyata; jatuh ke contoh statis saat belum ada run.
  const feed = activity.length > 0 ? activity : MOCK_FEED;

  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">
        {/* hero: budget */}
        <div className="mb-8">
          <BudgetMeter spent={spent} cap={cap} onRevoke={revoke} />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] text-ink-faint">
              {granted
                ? "wallet-granted budget · ERC-7710 spending limit signed by you"
                : "demo free credit · $5.00 — not yet wallet-backed"}
            </p>
            <button
              onClick={() => setGrantOpen(true)}
              className="shrink-0 rounded border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold-tint"
            >
              {granted ? "Re-grant budget" : "Grant budget"}
            </button>
          </div>
        </div>
        {grantOpen && (
          <GrantBudgetModal open onClose={() => setGrantOpen(false)} />
        )}

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
            <p className="mt-1 font-mono text-2xl tnum text-gold">${usd(spent)}</p>
          </div>
        </div>

        {/* preview cards — embedded UI demo */}
        <div className="mb-8">
          <CornerFrame label="Preview">
            <div className="grid gap-4 sm:grid-cols-3">
              <PreviewVideo
                title="Chat"
                desc="Conversational interface with real AI responses, markdown rendering, and image support."
                href="/app/chat"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_171521_25968ba2-b594-4b32-aab7-f6b69398a6fa.mp4"
              />
              <PreviewVideo
                title="Agents"
                desc="Specialist capabilities — research, writing, image, video, audio, translation."
                href="/app/agents"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_115139_0fc6bd3d-3631-4d26-ab9b-28293887dcc9.mp4"
              />
              <PreviewVideo
                title="Delegation"
                desc="On-chain budget delegation with ERC-7710 smart accounts and x402 payments."
                href="/app"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4"
              />
            </div>
          </CornerFrame>
        </div>

        {/* agent capabilities — ranked by usage (most used first) */}
        <div className="mb-8">
          <CornerFrame label="Top agents">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ranked.map(({ c, u }, i) => {
                const isCustom = !CAPABILITIES.some((b) => b.id === c.id);
                return (
                  <Link
                    key={c.id}
                    href="/app/chat"
                    className="group relative border border-line bg-panel p-4 transition-colors hover:border-line-strong"
                  >
                    {i === 0 && u.count > 0 && (
                      <span className="absolute -top-2 right-3 border border-gold/40 bg-paper px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
                        top
                      </span>
                    )}
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold tracking-tight">{c.label}</h3>
                        {isCustom && (
                          <span className="border border-gold/40 bg-gold-tint px-1 py-0.5 font-mono text-[9px] uppercase tracking-wide text-gold">
                            custom
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-xs tnum text-gold">
                        ${usd(c.unitCostUsd)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      {c.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {c.keywords.slice(0, 3).map((k) => (
                          <span
                            key={k}
                            className="rounded bg-line/30 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tnum text-ink-faint">
                        {u.count > 0 ? `used ${u.count}× · $${usd(u.earned)}` : "unused"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CornerFrame>
        </div>

        {/* activity */}
        <ActivityFeed events={feed} />
      </main>
    </>
  );
}

function PreviewVideo({
  title,
  desc,
  href,
  src,
}: {
  title: string;
  desc: string;
  href: string;
  src: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col border border-line bg-panel transition-colors hover:border-gold/50"
    >
      <div className="relative border-b border-line bg-panel-2/50">
        <div className="aspect-[16/9] animate-pulse rounded bg-line/30" />
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold tracking-tight group-hover:text-gold">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{desc}</p>
      </div>
    </Link>
  );
}
