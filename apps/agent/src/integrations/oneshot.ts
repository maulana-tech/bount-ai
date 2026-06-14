import type { PaymentStatus } from "../shared.js";
import { config } from "../config.js";

/**
 * Klien 1Shot Permissionless Relayer — merelay transaksi ERC-7710 ke chain,
 * gas dibayar stablecoin, plus 7702 upgrade. Status datang via webhook.
 *
 * Temuan Fase 0: JANGAN hardcode chain — panggil `relayer_getCapabilities`
 * sebagai sumber kebenaran. Eksekusi relay butuh key + dana → di-gate.
 */

export interface RelayResult {
  txHash: string;
  status: PaymentStatus;
}

/**
 * Probe kapabilitas relayer (chain, token gas, feeCollector). Mengembalikan
 * null bila relayerUrl belum dikonfigurasi (gated) — bukan error.
 */
export async function getCapabilities(): Promise<unknown | null> {
  const url = config.oneshot.relayerUrl;
  if (!url) return null;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.oneshot.apiKey
        ? { authorization: `Bearer ${config.oneshot.apiKey}` }
        : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "relayer_getCapabilities",
      params: [],
    }),
  });
  if (!res.ok) throw new Error(`1Shot relayer responded ${res.status}`);
  return res.json();
}

/** Upgrade akun EOA → smart account via 7702. Di flow browser ERC-7715, wallet
 * yang menangani ini — jangan kirim authorizationList ke relayer. */
export async function upgradeAccount(_address: string): Promise<RelayResult> {
  throw new Error("upgradeAccount: belum diimplementasi (Fase 2 on-chain)");
}

/** Relay transaksi delegasi (7710) lewat relayer. */
export async function relayTransaction(_payload: unknown): Promise<RelayResult> {
  throw new Error("relayTransaction: belum diimplementasi (Fase 2 on-chain)");
}

/** Verifikasi tanda tangan webhook 1Shot (Ed25519 via public key). */
export async function verifyWebhook(body: string, signature: string): Promise<boolean> {
  const pubKeyB64 = config.oneshot.webhookSecret;
  if (!pubKeyB64 || !signature) return false;

  try {
    const pubKeyBytes = Uint8Array.from(atob(pubKeyB64), (c) => c.charCodeAt(0));
    const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      pubKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    return await crypto.subtle.verify("Ed25519", key, sigBytes, encoder.encode(body));
  } catch {
    return false;
  }
}
