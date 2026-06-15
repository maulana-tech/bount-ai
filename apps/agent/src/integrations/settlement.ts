import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { config } from "../config.js";

/**
 * Settlement on-chain (gated) — pasangan nyata dari x402. Default OFF (return
 * null → caller fallback ke simulasi). ON saat env lengkap; lalu delegate yang
 * didanai melakukan transfer USDC SUNGGUHAN ke `payTo` di Base Sepolia dan
 * mengembalikan tx hash asli. Jumlah sudah dibatasi cap hasil redelegasi
 * (di-enforce di loop x402). Apa pun errornya → fallback ke simulasi, jadi
 * demo tak pernah putus.
 *
 * Catatan: ini transfer USDC langsung oleh delegate (cara x402 men-settle).
 * Versi penuh `redeemDelegations` (eksekusi dari Smart Account delegator)
 * butuh deploy SA + bundler — langkah berikutnya; di sini otoritas/budget
 * tetap diatur oleh delegasi off-chain + cap enforcement.
 */

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
]);

export function onchainSettlementEnabled(): boolean {
  const s = config.settlement;
  return Boolean(s.enabled && s.privateKey && s.rpcUrl);
}

export interface SettleParams {
  /** penerima pembayaran (seller / payTo dari x402) */
  payTo: Address;
  /** jumlah dalam unit USDC (6 desimal) */
  amountUsdc: bigint;
}

export async function settleOnchain(
  params: SettleParams,
): Promise<{ txHash: Hex } | null> {
  if (!onchainSettlementEnabled()) return null;

  // On-chain settlement saat ini hanya untuk Base Sepolia.
  if (config.chain.id !== baseSepolia.id) {
    console.warn(
      `[settlement] on-chain only supports Base Sepolia (got chain ${config.chain.id}) — simulated`,
    );
    return null;
  }

  try {
    const account = privateKeyToAccount(config.settlement.privateKey as Hex);
    const transport = http(config.settlement.rpcUrl);
    const publicClient = createPublicClient({ chain: baseSepolia, transport });
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport,
    });

    const [gas, usdc] = await Promise.all([
      publicClient.getBalance({ address: account.address }),
      publicClient.readContract({
        address: config.usdc,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      }),
    ]);

    if (gas === 0n) {
      console.warn(
        `[settlement] payer ${account.address} has 0 gas — simulated`,
      );
      return null;
    }
    if (usdc < params.amountUsdc) {
      console.warn(
        `[settlement] payer ${account.address} USDC ${usdc} < needed ${params.amountUsdc} — simulated`,
      );
      return null;
    }

    const txHash = await walletClient.writeContract({
      address: config.usdc,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [params.payTo, params.amountUsdc],
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`[settlement] on-chain USDC transfer settled: ${txHash}`);
    return { txHash };
  } catch (err) {
    console.error("[settlement] on-chain attempt failed, falling back:", err);
    return null;
  }
}
