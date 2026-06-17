import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

/**
 * Konfigurasi wallet (RainbowKit + wagmi).
 *
 * Keputusan Fase 0 (lihat PROJECT.md §10): target = Base, jalur izin = ERC-7710
 * Smart Account delegation. Venice x402 (USDC/Base) + 1Shot hidup di Base, jadi
 * single-chain. Dev di Base Sepolia; demo "real" di Base mainnet.
 * ⚠️ Konfirmasi 1Shot `relayer_getCapabilities` untuk Base sebelum Fase 2.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "bount-AI",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "PLACEHOLDER_PROJECT_ID",
  chains: [baseSepolia, base],
  ssr: true,
});
