# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Phase 2 vertical slice works. Fase 0 (de-risk) and Fase 1 (scaffold + visual) are done; the on-chain spine is built as a runnable spike. The agent's `POST /spike` runs: plan → root delegation (user→bount-AI) → **redelegation** to specialists with **caveats** (erc20 spending-limit scope + allowedTargets) → x402 payment loop against a local mock seller → returns a real `SpikeResult` (delegation hashes as proof + activity trace). The **`/app/chat`** page (`lib/agent.ts → runSpike`) calls it and renders the real outputs + trace; the `/app` dashboard is now a static card/preview overview (`PromptBar`/`ResultPanel` still exist but are no longer wired into the main flow). What is still simulated/gated (needs funds + keys): on-chain settlement of x402 payments and the 1Shot relay. See `PROJECT.md` §10–11 for findings and next steps.

## Monorepo layout

pnpm workspaces. Run commands from the repo root.

```
apps/web/        Next.js frontend (dashboard, wallet, components)
apps/agent/      Hono service: Concierge orchestration, Venice/x402/1Shot
packages/shared/ TS domain types shared by web ⇄ agent (@concierge/shared)
*.md             docs (CONTEXT, PROJECT, UI_GUIDE, README, AGENTS, this file) at root
```

## Commands

```bash
pnpm install                 # install all workspaces
pnpm dev                     # run web + agent in parallel
pnpm dev:web                 # web only (http://localhost:3000)
pnpm dev:agent               # agent only (http://localhost:8787)
pnpm build                   # build web (validates SSR + types)
pnpm -r typecheck            # typecheck every package
pnpm --filter @concierge/web lint
```

Env: each app has its own `.env.example` → copy to `.env.local`. `NEXT_PUBLIC_WC_PROJECT_ID` (WalletConnect/Reown) for real wallet connect; `VENICE_API_KEY` / `ONESHOT_*` for the agent (Fase 2–3). Builds/typechecks work without any of them.

## Stack & architecture

- **`apps/web`** — Next.js 15 (App Router) + React 19 + Tailwind 3. Web3: RainbowKit + wagmi + viem (config in `src/lib/wagmi.ts`, chains = sepolia + mainnet placeholder — ⚠️ confirm 1Shot-supported chain in Fase 0; providers in `src/app/providers.tsx`).
- **`apps/agent`** — Hono server (CORS open for dev). The agent is **general, not task-specific**: the capability registry lives in `@concierge/shared` (`capabilities.ts` — research, writing, image, video, audio, translate; extend by adding an entry, and both the agent and the web Agents page pick it up). The agent's `capabilities.ts` holds only the selection logic; the planner dynamically selects a subset per request (keyword heuristic now; Venice reasoning in Fase 3). **Hybrid model:** users can also create custom agents on `/app/agents` — stored client-side (`lib/customAgents.ts`, localStorage) and sent in the `/spike` body (`capabilities`), where the agent sanitizes them and merges them into the selection pool (so the AI can pick them and they pay their declared cost via the mock seller's `amount` param). Nothing is hardcoded to research/poster — those are just example capabilities. Modular by responsibility: `concierge/` (planner), `agents/` (research, media, text), `integrations/` (`delegation` — real ERC-7710 build+caveats+redelegation+offchain-sign via `@metamask/delegation-toolkit`; `x402` — real 402→pay→retry loop, settlement simulated; `oneshot` — 1Shot `getCapabilities` gated by `ONESHOT_RELAYER_URL`, relay still stubbed; `venice` — stub), `routes/` (`plan`, `webhook`, `seller` = local mock x402 seller, `spike`), and `spike.ts` (the orchestrator). Endpoints: `GET /health`, `POST /plan`, `POST /spike`, `GET /spike/capabilities`, `GET /seller/data`, `POST /webhook/oneshot`. Entry `src/index.ts` (Node server) → `app.ts` (Hono app wiring). Target chain Base (config `CHAIN_ID`, default Base Sepolia 84532).
- **`packages/shared`** — domain contract (`ActivityEvent`, `DelegationNode`, `TaskPlan`, `Grant`, …). Published as TS source; web consumes it via `transpilePackages` in `next.config.ts`. Change a type here → both sides update.
- **Components are split, one concern per file** under `apps/web/src/components/` (Navbar, Footer, BudgetMeter, DelegationChain, ActivityFeed, ResultPanel, PromptBar, AgentCard, CreateAgentForm, MarkdownText, Modal, `landing/` sections, plus `ui/` primitives). `page.tsx` files are composition only. Don't collapse them back into one file. Routes: `/` (landing), `/app` (dashboard overview), `/app/chat` (live agent flow — calls `/spike`), `/app/agents` (specialist registry + custom-agent creation).
- **Design system source of truth (keep in sync):** `apps/web/tailwind.config.ts` holds color tokens (warm-paper light theme + bronze accent — deliberately NOT shadcn zinc default); `UI_GUIDE.md` holds the rationale + anti-slop rules. Read `UI_GUIDE.md` before any visual change. **Hard rules: no color gradients, no emoji/emote glyphs** — marks are CSS-drawn (see `components/Logo.tsx`).
- **Signature motif:** `apps/web/src/components/CornerFrame.tsx` wraps every panel (hairline border + L corner-brackets). Reuse it; never re-implement the markup.
- Fonts: Manrope (sans) + JetBrains Mono (all numbers/money/hashes use `font-mono` + `.tnum`).
- The dashboard renders dummy data from `apps/web/src/lib/mock.ts` (shaped to the shared contract). Real state arrives in Fase 3–4 (agent + 1Shot webhooks).

