import {
  type AgentOutput,
  type ActivityEvent,
  type Capability,
  type DelegationNode,
  type DelegationProof,
  type SpikeResult,
  CAPABILITIES,
} from "./shared.js";
import type { Delegation } from "@metamask/delegation-toolkit";
import { planRequest } from "./concierge/planner.js";
import {
  agentParty,
  buildSpendingDelegation,
  delegationHash,
  newParty,
  toUsdc,
} from "./integrations/delegation.js";
import { paidFetch } from "./integrations/x402.js";
import { settleOnchain } from "./integrations/settlement.js";
import { SELLER } from "./routes/seller.js";
import { config } from "./config.js";
import { runResearch } from "./agents/research.js";
import { runMedia } from "./agents/media.js";
import { runText } from "./agents/text.js";

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
  grant?: { root: Delegation; capUsd: number },
): Promise<SpikeResult> {
  // Gabung katalog bawaan + agent custom user (custom tidak menimpa bawaan).
  const seen = new Set(CAPABILITIES.map((c) => c.id));
  const pool = [...CAPABILITIES, ...extraAgents.filter((c) => !seen.has(c.id))];
  const byId: Record<string, Capability> = Object.fromEntries(
    pool.map((c) => [c.id, c]),
  );

  const plan = await planRequest(request, pool);
  const sellerBase = config.agentUrl;

  // Grant nyata (root ditandatangani wallet user) → delegate pakai key STABIL
  // agar `to` di root cocok. Tanpa grant → root di-generate server (demo).
  const agent = grant ? agentParty() : newParty();
  const planCost = plan.subtasks.reduce((sum, t) => sum + t.estimatedCost, 0);
  const cap = grant ? grant.capUsd : planCost;

  // 1) Delegasi root: user → ven-AI (plafon penuh, whitelist seller).
  const root =
    grant?.root ??
    (await buildSpendingDelegation({
      from: newParty(),
      to: agent.address,
      capUsdc: toUsdc(cap),
      allowedTargets: [SELLER],
    }));

  const proofs: DelegationProof[] = [
    { from: "user", to: "ven-AI", hash: delegationHash(root), capUsd: cap },
  ];
  const nodes: DelegationNode[] = [
    { id: "user", role: "user", label: "User", cap, spent: 0, active: true },
    { id: "concierge", role: "concierge", label: "ven-AI", cap, spent: 0, active: true },
  ];
  const activity: ActivityEvent[] = [];
  const outputs: AgentOutput[] = [];

  let spent = 0;
  let at = 0;
  let anyOnchain = false;

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

    // Settlement on-chain (gated). Sukses → txHash nyata + tandai onchain;
    // null (OFF/gagal) → pakai txHash simulasi dari x402. Demo tak putus.
    let txHash = res.txHash;
    const settled = await settleOnchain({
      permissionContext: [child, root],
      payTo: SELLER,
      amountUsdc: toUsdc(res.paid),
    });
    if (settled) {
      txHash = settled.txHash;
      anyOnchain = true;
    }

    activity.push({
      id: `a${at}`,
      agent: t.agent,
      action: t.description,
      amount: res.paid,
      status: "confirmed",
      txHash,
      at,
    });
    const node = nodes.find((n) => n.id === t.agent);
    if (node) node.spent = res.paid;

    // 4) Eksekusi specialist agent — hasil beneran pakai Venice AI.
    if (t.agent === "research") {
      const { summary } = await runResearch(request);
      outputs.push({ agent: t.agent, label: capability?.label ?? t.agent, type: "text", text: summary });
    } else if (t.agent === "image") {
      const { imageUrl } = await runMedia(request);
      outputs.push({ agent: t.agent, label: capability?.label ?? t.agent, type: "image", imageUrl });
    } else if (t.agent === "writing") {
      const { text } = await runText(request, "You are a professional copywriter. Write content in English.");
      outputs.push({ agent: t.agent, label: capability?.label ?? t.agent, type: "text", text });
    } else if (t.agent === "translate") {
      const { text } = await runText(request, "You are a professional translator. Translate accurately.");
      outputs.push({ agent: t.agent, label: capability?.label ?? t.agent, type: "text", text });
    }
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
    outputs,
    settlement: anyOnchain ? "onchain" : "simulated",
    relayed: false,
  };
}
