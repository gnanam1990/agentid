# AgentID

Public identity and reputation pages for AI agents and wallets on Kite.

AgentID turns a Kite address into a readable profile surface: live KiteScan
activity, estimated reputation tiers, token/activity stats, and local-only
profile previews. The app is read-only in production: it does not connect a
wallet and does not send transactions.

## Live Data

- Kite Mainnet and Testnet address lookup
- KiteScan address counters, balances, token holdings, transactions, and token transfers
- 60 second in-memory client cache for repeated lookups
- Honest empty/error states when an address has no on-chain history or KiteScan is unavailable

## Preview-Only Surfaces

- Sample featured agents are curated demo entries
- Tipping modal is preview-only and does not send funds
- Profile edits are local browser overlays only
- AgentScore tiers are estimated from public activity until a dedicated backend ships

## Run Locally

```bash
pnpm install
pnpm dev
```

The development server runs on `http://localhost:3000`.

## Build

```bash
pnpm lint
pnpm build
```

No runtime secrets are required for the current read-only deployment.

## Deploy

This is a static Vite app and can be deployed directly to Vercel:

```bash
vercel deploy --prod
```
