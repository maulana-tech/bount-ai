import { Reveal } from "./Reveal";

export function Problem() {
  return (
    <section className="flex min-h-screen items-center border-y border-line bg-panel px-4 py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            The problem
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mt-4 max-w-3xl text-balance text-3xl font-medium leading-snug tracking-tight sm:text-4xl">
            Today, giving an agent the ability to pay means handing over the
            keys to your wallet. One leak, and it&rsquo;s all gone.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            bount-AI breaks that trade-off: programmable, bounded permission. The
            agent can transact on its own, but control &mdash; cap, categories,
            expiry, revocation &mdash; stays with you.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
