# PricePilot LK - What Next Plan

## Current milestone status
- Milestone 1 started: read-only product comparison vertical slice in Next.js with typed mock data.
- Initial Supabase schema migration created at `supabase/migrations/20260411_init_core_schema.sql`.
- Supabase runtime read integration added with mock fallback.

## Resume from here
- Session handoff: `docs/handoff-2026-04-11.md`
- Last verified checks: `npm run lint` and `npm run build` passed.
- Current app behavior: reads Supabase if configured; otherwise uses mock catalog.

## Next implementation sequence
1. Wire Supabase client setup (`src/lib/supabase`) and replace mock service reads with DB queries.
2. Add auth flows (sign in/sign up/sign out), session handling, and protected dashboard routes.
3. Implement wishlist and price alerts CRUD using RLS-protected tables.
4. Create ingestion scripts (`ingestion/scrapers`, `ingestion/pipeline`) for first store with idempotent raw listing inserts.
5. Add matching + offer upsert + price history append pipeline for one store, then scale to 3 stores.
6. Add quality pass for empty/loading/error states and mobile polish.

## Immediate next tasks
- Configure `.env.local` for Supabase URL and keys.
- Seed Supabase tables (`categories`, `brands`, `stores`, `products`, `offers`, `offer_price_history`) for real page data.
- Implement auth session-aware Supabase helpers (`@supabase/ssr`) for sign in/sign up/sign out.
- Connect dashboard, wishlist, and price alerts to RLS-protected queries.
