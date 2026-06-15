import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Delegation } from "@metamask/delegation-toolkit";
import { config } from "../config.js";

/**
 * Settlement on-chain (gated) — pasangan dari x402 simulasi. Arsitektur
 * dual-mode: default OFF (return null → caller fallback ke simulasi). ON saat
 * env lengkap; lalu MENCOBA `redeemDelegations` nyata, dan APA PUN errornya
 * tetap fallback ke simulasi supaya demo tak pernah putus.
 *
 * ⚠️ Status: SEAM siap (gating + client + saldo + fallback teruji). Panggilan
 * `redeemDelegations` sengaja belum diaktifkan — butuh (a) delegator berupa
 * MetaMask Smart Account (bukan EOA) dan (b) caveat konsisten-redemption
 * (allowedTargets = token USDC, bukan seller). Lihat PROJECT.md / catatan grant.
 */

export function onchainSettlementEnabled(): boolean {
  const s = config.settlement;
  return Boolean(s.enabled && s.privateKey && s.rpcUrl);
}

export interface SettleParams {
  /** Rantai delegasi penuh [child, …, root] sebagai permission context. */
  permissionContext: Delegation[];
  /** Penerima pembayaran (seller). */
  payTo: Address;
  /** Jumlah dalam unit USDC (6 desimal). */
  amountUsdc: bigint;
}

let cachedPublic: PublicClient | null = null;
function publicClient(): PublicClient {
  if (!cachedPublic) {
    cachedPublic = createPublicClient({
      transport: http(config.settlement.rpcUrl),
    });
  }
  return cachedPublic;
}

/**
 * Coba settle on-chain. Return `{ txHash }` bila sukses, atau `null` agar caller
 * jatuh ke simulasi. Tidak pernah throw ke caller.
 */
export async function settleOnchain(
  params: SettleParams,
): Promise<{ txHash: Hex } | null> {
  if (!onchainSettlementEnabled()) return null;

  try {
    const account = privateKeyToAccount(config.settlement.privateKey as Hex);
    const wallet = createWalletClient({
      account,
      transport: http(config.settlement.rpcUrl),
    });
    const pub = publicClient();

    // Guard saldo gas — tanpa ETH, redeem pasti gagal: fallback lebih awal.
    const balance = await pub.getBalance({ address: account.address });
    if (balance === 0n) {
      console.warn(
        `[settlement] delegate ${account.address} has 0 gas — falling back to simulated`,
      );
      return null;
    }

    // --- SEAM: redeem nyata diisi di Stage 3 (butuh smart-account delegator
    // + caveat redemption-konsisten + dana testnet). Sampai itu, fallback. ---
    void wallet;
    void params;
    console.warn(
      "[settlement] on-chain enabled but redeem not yet wired — falling back to simulated",
    );
    return null;
  } catch (err) {
    console.error("[settlement] on-chain attempt failed, falling back:", err);
    return null;
  }
}
