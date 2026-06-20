import {
  createDelegation,
  getDeleGatorEnvironment,
} from "@metamask/delegation-toolkit";
import { signDelegation } from "@metamask/delegation-toolkit/actions";
import { createCaveatBuilder } from "@metamask/delegation-toolkit/utils";
import type { Address, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * Grant nyata: user menandatangani root delegation ERC-7710 dengan wallet-nya
 * (popup MetaMask, off-chain) — caveat spending-limit (erc20TransferAmount) jadi
 * plafon budget, mendelegasikan ke alamat delegate agent. Hasilnya disimpan di budget
 * store dan dikirim ke `/spike` sebagai root; agent meredelegasi ke specialist dari situ.
 */

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8787";

export interface AgentIdentity {
  address: Address;
  chainId: number;
  delegationManager: Address;
  usdc: Address;
  seller: Address;
}

/** Delegation diserialisasi (bigint→string) agar aman di JSON + localStorage. */
export type SerializedDelegation = Record<string, unknown>;

export interface SignedGrant {
  rootDelegation: SerializedDelegation;
  cap: number;
}

export async function fetchAgentIdentity(): Promise<AgentIdentity> {
  const r = await fetch(`${AGENT_URL}/spike/agent`);
  if (!r.ok) throw new Error("agent identity unavailable");
  return (await r.json()) as AgentIdentity;
}

const toUsdc = (usd: number): bigint => BigInt(Math.round(usd * 1_000_000));

const serialize = (d: unknown): SerializedDelegation =>
  JSON.parse(
    JSON.stringify(d, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  );

export async function signBudgetGrant(
  wallet: WalletClient,
  account: Address,
  capUsd: number,
): Promise<SignedGrant> {
  const id = await fetchAgentIdentity();
  const environment = getDeleGatorEnvironment(id.chainId);
  const caveats = createCaveatBuilder(environment)
    .addCaveat("allowedTargets", { targets: [id.seller] })
    .build();
  const delegation = createDelegation({
    environment,
    scope: {
      type: "erc20TransferAmount",
      tokenAddress: id.usdc,
      maxAmount: toUsdc(capUsd),
    },
    from: account,
    to: id.address,
    caveats,
  });
  const signature = await signDelegation(wallet, {
    account,
    delegation,
    delegationManager: id.delegationManager,
    chainId: id.chainId,
  });
  return { rootDelegation: serialize({ ...delegation, signature }), cap: capUsd };
}

export async function signBudgetGrantWithPrivateKey(
  privateKey: string,
  capUsd: number,
): Promise<SignedGrant> {
  const id = await fetchAgentIdentity();
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const environment = getDeleGatorEnvironment(id.chainId);
  const caveats = createCaveatBuilder(environment)
    .addCaveat("allowedTargets", { targets: [id.seller] })
    .build();
  const delegation = createDelegation({
    environment,
    scope: {
      type: "erc20TransferAmount",
      tokenAddress: id.usdc,
      maxAmount: toUsdc(capUsd),
    },
    from: account.address,
    to: id.address,
    caveats,
  });

  const wallet = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const signature = await signDelegation(wallet as any, {
    account: account.address,
    delegation,
    delegationManager: id.delegationManager,
    chainId: id.chainId,
  });

  return { rootDelegation: serialize({ ...delegation, signature }), cap: capUsd };
}
