"use client";

import { useEffect, useState } from "react";
import { CAPABILITIES, type Capability } from "@concierge/shared";
import { Navbar } from "@/components/Navbar";
import { CornerFrame } from "@/components/CornerFrame";
import { AgentCard } from "@/components/AgentCard";
import { CreateAgentForm } from "@/components/CreateAgentForm";
import { getCustomAgents, removeCustomAgent } from "@/lib/customAgents";

const HOW_IT_WORKS = [
  {
    title: "Browse the catalog",
    body: "Built-in specialists ship with bount-AI. Add your own and it joins the same pool.",
  },
  {
    title: "Ask in Chat",
    body: "bount-AI reads your request and picks the agents it needs by their keywords.",
  },
  {
    title: "It delegates & pays",
    body: "Each picked agent gets its own sub-budget, then pays per use via x402.",
  },
];

/**
 * Halaman Agents (hybrid). Katalog bawaan (`@concierge/shared`) + agent custom
 * user (localStorage). Concierge memilih dari gabungan keduanya per permintaan.
 */
export default function AgentsPage() {
  const [custom, setCustom] = useState<Capability[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Baca custom di client (hindari mismatch hidrasi SSR).
  useEffect(() => setCustom(getCustomAgents()), []);

  const total = CAPABILITIES.length + custom.length;

  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Specialists bount-AI can delegate to. It picks the ones a request
              needs, redelegates each its own sub-budget, and each pays for the
              service it uses via x402. Add your own and it joins the catalog.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="shrink-0 rounded bg-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-hover"
            >
              Create agent
            </button>
          )}
        </header>

        {/* banner: how it works + demo */}
        <div className="mb-8">
          <CornerFrame label="How it works">
            <div className="grid items-stretch gap-6 lg:grid-cols-2">
              {/* left — steps */}
              <ol className="flex flex-col justify-center gap-5">
                {HOW_IT_WORKS.map((step, i) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 font-mono text-xs tnum text-gold">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight">
                        {step.title}
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* right — demo video */}
              <div className="relative overflow-hidden rounded border border-line bg-panel-2/50">
                <div className="aspect-[16/9] animate-pulse bg-line/30" />
                <video
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_171521_25968ba2-b594-4b32-aab7-f6b69398a6fa.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </CornerFrame>
        </div>

        {showForm && (
          <div className="mb-8">
            <CreateAgentForm
              onCreated={(list) => {
                setCustom(list);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
          {custom.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              custom
              onRemove={() => setCustom(removeCustomAgent(agent.id))}
            />
          ))}
        </div>

        <p className="mt-6 font-mono text-xs text-ink-faint">
          {total} agents available
          {custom.length > 0 ? ` · ${custom.length} custom` : ""}
        </p>
      </main>
    </>
  );
}
