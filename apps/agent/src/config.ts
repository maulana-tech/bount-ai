/** Konfigurasi service agent dari environment. */
export const config = {
  port: Number(process.env.PORT ?? 8787),
  /** Public URL of the agent itself (used to self-reference routes like /seller/buy). */
  agentUrl: process.env.AGENT_PUBLIC_URL ?? `http://localhost:${Number(process.env.PORT ?? 8787)}`,

  /**
   * Chain target (keputusan Fase 0: Base). Dev di Base Sepolia (84532).
   * Delegation+caveat dibangun & ditandatangani off-chain di sini — tidak butuh
   * dana. Eksekusi/relay on-chain menyusul (butuh USDC + key).
   */
  chain: {
    id: Number(process.env.CHAIN_ID ?? 84532), // base sepolia
    name: process.env.CHAIN_NAME ?? "base-sepolia",
  },
  /** USDC di Base Sepolia (untuk scope erc20TransferAmount). */
  usdc: (process.env.USDC_ADDRESS ??
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`,

  /**
   * Settlement on-chain (gated). Default OFF → pembayaran x402 disimulasi.
   * Aktif bila `ENABLE_ONCHAIN_SETTLEMENT=1` + ada `SETTLEMENT_PRIVATE_KEY`
   * (delegate yang punya gas) + `RPC_URL`. Bila aktif, agent mencoba redeem
   * delegasi on-chain; gagal/belum siap → fallback ke simulasi (demo tak putus).
   */
  settlement: {
    enabled: process.env.ENABLE_ONCHAIN_SETTLEMENT === "1",
    privateKey: (process.env.SETTLEMENT_PRIVATE_KEY ?? "") as `0x${string}` | "",
    rpcUrl: process.env.RPC_URL ?? "",
  },

  venice: {
    apiKey: process.env.VENICE_API_KEY ?? "",
    baseUrl: process.env.VENICE_BASE_URL ?? "https://api.venice.ai/api/v1",
    model: process.env.VENICE_MODEL ?? "openai-gpt-4o-mini-2024-07-18",
  },
  t3n: {
    apiKey: process.env.T3N_API_KEY ?? "",
    environment: process.env.T3N_ENVIRONMENT ?? "testnet",
  },
} as const;
