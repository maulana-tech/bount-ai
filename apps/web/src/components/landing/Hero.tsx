import Link from "next/link";
import { Reveal } from "./Reveal";
import { BudgetMeter } from "../BudgetMeter";
import { ActivityFeed } from "../ActivityFeed";
import { MOCK_BUDGET, MOCK_FEED } from "@/lib/mock";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div>
          <Reveal>
            <span className="inline-block border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              MetaMask Smart Accounts + x402
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Give an AI a budget. Not your wallet.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-muted">
              ven-AI plans, delegates, and pays for services on your behalf —
              within a cap you set and can revoke anytime. Every dollar that
              moves is provable on-chain.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/app"
                className="rounded bg-gold px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-hover"
              >
                Open app
              </Link>
              <Link
                href="#how"
                className="rounded border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-panel-2"
              >
                See how it works
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Product preview — real components, not a mockup */}
        <Reveal delay={0.2}>
          <div className="space-y-4">
            <BudgetMeter spent={MOCK_BUDGET.spent} cap={MOCK_BUDGET.cap} />
            <ActivityFeed events={MOCK_FEED} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
