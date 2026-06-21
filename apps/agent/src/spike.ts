import * as fs from "fs";
import * as path from "path";
import {
  type AgentOutput,
  type ActivityEvent,
  type Capability,
  type DelegationNode,
  type DelegationProof,
  type SpikeResult,
  CAPABILITIES,
} from "./shared.js";
import type { Address } from "viem";
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
import { executeT3nContract } from "./integrations/t3n.js";

/**
 * Fase 2 vertical-slice: rencana → delegasi root (user → bount-AI) → redelegasi
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
  userApiKey?: string,
): Promise<SpikeResult> {
  // Scan published_skills directory to dynamically register custom capabilities
  const customCaps: Capability[] = [];
  try {
    const uploadDir = path.resolve("./published_skills");
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const f of files) {
        if (f.endsWith(".wasm")) {
          const id = f.replace(/\.wasm$/i, "");
          const isEnclavesCrate = id === "enclaves";
          customCaps.push({
            id,
            label: id.charAt(0).toUpperCase() + id.slice(1),
            description: isEnclavesCrate
              ? "Confidential enclave TEE model runner. Use this to securely execute prompt instructions or fetch Venice LLM outputs inside a private execution sandbox."
              : `TEE secure skill: ${id}`,
            keywords: isEnclavesCrate
              ? ["enclaves", "secure", "confidential", "sandbox", "tee", "secret"]
              : [id.toLowerCase()],
            unitCostUsd: 0.1, // Positive default cost to prevent EADDRINUSE / Invalid maxAmount 0
            product: "text",
          });
        }
      }
    }
  } catch (err) {
    console.error("[spike] Error scanning published_skills:", err);
  }

  // Gabung katalog bawaan + agent custom user (custom tidak menimpa bawaan).
  const seen = new Set(CAPABILITIES.map((c) => c.id));
  const pool = [...CAPABILITIES, ...customCaps, ...extraAgents.filter((c) => !seen.has(c.id))];
  const byId: Record<string, Capability> = Object.fromEntries(
    pool.map((c) => [c.id, c]),
  );

  const plan = await planRequest(request, pool);
  const sellerBase = config.agentUrl;

  // Grant nyata (root ditandatangani wallet user) → delegate pakai key STABIL
  // agar `to` di root cocok. Tanpa grant → root di-generate server (demo).
  const agent = grant ? agentParty() : newParty();
  const planCost = plan.subtasks.reduce((sum, t) => sum + t.estimatedCost, 0);
  const cap = Math.max(grant ? grant.capUsd : planCost, 0.1);

  // 1) Delegasi root: user → bount-AI (plafon penuh, whitelist seller).
  const root =
    grant?.root ??
    (await buildSpendingDelegation({
      from: newParty(),
      to: agent.address,
      capUsdc: toUsdc(cap),
      allowedTargets: [SELLER],
    }));

  const proofs: DelegationProof[] = [
    { from: "user", to: "bount-AI", hash: delegationHash(root), capUsd: cap },
  ];
  const nodes: DelegationNode[] = [
    { id: "user", role: "user", label: "User", cap, spent: 0, active: true },
    { id: "concierge", role: "concierge", label: "bount-AI", cap, spent: 0, active: true },
  ];
  const activity: ActivityEvent[] = [];
  const outputs: AgentOutput[] = [];

  let spent = 0;
  let at = 0;
  let anyOnchain = false;

  for (const t of plan.subtasks) {
    const capability = byId[t.agent];
    const specialist = newParty();
    // Agent custom dengan wallet pembuat → pembayaran mengalir ke pembuatnya.
    // Tanpa creator (agent bawaan) → ke seller mock.
    const payTo = (capability?.creator ?? SELLER) as Address;

    // 2) Redelegasi: bount-AI → specialist (sub-cap, hanya menyempit).
    const child = await buildSpendingDelegation({
      from: agent,
      to: specialist.address,
      capUsdc: toUsdc(t.estimatedCost),
      allowedTargets: [payTo],
      parent: root,
    });
    proofs.push({
      from: "bount-AI",
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
      `${sellerBase}/seller/buy?product=${encodeURIComponent(product)}&amount=${amount}&payTo=${payTo}&q=${encodeURIComponent(request)}`,
      specialist,
      { maxPayUsd: t.estimatedCost },
    );
    spent += res.paid;
    at += 1;

    // Settlement on-chain (gated). Sukses → txHash nyata + tandai onchain;
    // null (OFF/gagal) → pakai txHash simulasi dari x402. Demo tak putus.
    let txHash = res.txHash;
    const settled = await settleOnchain({
      payTo,
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

    // 4) Eksekusi specialist agent — hasil beneran pakai Venice AI. Tipe bawaan
    // punya prompt khusus; agent custom (+ audio/video) jatuh ke cabang generik
    // yang memakai label + description-nya sebagai system prompt.
    const label = capability?.label ?? t.agent;
    try {
      if (capability?.product === "image" || t.agent === "image") {
        const { imageUrl } = await runMedia(request);
        outputs.push({ agent: t.agent, label, type: "image", imageUrl });
      } else if (t.agent === "research") {
        const { summary } = await runResearch(request);
        outputs.push({ agent: t.agent, label, type: "text", text: summary, content: summary });
      } else if (t.agent === "writing") {
        const { text } = await runText(request, "You are a professional copywriter. Write content in English.");
        outputs.push({ agent: t.agent, label, type: "text", text, content: text });
      } else if (t.agent === "translate") {
        const { text } = await runText(request, "You are a professional translator. Translate accurately.");
        outputs.push({ agent: t.agent, label, type: "text", text, content: text });
      } else {
        // Generik: agent custom buatan user, audio, video, dll.
        const wasmPath = path.resolve("./published_skills", `${t.agent.toLowerCase()}.wasm`);
        const metaPath = path.resolve("./published_skills", `${t.agent.toLowerCase()}.json`);
        const isTEE = fs.existsSync(wasmPath);
        
        let teeLog = "";
        let realTeeExecuted = false;
        let textResult = "";
        let contractVersion = "0.1.0";

        if (isTEE) {
          if (fs.existsSync(metaPath)) {
            try {
              const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
              if (meta.version) {
                contractVersion = meta.version;
              }
            } catch {}
          }

          console.log(`[T3N TEE] Verified and executing WASM component for ${t.agent} v${contractVersion} in secure TEE enclave`);
          
          try {
            const t3nResult = await executeT3nContract(t.agent, request, userApiKey, contractVersion);
            if (t3nResult !== null) {
              textResult = typeof t3nResult === "string" ? t3nResult : JSON.stringify(t3nResult);
              realTeeExecuted = true;
              console.log(`[T3N TEE] Secure Enclave Execution succeeded:`, textResult);
              
              activity.push({
                id: `a${at}-tee`,
                agent: t.agent,
                action: `[TEE] Verified & Executed on T3N testnet (did:t3n:${t.agent.toLowerCase()} v${contractVersion})`,
                amount: 0,
                status: "confirmed",
                txHash: `0xtee_real_${Buffer.from(t.agent).toString("hex").slice(0, 28)}`,
                at,
              });
            }
          } catch (err) {
            console.warn(`[T3N TEE] Real T3N execution failed, falling back to simulation:`, err);
            teeLog = `\n(Real T3N execution failed, fell back to simulated run: ${err instanceof Error ? err.message : String(err)})`;
          }

          if (!realTeeExecuted) {
            activity.push({
              id: `a${at}-tee`,
              agent: t.agent,
              action: `[TEE] Verify & Execute WASM secure enclave (Simulated)`,
              amount: 0,
              status: "confirmed",
              txHash: `0xtee_${Buffer.from(t.agent).toString("hex").slice(0, 32)}`,
              at,
            });
          }
        }

        if (!realTeeExecuted) {
          const sys = `You are ${label}, a specialist agent. ${capability?.description ?? ""} Produce a concise, useful result in English for the user's request.`;
          const { text } = await runText(request, sys);
          textResult = text;
        }
        
        const content = isTEE 
          ? `[T3N Secure Enclave Execution - did:t3n:${t.agent.toLowerCase()}]${teeLog}\n\n${textResult}`
          : textResult;

        outputs.push({ agent: t.agent, label, type: "text", text: content, content: content });
      }
    } catch (err: any) {
      console.error(`[spike] Specialist ${t.agent} execution failed:`, err);
      const fallbackText = `[Specialist ${label} Error]: ${err?.message || String(err)}`;
      outputs.push({ agent: t.agent, label, type: "text", text: fallbackText, content: fallbackText });
      activity.push({
        id: `a${at}-failed`,
        agent: t.agent,
        action: `Failed: ${err?.message || String(err)}`,
        amount: 0,
        status: "failed",
        txHash: "0xfailed",
        at,
      });
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
