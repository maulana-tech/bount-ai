"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CornerFrame } from "@/components/CornerFrame";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BudgetMeter } from "@/components/BudgetMeter";
import { ActivityFeed } from "@/components/ActivityFeed";
import { MOCK_FEED } from "@/lib/mock";
import { useBudget } from "@/lib/budget";
import { getCustomAgents, removeCustomAgent } from "@/lib/customAgents";
import { CAPABILITIES, type Capability } from "@concierge/shared";
import { usd, cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { StatusDot } from "@/components/ui/StatusDot";
import { useRouter } from "next/navigation";

// Toolkit delegation berat → muat hanya saat modal grant dibuka.
const GrantBudgetModal = dynamic(
  () => import("@/components/GrantBudgetModal").then((m) => m.GrantBudgetModal),
  { ssr: false },
);

export default function Page() {
  const router = useRouter();
  const { cap, spent, activity, revoke, granted, usage } = useBudget();
  const { address } = useAccount();
  const [grantOpen, setGrantOpen] = useState(false);
  const [custom, setCustom] = useState<Capability[]>([]);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setCustom(getCustomAgents());
    const raw = localStorage.getItem("bountai.session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session.role === "buyer" || session.role === "seller") {
          setRole(session.role);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("bountai.session");
    router.push("/login");
  };

  const copyCommand = (id: string) => {
    navigator.clipboard.writeText(`npx skill run ${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemoveAgent = (id: string) => {
    const updated = removeCustomAgent(id);
    setCustom(updated);
  };

  // Filter custom agents published by this user (or all if wallet not connected)
  const sellerAgents = useMemo(() => {
    return custom.filter((c) => !address || c.creator === address);
  }, [custom, address]);

  // Compute total earnings and uses from custom agents
  const totalEarnings = useMemo(() => {
    return sellerAgents.reduce((sum, agent) => {
      const u = usage[agent.id]?.earned ?? 0;
      return sum + u;
    }, 0);
  }, [sellerAgents, usage]);

  const totalUses = useMemo(() => {
    return sellerAgents.reduce((sum, agent) => {
      const u = usage[agent.id]?.count ?? 0;
      return sum + u;
    }, 0);
  }, [sellerAgents, usage]);

  // Dynamic Sales Feed for Seller
  const salesFeed = useMemo(() => {
    const realSales = activity.filter((e) =>
      sellerAgents.some((sa) => sa.id === e.agent),
    );
    if (realSales.length > 0) return realSales;

    if (sellerAgents.length === 0) {
      // Sample data if no custom agents exist
      return [
        {
          id: "s-sample-1",
          agent: "SEO Auditor",
          action: "TEE secure execution of dataset generation",
          amount: 0.5,
          status: "confirmed" as const,
          at: Date.now() - 1800000,
        },
        {
          id: "s-sample-2",
          agent: "Translation Node",
          action: "Verify x402 payment & release output",
          amount: 0.2,
          status: "confirmed" as const,
          at: Date.now() - 7200000,
        },
      ];
    }

    return sellerAgents.map((sa, i) => ({
      id: `sales-mock-${sa.id}-${i}`,
      agent: sa.label,
      action: `TEE Secure execution of ${sa.product} generation`,
      amount: sa.unitCostUsd,
      status: "confirmed" as const,
      at: Date.now() - i * 3600000,
    }));
  }, [activity, sellerAgents]);

  // Gabung bawaan + custom, urutkan: paling sering dipakai dulu, lalu earnings.
  const ranked = useMemo(() => {
    const pool = [...CAPABILITIES, ...custom];
    return pool
      .map((c) => ({ c, u: usage[c.id] ?? { count: 0, earned: 0 } }))
      .sort((a, b) => b.u.count - a.u.count || b.u.earned - a.u.earned);
  }, [custom, usage]);

  // Tampilkan aktivitas nyata; jatuh ke contoh statis saat belum ada run.
  const feed = activity.length > 0 ? activity : MOCK_FEED;

  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">
        {/* Dashboard Header */}
        <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight capitalize text-ink">
              {role === "buyer" ? "Buyer Dashboard" : "Seller Dashboard"}
            </h1>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Account: <code className="font-mono text-[11px] bg-panel px-1.5 py-0.5 rounded text-ink">{address?.slice(0, 6)}…{address?.slice(-4)}</code>
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="rounded border border-line px-3.5 py-2 text-xs font-semibold text-ink-muted hover:text-ink hover:border-line-strong transition-colors bg-panel hover:bg-panel-2"
          >
            Switch Mode / Logout
          </button>
        </div>

        {role === "seller" ? (
          <div className="space-y-8">
            {/* Quick stats for seller */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="border border-line bg-panel p-5">
                <div className="text-sm font-semibold tracking-tight">Total Earnings</div>
                <p className="mt-1 font-mono text-2xl tnum text-gold">
                  ${usd(totalEarnings)}
                </p>
              </div>
              <div className="border border-line bg-panel p-5">
                <div className="text-sm font-semibold tracking-tight">Total Sales Volume</div>
                <p className="mt-1 font-mono text-2xl tnum text-gold">
                  {totalUses} {totalUses === 1 ? "use" : "uses"}
                </p>
              </div>
              <Link
                href="/app/agents"
                className="flex items-center justify-between border border-line bg-panel p-5 transition-colors hover:border-gold/50"
              >
                <div>
                  <div className="text-sm font-semibold tracking-tight">Deploy TEE Skill</div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Compile and publish WASM to enclaves
                  </p>
                </div>
                <span className="font-mono text-xs text-gold">&rarr;</span>
              </Link>
            </div>

            {/* My custom agents list */}
            <div>
              <CornerFrame label="My Published TEE Skills">
                {sellerAgents.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-ink-muted">
                      No custom TEE skills published yet.
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      Create an agent or run{" "}
                      <code className="font-mono text-gold bg-panel px-1">
                        npx skill publish
                      </code>{" "}
                      in your terminal.
                    </p>
                    <Link
                      href="/app/agents"
                      className="mt-4 inline-block rounded bg-gold px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gold-hover"
                    >
                      Create custom agent
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sellerAgents.map((agent) => {
                      const u = usage[agent.id] ?? { count: 0, earned: 0 };
                      const isCopied = copiedId === agent.id;
                      return (
                        <div
                          key={agent.id}
                          className="flex flex-col justify-between border border-line bg-panel p-5 transition-colors hover:border-line-strong"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold tracking-tight">
                                  {agent.label}
                                </h3>
                                <span className="border border-gold/40 bg-gold-tint px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-gold">
                                  TEE Enclave
                                </span>
                              </div>
                              <span className="shrink-0 font-mono text-xs tnum text-gold">
                                ${usd(agent.unitCostUsd)} / use
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                              {agent.description}
                            </p>

                            <div className="mt-4 space-y-1.5">
                              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                                Run command (CLI)
                              </span>
                              <div className="flex items-center gap-2 border border-line bg-paper px-2.5 py-1.5 rounded">
                                <code className="flex-1 font-mono text-[11px] truncate text-ink-muted">
                                  npx skill run {agent.id}
                                </code>
                                <button
                                  onClick={() => copyCommand(agent.id)}
                                  className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-gold hover:text-gold-hover transition-colors"
                                >
                                  {isCopied ? "Copied" : "Copy"}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                            <div className="flex gap-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                                  sales
                                </span>
                                <span className="font-mono text-xs font-semibold text-ink-muted">
                                  {u.count}×
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                                  earned
                                </span>
                                <span className="font-mono text-xs font-semibold text-gold">
                                  ${usd(u.earned)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveAgent(agent.id)}
                              className="font-mono text-[11px] uppercase tracking-wide text-ink-faint transition-colors hover:text-danger"
                            >
                              unpublish
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CornerFrame>
            </div>

            {/* Sales feed */}
            <div>
              <CornerFrame label="Sales Transactions">
                {salesFeed.length === 0 ? (
                  <p className="text-sm text-ink-muted">No sales transactions yet.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {salesFeed.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 py-2.5">
                        <StatusDot status={e.status} />
                        <span className="w-24 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                          {e.agent}
                        </span>
                        <span className="flex-1 text-sm text-ink">{e.action}</span>
                        <span className="font-mono text-sm tnum text-success">
                          +${usd(e.amount)}
                        </span>
                        <span
                          className={
                            "w-20 text-right font-mono text-[11px] uppercase " +
                            (e.status === "confirmed"
                              ? "text-success"
                              : e.status === "failed"
                                ? "text-danger"
                                : "text-gold")
                          }
                        >
                          {e.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CornerFrame>
            </div>
          </div>
        ) : (
          <>
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
                  <div className="text-sm font-semibold tracking-tight">
                    Chat with AI
                  </div>
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
                  <div className="text-sm font-semibold tracking-tight">
                    Manage Agents
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    View and create specialist agents
                  </p>
                </div>
                <span className="font-mono text-xs text-gold">&rarr;</span>
              </Link>
              <div className="border border-line bg-panel p-5">
                <div className="text-sm font-semibold tracking-tight">Total Spent</div>
                <p className="mt-1 font-mono text-2xl tnum text-gold">
                  ${usd(spent)}
                </p>
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
                            <h3 className="text-sm font-semibold tracking-tight">
                              {c.label}
                            </h3>
                            {isCustom && (
                              <span className="border border-gold/40 bg-gold-tint px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-gold">
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
                            {u.count > 0
                              ? `used ${u.count}× · $${usd(u.earned)}`
                              : "unused"}
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
          </>
        )}
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
