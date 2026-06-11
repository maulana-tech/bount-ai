import { Reveal } from "./Reveal";

const TECH = [
  "MetaMask Smart Accounts",
  "ERC-7715",
  "ERC-7710",
  "x402",
  "Venice AI",
  "1Shot Relayer",
];

export function Stack() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <p className="text-center text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Built on
        </p>
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {TECH.map((t) => (
            <span
              key={t}
              className="border border-line px-3 py-1.5 font-mono text-xs text-ink-muted"
            >
              {t}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
