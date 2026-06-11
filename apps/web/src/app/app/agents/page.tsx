import { CAPABILITIES } from "@concierge/shared";
import { Navbar } from "@/components/Navbar";
import { AgentCard } from "@/components/AgentCard";

/**
 * Halaman Agents — daftar specialist yang ven-AI delegasikan. Concierge memilih
 * yang dibutuhkan tiap permintaan dan memberi masing-masing sub-budget sendiri.
 * Sumber: registry `@concierge/shared` (sama dengan yang dipakai agent).
 */
export default function AgentsPage() {
  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Specialists ven-AI can delegate to. It picks the ones a request
            needs, redelegates each its own sub-budget, and each pays for the
            service it uses via x402. Add an agent by adding one registry entry.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        <p className="mt-6 font-mono text-xs text-ink-faint">
          {CAPABILITIES.length} agents available
        </p>
      </main>
    </>
  );
}
