import {
  type ActivityEvent,
  type Capability,
  type DelegationNode,
  type DelegationProof,
  type SpikeResult,
  CAPABILITIES,
} from "@concierge/shared";
import { planRequest } from "./concierge/planner.js";
import {
  buildSpendingDelegation,
  delegationHash,
  newParty,
  toUsdc,
} from "./integrations/delegation.js";
import { paidFetch } from "./integrations/x402.js";
import { SELLER } from "./routes/seller.js";
import { config } from "./config.js";

/**
 * Fase 2 vertical-slice: rencana → delegasi root (user → ven-AI) → redelegasi
 * per specialist (menyempit sub-budget) → pembayaran x402 per specialist.
 *
 * NYATA: konstruksi + caveat (spending limit + allowedTargets) + redelegasi +
 * tanda tangan + hash delegasi; loop x402 (402 → bayar → 200) lawan mock seller.
 * DISIMULASI/GATED: settlement on-chain pembayaran & relay 1Shot (butuh dana).
 */
export async function runSpike(
  request: string,
  extraAgents: Capability[] = [],
): Promise<SpikeResult> {
  // Gabung katalog bawaan + agent custom user (custom tidak menimpa bawaan).
  const seen = new Set(CAPABILITIES.map((c) => c.id));
  const pool = [...CAPABILITIES, ...extraAgents.filter((c) => !seen.has(c.id))];
  const byId: Record<string, Capability> = Object.fromEntries(
    pool.map((c) => [c.id, c]),
  );

  const plan = await planRequest(request, pool);
  const sellerBase = config.agentUrl;

  const user = newParty();
  const agent = newParty();
  const cap = plan.subtasks.reduce((sum, t) => sum + t.estimatedCost, 0);

  // 1) Delegasi root: user → ven-AI (plafon penuh, whitelist seller).
  const root = await buildSpendingDelegation({
    from: user,
    to: agent.address,
    capUsdc: toUsdc(cap),
    allowedTargets: [SELLER],
  });

  const proofs: DelegationProof[] = [
    { from: "user", to: "ven-AI", hash: delegationHash(root), capUsd: cap },
  ];
  const nodes: DelegationNode[] = [
    { id: "user", role: "user", label: "User", cap, spent: 0, active: true },
    { id: "concierge", role: "concierge", label: "ven-AI", cap, spent: 0, active: true },
  ];
  const activity: ActivityEvent[] = [];

  let spent = 0;
  let at = 0;

  for (const t of plan.subtasks) {
    const capability = byId[t.agent];
    const specialist = newParty();

    // 2) Redelegasi: ven-AI → specialist (sub-cap, hanya menyempit).
    const child = await buildSpendingDelegation({
      from: agent,
      to: specialist.address,
      capUsdc: toUsdc(t.estimatedCost),
      allowedTargets: [SELLER],
      parent: root,
    });
    proofs.push({
      from: "ven-AI",
      to: t.agent,
      hash: delegationHash(child),
      capUsd: t.estimatedCost,
    });
    nodes.push({
      id: t.agent,
      role: t.agent,
      label: capability?.label ?? t.agent,
      cap: t.estimatedCost,
      spent: 0,
      active: true,
    });

    // 3) Specialist membayar layanan kapabilitasnya via x402, dalam sub-cap.
    // `amount` = biaya kapabilitas (USDC), jadi agent custom pun membayar tarif
    // yang dideklarasikannya.
    const product = capability?.product ?? "dataset";
    const amount = toUsdc(t.estimatedCost).toString();
    const res = await paidFetch(
      `${sellerBase}/seller/buy?product=${encodeURIComponent(product)}&amount=${amount}&q=${encodeURIComponent(request)}`,
      specialist,
      { maxPayUsd: t.estimatedCost },
    );
    spent += res.paid;
    at += 1;
    activity.push({
      id: `a${at}`,
      agent: t.agent,
      action: t.description,
      amount: res.paid,
      status: "confirmed",
      txHash: res.txHash,
      at,
    });
    const node = nodes.find((n) => n.id === t.agent);
    if (node) node.spent = res.paid;
  }

  const concierge = nodes.find((n) => n.role === "concierge");
  if (concierge) concierge.spent = spent;
  const userNode = nodes.find((n) => n.role === "user");
  if (userNode) userNode.spent = spent;

  return {
    request,
    budget: { cap, spent },
    delegation: nodes,
    activity,
    proofs,
    settlement: "simulated",
    relayed: false,
  };
}
