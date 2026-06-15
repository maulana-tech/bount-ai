import { Hono } from "hono";
import type { Delegation } from "@metamask/delegation-toolkit";
import type { Capability } from "../shared.js";
import { runSpike } from "../spike.js";
import { getCapabilities } from "../integrations/oneshot.js";
import { agentIdentity } from "../integrations/delegation.js";
import { SELLER } from "./seller.js";

/**
 * Validasi root delegation yang ditandatangani client. Toolkit v0.13 memakai
 * `salt` bertipe Hex (mis. "0x") + field lain hex string, jadi objek JSON dari
 * client langsung valid sebagai `Delegation` — cukup pastikan field intinya ada.
 */
function reviveDelegation(raw: unknown): Delegation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.delegate !== "string" || typeof o.delegator !== "string") return null;
  if (typeof o.signature !== "string" || !Array.isArray(o.caveats)) return null;
  return o as unknown as Delegation;
}

/** Sanitasi agent custom yang dikirim klien (jangan percaya input mentah). */
function sanitizeAgents(raw: unknown): Capability[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x): Capability[] => {
    if (!x || typeof x !== "object") return [];
    const o = x as Record<string, unknown>;
    const id = String(o.id ?? "").trim().slice(0, 48);
    const label = String(o.label ?? "").trim().slice(0, 48);
    if (!id || !label) return [];
    const cost = Number(o.unitCostUsd);
    return [
      {
        id,
        label,
        description: String(o.description ?? "").slice(0, 240),
        keywords: Array.isArray(o.keywords)
          ? o.keywords.map((k) => String(k)).slice(0, 24)
          : [],
        unitCostUsd: Number.isFinite(cost)
          ? Math.min(Math.max(cost, 0.1), 100)
          : 1,
        product: String(o.product ?? "custom").slice(0, 32),
      },
    ];
  });
}

/**
 * POST /spike { request, capabilities?, rootDelegation?, cap? } → SpikeResult.
 * Bila `rootDelegation` (ditandatangani wallet user) ada, ia jadi root grant
 * nyata; jika tidak, jalur lama (root di-generate server) untuk demo tanpa wallet.
 */
export const spikeRoute = new Hono()
  .post("/", async (c) => {
    const body = await c.req
      .json<{
        request?: string;
        capabilities?: unknown;
        rootDelegation?: unknown;
        cap?: unknown;
      }>()
      .catch(() => ({}) as Record<string, unknown>);
    const request =
      (body.request as string)?.trim() ||
      "research 3 competitors, then make a poster";

    const root = reviveDelegation(body.rootDelegation);
    const capUsd = Number(body.cap);
    const grant =
      root && Number.isFinite(capUsd) && capUsd > 0
        ? { root, capUsd: Math.min(capUsd, 1000) }
        : undefined;

    const result = await runSpike(
      request,
      sanitizeAgents(body.capabilities),
      grant,
    );
    return c.json(result);
  })
  // GET /spike/agent — identitas delegate agent untuk membangun grant di client.
  .get("/agent", (c) => c.json({ ...agentIdentity(), seller: SELLER }))
  // GET /spike/capabilities — probe 1Shot relayer (null bila belum dikonfigurasi).
  .get("/capabilities", async (c) => {
    const caps = await getCapabilities();
    return c.json({ configured: caps !== null, capabilities: caps });
  });
