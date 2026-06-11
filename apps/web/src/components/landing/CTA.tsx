import Link from "next/link";
import { Reveal } from "./Reveal";

export function CTA() {
  return (
    <section className="border-t border-line bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Hand off the task, not your wallet.
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            Set a cap, give a command, and let the agent work within limits you
            hold completely.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <Link
            href="/app"
            className="mt-8 inline-block rounded bg-gold px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold-hover"
          >
            Open app
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
