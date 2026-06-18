import { Reveal } from "./Reveal";

const FEATURES = [
  {
    title: "Bounded permission, not full keys",
    body: "A cap, categories, and expiry you define. Revoke anytime — the agent loses the ability to pay that instant.",
  },
  {
    title: "Secure TEE Enclaves (Terminal 3)",
    body: "WASM custom skills execute inside hardware-isolated enclaves. Safe from tampering and node operator snooping.",
  },
  {
    title: "Local Developer CLI (`npx skill`)",
    body: "Initialize, compile, publish, and test TEE skills directly in your terminal. Integrates x402 payment loops.",
  },
  {
    title: "Session-Locked Portal",
    body: "EIP-191 signature login locks session as Buyer (delegate budget) or Seller (earn fees on published TEE skills).",
  },
  {
    title: "Agents that delegate to each other",
    body: "bount-AI splits sub-budgets across specialist agents, each with its own limit. The total never exceeds your cap.",
  },
  {
    title: "Pay-per-use via x402",
    body: "Settle payments instantly via x402 loops, with transparent on-chain transactions and hashes.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="flex min-h-screen flex-col justify-center border-t border-line bg-panel px-4 py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Features
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Built so an AI can hold money safely.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.05} className="bg-panel">
              <div className="h-full p-8">
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
