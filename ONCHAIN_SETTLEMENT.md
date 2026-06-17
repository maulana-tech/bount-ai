# On-Chain x402 Settlement — Setup

How to switch x402 payments from **simulated** to **real on-chain USDC transfers** on Base Sepolia (testnet — no real money). Default is OFF; the demo works without this.

## What it does

When enabled, after the x402 `402 → pay → retry` handshake, the funded **payer** account performs a real `USDC.transfer(payTo, amount)` on Base Sepolia. The agent returns `settlement: "onchain"` with a **real tx hash** (viewable on BaseScan). The amount is bounded by the sub-budget from the ERC-7710 redelegation (enforced in the x402 loop). If anything is missing (flag off, no key, no gas, insufficient USDC, wrong chain, RPC error), it **safely falls back** to `simulated` — the demo never breaks.

> Implementation: `apps/agent/src/integrations/settlement.ts` (called from `apps/agent/src/spike.ts`). This does a direct USDC transfer by the payer; the full `redeemDelegations` execution from a Smart-Account delegator (deploy + bundler) is the next step.

## Environment variables (`apps/agent/.env.local` and/or Vercel project `bount-ai-agent`)

| Var | Value | Notes |
| --- | --- | --- |
| `ENABLE_ONCHAIN_SETTLEMENT` | `1` | Master switch. Anything else = simulated. |
| `SETTLEMENT_PRIVATE_KEY` | `0x` + 64 hex | The **payer** key. Its address holds the testnet USDC + ETH. Can reuse `AGENT_DELEGATE_PRIVATE_KEY`. |
| `RPC_URL` | `https://sepolia.base.org` | Base Sepolia RPC (public works; or use your own/Alchemy). |
| `CHAIN_ID` | `84532` | Must be Base Sepolia (default). On-chain settlement only supports 84532 for now. |
| `USDC_ADDRESS` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Circle USDC on Base Sepolia (default). |

## Step-by-step

### 1. Set the env vars

Local (`apps/agent/.env.local`):

```bash
ENABLE_ONCHAIN_SETTLEMENT=1
SETTLEMENT_PRIVATE_KEY=0x<your 64-hex key>   # can equal AGENT_DELEGATE_PRIVATE_KEY
RPC_URL=https://sepolia.base.org
```

> Find the payer **address** from the key (or, if reusing the delegate key, it's whatever `GET /spike/agent` returns). Current local payer: `0xCE1BF39E65782b429074Ce4b1571b034AA31c8d5`.

### 2. Fund the payer address (Base Sepolia)

- **ETH (gas)** — send a small amount (~`0.005` ETH is plenty) from any Base Sepolia faucet or your existing testnet ETH.
- **USDC (the asset transferred)** — get it from the **Circle faucet: https://faucet.circle.com** → select **Base Sepolia** → send to the payer address. A few USDC covers many runs (each task costs $0.20–$1.00).

### 3. Run

```bash
pnpm dev:agent          # loads .env.local automatically
# in another shell:
curl -s -X POST http://localhost:8787/spike \
  -H 'content-type: application/json' \
  -d '{"request":"research coffee"}' | jq '.settlement, .activity[].txHash'
```

Expect `settlement: "onchain"` and a real tx hash → open `https://sepolia.basescan.org/tx/<hash>`.

> Tip: use a **single-agent** request (e.g. `"research coffee"`) so it's one transfer = one tx (fast + cheap).

### 4. Enable on the deployed agent (Vercel)

Set the same three vars on the **`bount-ai-agent`** Vercel project, fund the address of the `SETTLEMENT_PRIVATE_KEY` you set there, and redeploy.

## Verify it's working / why it fell back

The agent logs the exact reason on fallback:

- `has 0 gas — simulated` → fund the payer with Base Sepolia ETH.
- `USDC <have> < needed <amount> — simulated` → fund the payer with testnet USDC.
- `on-chain only supports Base Sepolia` → set `CHAIN_ID=84532`.
- nothing logged + `simulated` → `ENABLE_ONCHAIN_SETTLEMENT` not `1`, or key/RPC missing.

## Notes & safety

- **Testnet only** — Base Sepolia USDC + ETH are free from faucets; no real money.
- **`payTo`** is the x402 seller (currently the dummy `0x…dEaD`). Transfers to it are still real on-chain txs (valid proof) but the USDC is unrecoverable. To keep funds, point the mock seller `payTo` (`SELLER` in `apps/agent/src/routes/seller.ts`) at an address you control.
- **Never commit keys** — `.env.local` is gitignored. Rotate any key that has been shared.
- **USDC must support EIP-3009 / standard `transfer`** — Circle's Base Sepolia USDC does.
