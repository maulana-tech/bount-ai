import { Reveal } from "./Reveal";

const FEATURES = [
  {
    title: "Bounded permission, not full keys",
    body: "A cap, categories, and expiry you define. Revoke anytime — the agent loses the ability to pay that instant.",
  },
  {
    title: "A budget you watch move",
    body: "Balance and every payment update in real time. Know exactly what's spent and what's left, no guessing.",
  },
  {
    title: "Agents that delegate to each other",
    body: "ven-AI splits sub-budgets across specialist agents, each with its own limit. The total never exceeds your cap.",
  },
  {
    title: "Pay-per-use via x402",
    body: "Each agent pays only for what it actually uses — data, models, generation — as micropayments, not subscriptions.",
  },
  {
    title: "Gas paid in stablecoins",
    body: "Transactions are relayed through 1Shot; gas is paid in USDC. Status comes from webhooks, not guesswork polling.",
  },
  {
    title: "Every action provable on-chain",
    body: "Not text claims. Each payment has a transaction hash you can trace in an explorer yourself.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-line bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Features
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
            Built so an AI can hold money safely.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.05} className="bg-panel">
              <div className="h-full p-7">
                <h3 className="text-base font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
