# PricePilot LK Architecture Snapshot

## Runtime
- Frontend: Next.js App Router on Vercel free tier.
- Data/Auth: Supabase (Postgres + Auth + RLS).
- Ingestion: external scripts via GitHub Actions or runner.

## Data flow
1. Scraper jobs fetch raw store listing data.
2. Raw records inserted into `raw_listings`.
3. Matching maps listings to canonical `products`.
4. `offers` table stores current per-store offer state.
5. `offer_price_history` stores time-series snapshots.
6. Next.js reads canonical model for user-facing pages.

## Why this shape
- Keeps Vercel functions lightweight.
- Preserves raw data for reconciliation.
- Supports portfolio-quality domain complexity without microservices.
