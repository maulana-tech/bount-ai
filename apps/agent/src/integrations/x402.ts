import { keccak256, toHex, type Address, type Hex } from "viem";
import { config } from "../config.js";

/**
 * Klien pembayaran x402: menangani HTTP 402 dari layanan berbayar, "membayar",
 * lalu mengulang request. Loop 402 → bayar → 200 ini NYATA (lawan mock seller).
 *
 * Settlement-nya masih SIMULATED: di produksi, langkah bayar = menandatangani
 * otorisasi pembayaran x402 (EIP-3009 transferWithAuthorization USDC) dan
 * menyelesaikannya lewat facilitator/1Shot. Di sini kita hasilkan referensi
 * settlement deterministik agar alurnya bisa dijalankan tanpa dana.
 */

export interface X402Accept {
  scheme: string;
  network: string;
  /** jumlah dalam unit terkecil aset (USDC = 6 desimal) */
  maxAmountRequired: string;
  asset: Address;
  payTo: Address;
  resource: string;
  description?: string;
}

export interface X402Requirements {
  x402Version: number;
  accepts: X402Accept[];
}

export interface PaidFetchResult<T> {
  data: T;
  /** jumlah yang dibayar (USD) */
  paid: number;
  /** referensi settlement (tx hash on-chain di produksi; simulasi di sini) */
  txHash: Hex;
  settlement: "simulated" | "onchain";
}

function localSellerBuy(urlStr: string, xPaymentHeader?: string) {
  // Simple search params extraction since URL parsing might fail on relative urls
  const getParam = (name: string) => {
    const reg = new RegExp(`[?&]${name}=([^&#]*)`, "i");
    const val = reg.exec(urlStr);
    return val ? decodeURIComponent(val[1]) : null;
  };

  const product = getParam("product") ?? "dataset";
  const max = getParam("amount") ?? "1000000";
  const payToParam = getParam("payTo");
  const payTo = /^0x[0-9a-fA-F]{40}$/.test(payToParam ?? "") ? payToParam! : "0x000000000000000000000000000000000000dEaD";
  
  if (!xPaymentHeader) {
    return {
      status: 402,
      json: {
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: config.chain.name,
            maxAmountRequired: max,
            asset: config.usdc,
            payTo,
            resource: `/seller/buy?product=${product}`,
            description: `${product} service`,
          },
        ],
      },
    };
  }

  const q = getParam("q") ?? "";
  return {
    status: 200,
    json: {
      product,
      data: `<${product}> output for "${q}"`,
      source: "mock-seller",
    },
  };
}

export async function paidFetch<T = unknown>(
  url: string,
  payer: { address: Address },
  opts?: { maxPayUsd?: number },
): Promise<PaidFetchResult<T>> {
  const isLocalSeller = url.includes("/seller/buy");

  const fetchJson = async (targetUrl: string, headers?: Record<string, string>) => {
    if (isLocalSeller) {
      const res = localSellerBuy(targetUrl, headers?.["X-PAYMENT"] || headers?.["x-payment"]);
      return {
        status: res.status,
        ok: res.status >= 200 && res.status < 300,
        json: async () => res.json,
      };
    } else {
      const res = await fetch(targetUrl, { headers });
      return {
        status: res.status,
        ok: res.ok,
        json: async () => res.json(),
      };
    }
  };

  const first = await fetchJson(url);

  if (first.status !== 402) {
    if (!first.ok) throw new Error(`seller responded ${first.status}`);
    return {
      data: (await first.json()) as T,
      paid: 0,
      txHash: ("0x" + "0".repeat(64)) as Hex,
      settlement: "simulated",
    };
  }

  const reqs = (await first.json()) as X402Requirements;
  const accept = reqs.accepts?.[0];
  if (!accept) throw new Error("402 without payment requirements");

  const amountUsd = Number(accept.maxAmountRequired) / 1_000_000;
  if (opts?.maxPayUsd != null && amountUsd > opts.maxPayUsd) {
    throw new Error(
      `payment ${amountUsd} exceeds delegated cap ${opts.maxPayUsd}`,
    );
  }

  // --- SIMULATED settlement (lihat catatan di atas) ---
  const txHash = keccak256(
    toHex(`${payer.address}:${accept.resource}:${accept.maxAmountRequired}`),
  );
  const payment = btoa(
    JSON.stringify({
      scheme: accept.scheme,
      network: accept.network,
      from: payer.address,
      to: accept.payTo,
      asset: accept.asset,
      amount: accept.maxAmountRequired,
      settlement: txHash,
    }),
  );

  const second = await fetchJson(url, { "X-PAYMENT": payment });
  if (!second.ok) throw new Error(`retry after payment responded ${second.status}`);

  return {
    data: (await second.json()) as T,
    paid: amountUsd,
    txHash,
    settlement: "simulated",
  };
}
