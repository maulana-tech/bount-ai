import {
  createDelegation,
  getDeleGatorEnvironment,
  signDelegation,
  type Delegation,
  type DeleGatorEnvironment,
} from "@metamask/delegation-toolkit";
import {
  createCaveatBuilder,
  getDelegationHashOffchain,
} from "@metamask/delegation-toolkit/utils";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Address, Hex } from "viem";
import { config } from "../config.js";

/**
 * Inti ERC-7710: membangun delegasi dengan caveat granular (spending limit +
 * allowedTargets), mendelegasikan ulang (redelegation) dengan menyempitkan
 * wewenang, dan menandatanganinya OFF-CHAIN (tanpa gas/dana).
 *
 * Catatan produksi: di app nyata, `from` adalah MetaMask Smart Account
 * (`toMetaMaskSmartAccount`, Implementation.Hybrid) dan wallet pengguna yang
 * menandatangani + melakukan 7702 upgrade. Di spike ini kita pakai EOA hasil
 * generate agar konstruksi + tanda tangan + hash bisa diverifikasi tanpa dana.
 */

export type Party = { privateKey: Hex; address: Address };

export function newParty(): Party {
  const privateKey = generatePrivateKey();
  return { privateKey, address: privateKeyToAccount(privateKey).address };
}

/**
 * Party delegate ven-AI yang STABIL — alamatnya di-expose ke client lewat
 * `GET /spike/agent` agar user bisa menandatangani root delegation yang
 * mendelegasikan ke alamat ini. Persisten via `AGENT_DELEGATE_PRIVATE_KEY`;
 * tanpa env, di-generate sekali per proses (cukup untuk demo).
 */
let cachedAgent: Party | null = null;
export function agentParty(): Party {
  if (cachedAgent) return cachedAgent;
  const env = process.env.AGENT_DELEGATE_PRIVATE_KEY;
  if (env && /^0x[0-9a-fA-F]{64}$/.test(env)) {
    cachedAgent = { privateKey: env as Hex, address: privateKeyToAccount(env as Hex).address };
  } else {
    cachedAgent = newParty();
    console.log(
      `[agent] delegate address ${cachedAgent.address} (ephemeral — set AGENT_DELEGATE_PRIVATE_KEY to persist across restarts)`,
    );
  }
  return cachedAgent;
}

/** Identitas yang dibutuhkan client untuk membangun + menandatangani grant. */
export function agentIdentity(): {
  address: Address;
  chainId: number;
  delegationManager: Address;
  usdc: Address;
} {
  const { env, chainId } = environment();
  return {
    address: agentParty().address,
    chainId,
    delegationManager: env.DelegationManager,
    usdc: USDC,
  };
}

/** Ambil environment (alamat DelegationManager + enforcer) untuk chain target. */
export function environment(): { env: DeleGatorEnvironment; chainId: number } {
  const chainId = config.chain.id;
  try {
    return { env: getDeleGatorEnvironment(chainId), chainId };
  } catch {
    // Fallback ke Sepolia bila chain target belum punya deployment di toolkit.
    return { env: getDeleGatorEnvironment(11155111), chainId: 11155111 };
  }
}

export const USDC = config.usdc;

/** USD (float) → unit USDC (6 desimal). */
export function toUsdc(usd: number): bigint {
  return BigInt(Math.round(usd * 1_000_000));
}

/**
 * Bangun + tandatangani satu delegasi dengan:
 * - scope `erc20TransferAmount` → plafon pengeluaran USDC (spending limit)
 * - caveat `allowedTargets` → whitelist kontrak/penerima yang boleh dipanggil
 * Jika `parent` diberikan, ini menjadi REDELEGASI (hanya boleh menyempit).
 */
export async function buildSpendingDelegation(params: {
  from: Party;
  to: Address;
  capUsdc: bigint;
  allowedTargets: Address[];
  parent?: Delegation;
}): Promise<Delegation> {
  const { env, chainId } = environment();

  const caveats = createCaveatBuilder(env)
    .addCaveat("allowedTargets", { targets: params.allowedTargets })
    .build();

  const delegation = createDelegation({
    environment: env,
    scope: {
      type: "erc20TransferAmount",
      tokenAddress: USDC,
      maxAmount: params.capUsdc,
    },
    from: params.from.address,
    to: params.to,
    caveats,
    ...(params.parent ? { parentDelegation: params.parent } : {}),
  });

  const signature = await signDelegation({
    privateKey: params.from.privateKey,
    delegation,
    delegationManager: env.DelegationManager,
    chainId,
  });

  return { ...delegation, signature };
}

/** Hash delegasi off-chain — dipakai sebagai bukti di UI. */
export function delegationHash(d: Delegation): Hex {
  return getDelegationHashOffchain(d);
}
