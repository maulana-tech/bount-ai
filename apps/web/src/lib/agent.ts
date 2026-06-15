import type { Capability, SpikeResult } from "@concierge/shared";
import type { SerializedDelegation } from "./grant";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8787";

export interface SpikeGrant {
  rootDelegation: SerializedDelegation;
  cap: number;
}

/**
 * Jalankan vertical-slice Fase 2 di service agent: plan → delegasi + redelegasi
 * (dengan caveat) → pembayaran x402. `capabilities` = agent custom user yang
 * digabung ke katalog bawaan saat pemilihan. `grant` (opsional) = root delegation
 * yang ditandatangani wallet user → jadi root nyata. Mengembalikan jejak nyata.
 */
export async function runSpike(
  request: string,
  capabilities: Capability[] = [],
  grant?: SpikeGrant,
): Promise<SpikeResult> {
  const res = await fetch(`${AGENT_URL}/spike`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      request,
      capabilities,
      ...(grant
        ? { rootDelegation: grant.rootDelegation, cap: grant.cap }
        : {}),
    }),
  });
  if (!res.ok) throw new Error(`agent responded ${res.status}`);
  return (await res.json()) as SpikeResult;
}
