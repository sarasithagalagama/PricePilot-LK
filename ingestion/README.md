# Ingestion Pipeline (External)

This folder is intentionally separate from the Next.js request lifecycle.

## Purpose
- Scrape Sri Lankan store listings externally.
- Insert raw records first into `raw_listings`.
- Run deterministic matching into `listing_matches`.
- Upsert canonical `offers` and append `offer_price_history` snapshots.

## Planned structure
- `scrapers/`: per-store scraping adapters.
- `normalize/`: title cleaning and token extraction.
- `match/`: confidence scoring and match status decisions.
- `pipeline/`: orchestration for scrape -> ingest -> match -> upsert.

## Execution target
- GitHub Actions schedule (every 6 hours initially).
- Service role credentials available only in CI secrets.
