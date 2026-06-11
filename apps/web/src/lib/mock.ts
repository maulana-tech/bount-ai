import type { ActivityEvent, BudgetState, DelegationNode } from "@concierge/shared";

/**
 * Data dummy untuk Fase 1 — membuktikan arah visual. Bentuknya sudah sesuai
 * kontrak `@concierge/shared`, jadi Fase 3–4 tinggal mengganti sumbernya
 * dengan state nyata (agent + webhook 1Shot). Timestamp dibuat statis agar
 * tidak ada mismatch hidrasi SSR.
 */

export const MOCK_BUDGET: BudgetState = { cap: 50, spent: 11 };

export const MOCK_DELEGATION: DelegationNode[] = [
  { id: "user", role: "user", label: "User", cap: 50, spent: 11, active: true },
  { id: "concierge", role: "concierge", label: "ven-AI", cap: 50, spent: 11, active: true },
  { id: "research", role: "research", label: "Research", cap: 30, spent: 6, active: true },
  { id: "media", role: "media", label: "Media", cap: 20, spent: 5, active: true },
];

export const MOCK_FEED: ActivityEvent[] = [
  { id: "e1", agent: "research", action: "Fetch competitor data #1", amount: 2, status: "confirmed", at: 1 },
  { id: "e2", agent: "research", action: "Fetch competitor data #2", amount: 2, status: "confirmed", at: 2 },
  { id: "e3", agent: "research", action: "Fetch competitor data #3", amount: 2, status: "confirmed", at: 3 },
  { id: "e4", agent: "media", action: "Generate summary poster", amount: 5, status: "pending", at: 4 },
];
