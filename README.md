# Ritual Watch

Ritual Watch is a production-oriented, public read-only explorer and analytics dashboard for Ritual Testnet. It tracks wallets, transactions, blocks, token activity, NFT activity, and `.ritual` identity records without wallet connection or signing.

## Stack

- Next.js 15 App Router
- TypeScript
- TailwindCSS and shadcn/ui-style primitives
- viem
- Recharts
- Prisma with Postgres or Supabase Postgres
- Background indexer worker

## Setup

```bash
npm install
cp .env.example .env.local
npm run db:generate
```

Fill in `DATABASE_URL` for complete indexed analytics and wallet history. The UI can still read a bounded recent window from RPC without a database, but full wallet history, complete token/NFT holdings, and daily aggregates need the indexer.

## Environment

```bash
NEXT_PUBLIC_RITUAL_CHAIN_ID=1979
NEXT_PUBLIC_RITUAL_RPC_URL=https://rpc.ritualfoundation.org
NEXT_PUBLIC_RITUAL_EXPLORER_URL=https://explorer.ritualfoundation.org
NEXT_PUBLIC_RITUAL_NAMES_CONTRACT=0xb9976C592f4E90B51bDa05B0B3d8b7735D24743A
DATABASE_URL=
INDEXER_START_BLOCK=
RITUAL_SCANNER_RPC_URL=https://scanner-rpc.ritualfoundation.org/
RITUAL_LIVE_TX_SCAN_BLOCKS=500
RITUAL_LIVE_LOG_SCAN_BLOCKS=5000
```

This project is Ritual Testnet only. Testnet assets have no real value.

## Run The App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database

Create the Postgres schema with Prisma:

```bash
npm run db:migrate
```

The schema includes:

- `indexed_state`
- `blocks`
- `transactions`
- `logs`
- `address_activity`
- `token_transfers`
- `nft_transfers`
- `token_contracts`
- `nft_contracts`
- `daily_stats`
- `ritual_names`
- `ritual_name_text_records`

Addresses are normalized to lowercase in storage and rendered with checksum formatting in the UI where possible.

## Ritual Activity Pages

Ritual Watch includes Ritual-native activity views:

- `/async` for async commit and settlement transactions (`0x11`, `0x12`)
- `/scheduled` for scheduled transaction activity (`0x10`)
- `/agents` for recent agent activity detected from Ritual precompile metadata

These pages use recent live RPC scans when Postgres is not configured. For complete historical Ritual activity, run the indexer continuously.

## Run The Indexer

```bash
npm run indexer
```

Set `INDEXER_START_BLOCK` to control the first indexed block. The indexer is idempotent, stores progress in `indexed_state`, retries after downtime, and processes new blocks continuously.

For local full wallet history:

```bash
# 1. Add a Postgres DATABASE_URL to .env.local
# 2. Pick a start block before the wallet's first activity
INDEXER_START_BLOCK=12000000

npm run db:migrate
npm run indexer
```

Deployment is not required for this. Deploying without a database/indexer will show the same bounded live fallback as local development.

It indexes:

- Blocks
- Transactions
- Receipts
- Logs
- Sender and recipient address activity
- ERC-20 `Transfer` events
- ERC-721 `Transfer` events
- ERC-1155 transfer contract sightings
- Daily transaction and active wallet aggregates

## .ritual Support

`.ritual` support lives in `lib/ritual/ritualNames.ts`.

The app supports:

- Forward search: `name.ritual` to wallet address when supported by the configured contract ABI
- Database-backed owned names and primary names
- Text record storage through `ritual_name_text_records`

If the ABI or resolver behavior changes, update the abstraction in `lib/ritual/ritualNames.ts`. If the contract cannot be read, only `.ritual` features degrade; the explorer remains usable.

## Known Limitations

- Rich method decoding is currently limited to function selectors.
- NFT metadata images require an additional metadata fetcher.
- `.ritual` reverse resolution and text records depend on the exact deployed contract interface.
- Historical analytics require running the indexer from a sufficiently early block.
- Without Postgres, wallet transactions and holdings use `RITUAL_LIVE_TX_SCAN_BLOCKS` / `RITUAL_LIVE_LOG_SCAN_BLOCKS` as a fast recent fallback, not complete history.

## Product Rules

Ritual Watch is public and read-only. It intentionally has no wallet connect button, no auth, no signing, and no transaction submission UI.
