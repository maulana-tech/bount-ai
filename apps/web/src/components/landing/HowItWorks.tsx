import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Set a budget and rules",
    body: "Connect a wallet, then approve once: a cap (e.g. $50), categories, and an expiry. Not full access — just an envelope holding $50.",
  },
  {
    n: "02",
    title: "Write a request",
    body: "One sentence, e.g. “research 3 competitors, then make a poster.” ven-AI breaks it into sub-tasks and allocates the budget.",
  },
  {
    n: "03",
    title: "Agents delegate and work",
    body: "ven-AI passes sub-budgets to specialist agents. Each pays for the services it uses — data, models, generation — via x402.",
  },
  {
    n: "04",
    title: "Result and proof",
    body: "You get the output plus an audit trail: who paid what, how much, how much is left. Unspent budget stays yours.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-24">
      <Reveal>
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          How it works
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
          You give the task and the budget once. The rest runs on its own.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.05} className="bg-paper">
            <div className="h-full p-7">
              <div className="font-mono text-sm tnum text-gold">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {s.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
