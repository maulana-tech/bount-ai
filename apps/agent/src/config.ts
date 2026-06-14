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

  venice: {
    apiKey: process.env.VENICE_API_KEY ?? "",
    baseUrl: process.env.VENICE_BASE_URL ?? "https://api.venice.ai/api/v1",
  },
  oneshot: {
    apiKey: process.env.ONESHOT_API_KEY ?? "",
    webhookSecret: process.env.ONESHOT_WEBHOOK_SECRET ?? "",
    /** JSON-RPC relayer URL — kalau kosong, panggilan 1Shot di-gate. */
    relayerUrl: process.env.ONESHOT_RELAYER_URL ?? "",
  },
} as const;
