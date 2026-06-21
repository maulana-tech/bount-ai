import { Hono } from "hono";
import type { Delegation } from "@metamask/delegation-toolkit";
import type { Capability } from "../shared.js";
import { runSpike } from "../spike.js";
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
  
  const scope = o.scope as any;
  const parsedScope = scope
    ? {
        ...scope,
        maxAmount: typeof scope.maxAmount === "string" || typeof scope.maxAmount === "number"
          ? BigInt(scope.maxAmount)
          : scope.maxAmount
      }
    : undefined;

  return {
    delegate: o.delegate,
    delegator: o.delegator,
    authority: (o.authority as string) || "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    salt: (o.salt as string) || "0x",
    signature: o.signature,
    caveats: o.caveats as any[],
    scope: parsedScope,
  } as unknown as Delegation;
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
    const creator = String(o.creator ?? "");
    const validCreator = /^0x[0-9a-fA-F]{40}$/.test(creator);
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
        ...(validCreator ? { creator } : {}),
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
        apiKey?: string;
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

    const authHeader = c.req.header("Authorization") || "";
    let apiKey = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (apiKey.startsWith("mock_jwt_token_preauth_")) {
      apiKey = apiKey.replace("mock_jwt_token_preauth_", "");
    }
    if (!apiKey && typeof body.apiKey === "string") {
      apiKey = body.apiKey;
    }

    const result = await runSpike(
      request,
      sanitizeAgents(body.capabilities),
      grant,
      apiKey || undefined,
    );
    return c.json(result);
  })
  // GET /spike/agent — identitas delegate agent untuk membangun grant di client.
  .get("/agent", (c) => c.json({ ...agentIdentity(), seller: SELLER }))
  // GET /spike/capabilities — disabled (1Shot removed)
  .get("/capabilities", (c) => {
    return c.json({ configured: false, capabilities: null });
  });
