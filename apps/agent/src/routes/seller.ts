import { Hono } from "hono";
import { config } from "../config.js";

/**
 * Mock x402 seller — berdiri sendiri agar loop pembayaran x402 bisa dijalankan
 * lokal tanpa layanan pihak ketiga. Multi-produk (dataset/text/image/video/
 * audio) supaya tiap kapabilitas punya sesuatu untuk dibayar. Tanpa header
 * X-PAYMENT → 402 + payment requirements; dengan header → 200 + data.
 *
 * ⚠️ Pengganti Fase 2 untuk "layanan berbayar" sampai seller x402 nyata /
 * endpoint Venice x402 dipasang (PROJECT.md §10).
 */
export const SELLER = "0x000000000000000000000000000000000000dEaD" as const;

/** Harga per produk dalam unit USDC (6 desimal). */
const PRICES: Record<string, string> = {
  dataset: "2000000", // $2
  text: "1000000", // $1
  image: "5000000", // $5
  video: "8000000", // $8
  audio: "3000000", // $3
};

export const sellerRoute = new Hono().get("/buy", (c) => {
  const product = c.req.query("product") ?? "dataset";
  const max = PRICES[product] ?? "1000000";
  const payment = c.req.header("x-payment");

  if (!payment) {
    return c.json(
      {
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: config.chain.name,
            maxAmountRequired: max,
            asset: config.usdc,
            payTo: SELLER,
            resource: `/seller/buy?product=${product}`,
            description: `${product} service`,
          },
        ],
      },
      402,
    );
  }

  const q = c.req.query("q") ?? "";
  return c.json({
    product,
    data: `<${product}> output for "${q}"`,
    source: "mock-seller",
  });
});