Known harmless build warning: `@react-native-async-storage/async-storage` not found — an optional RN dep pulled by MetaMask SDK, irrelevant on web.

## What this project is

A hackathon entry for the **MetaMask Smart Accounts Kit × 1Shot API** hackathon. The full prize tracks and judging criteria live in `CONTEXT.md` — read it before making product decisions, since prize eligibility is the primary design constraint.

## Hard requirements (these gate prize eligibility)

These come from `CONTEXT.md` and are non-negotiable for a valid submission:

- **MetaMask Smart Accounts Kit must be integrated in the main flow** — either Smart Accounts (delegation, execute on behalf of a smart account) or Advanced Permissions (ERC-7715, fine-grained permissions requested from users via the MetaMask extension). Signer-agnostic: any wallet provider works (MetaMask extension, Embedded Wallets, Dynamic, Privy).
- A demo video must show the MetaMask integration working in the main flow.

To qualify for a track, the project must target one of the three main tracks; the others are add-on bonus tracks that require qualifying for a main track first:

- **Best x402 + ERC-7710** — perform x402 payment calls using ERC-7710 redelegation.
- **Best Agent** — agentic app built on Smart Accounts / Advanced Permissions.
- **Best A2A Coordination** — must use **redelegation** (agent-to-agent delegation chains).

Bonus tracks (stack with a main track):

- **Best use of Venice AI** — use the Venice API (OpenAI-compatible; text/image/audio/music/video/crypto-RPC, x402 support) as a *core* part of the main flow, producing a meaningful AI-powered output/action. Scores higher when combined with MetaMask + on-chain data + x402 or multiple Venice endpoints.
- **Best Use of 1Shot Permissionless Relayer** — relay 7710 transactions through the 1Shot mainnet relayer, paying gas in stablecoins (USDC/USDT/etc.). Must use **7702 authorizations** to upgrade accounts to smart accounts via the relayer. Bonus for using relayer **webhooks** as the source of truth for transaction status.

## Key reference docs

- MetaMask Smart Accounts Kit — delegation, redelegation, Advanced Permissions (ERC-7715), x402 + 7710 payments (seller/buyer/recurring). See the Resources section of `CONTEXT.md`.
- 1Shot API relayer / gas sponsorship: https://1shotapi.com/docs/quickstarts/gas-sponsorship-eip7710
- Venice API: https://docs.venice.ai/overview/about-venice — skills: https://github.com/veniceai/skills
