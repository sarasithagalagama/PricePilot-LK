# Ingestion Pipeline for PricePilot

External data ingestion system for populating real Sri Lankan computer shop prices into Supabase.

## Architecture

```
Raw Listings (web scrape)
        ↓
    [Normalize] → Extract brand, category, parse price
        ↓
Listing Matches (with confidence scoring)
        ↓
    [Match] → Link to canonical products
        ↓
Offers + Price History (upserted to DB)
        ↓
Dashboard displays real prices
```

## Quick Start

### 1. Setup Environment

```bash
cd ingestion
cp .env.example .env.local
```

Fill in `.env.local`:
```
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Initial Seed

```bash
npm run seed
```

This creates:
- ✓ Categories (Laptops, Graphics Cards, Processors, Memory, Storage)
- ✓ Brands (MSI, ASUS, Dell, HP, Lenovo, etc.)
- ✓ Stores (Nanotek, Redline, Winsoft)

### 4. Scrape Nanotek

```bash
npm run scrape:nanotek
```

This:
1. Fetches Nanotek's product listings
2. Extracts title, price, stock status
3. Inserts as raw listings into Supabase
4. Updates store's last_sync_at timestamp

### 5. Run Full Pipeline

```bash
npm run pipeline
```

This orchestrates: **seed → scrape → match → summary**

## Project Structure

```
ingestion/
├── package.json              # Dependencies and scripts
├── .env.example              # Environment template
├── lib/
│   ├── supabase-helpers.js   # DB utilities (create store/brand/category)
│   ├── normalize.js          # Title cleaning, price parsing, category extraction
│   └── match.js              # Confidence scoring and product matching
├── scripts/
│   └── seed.js               # One-time: populate stores, categories, brands
├── scrapers/
│   ├── nanotek.js            # Nanotek web scraper
│   ├── redline.js            # (Future) Redline scraper
│   └── winsoft.js            # (Future) Winsoft scraper
└── pipeline/
    └── orchestrator.js       # Main pipeline runner
```

## How It Works

### Phase 1: Seed (One-time)

```bash
npm run seed
```

- Creates canonical categories (laptops, GPUs, CPUs, RAM, SSDs)
- Creates brands (MSI, ASUS, Dell, etc.)
- Creates stores (Nanotek, Redline, Winsoft)

**Idempotent**: Safe to run multiple times.

### Phase 2: Scrape

```bash
npm run scrape:nanotek
```

**What happens:**
1. Fetches Nanotek's product pages using Cheerio + Fetch
2. Extracts: title, price, stock status, URL
3. Computes fingerprint hash (prevents exact duplicates)
4. Inserts into `raw_listings` table

**Output**: Raw HTML data ready for matching

**Notes:**
- Selectors may need adjustment if Nanotek's HTML changes
- See `scrapers/nanotek.js` for selector comments
- Retries on timeout (3 attempts with backoff)

### Phase 3: Match

Automatic matching process (part of pipeline):

1. **Find unmatched raw listings** from `raw_listings`
2. **Extract metadata**: Brand, category, normalized title
3. **Search candidates**: Products matching brand + category
4. **Score by similarity**: Title similarity (0-1 scale)
5. **Create match record**:
   - If confidence ≥ 0.75 → `auto_matched`
   - If confidence < 0.75 → `needs_review`
6. **Upsert offer**: Link product_id → store_id → price

**Example match:**
```
Raw: "MSI RTX 4060 8GB GDDR6"
Canonical: "MSI RTX 4060 Graphics Card"
Confidence: 0.92 → AUTO_MATCHED ✓
```

### Phase 4: Review (Manual)

Listings with `needs_review` status appear in Supabase:
```sql
SELECT * FROM listing_matches WHERE match_status = 'needs_review';
```

**Next steps:**
- Manually review and match problematic listings
- Update match_status to `manually_matched`
- Or create new canonical product if needed

## Data Flow Example

**Input (raw Nanotek listing):**
```json
{
  "title": "MSI Katana 15 B13VFK RTX 4060 | Core i7",
  "price": "Rs. 469,900",
  "stock": "In Stock"
}
```

**After Normalize:**
```json
{
  "title": "msi katana 15 b13vfk rtx 4060 core i7",
  "brand": "MSI",
  "category": "laptops",
  "price_lkr": 469900,
  "availability": "in_stock"
}
```

**After Match → Offer:**
```
product_id: 550e8400-e29b-41d4-a716-446655440000
store_id:   550e8400-e29b-41d4-a716-446655440111
price_lkr:  469900
availability: in_stock
```

**Result in Dashboard:**
✓ Product appears on product detail page with real Nanotek price

## Adding New Stores

### 1. Create scraper adapter

```bash
# ingestion/scrapers/newstore.js
export async function scrapeNewStore() { ... }
```

### 2. Add to orchestrator

Edit `ingestion/pipeline/orchestrator.js`:
```javascript
await runScript(join(ROOT, "scrapers", "newstore.js"), "Scraping NewStore");
```

### 3. Update GitHub Actions

Edit `.github/workflows/scrape-data.yml` to include new store.

## GitHub Actions Automation

**File:** `.github/workflows/scrape-data.yml`

**Schedule:** Every 6 hours (0, 6, 12, 18 UTC)

**Trigger:** 
- Automatic on schedule
- Manual: Actions tab → "Scrape PricePilot Data" → Run workflow

**Secrets Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Add secrets:**
1. GitHub → Settings → Secrets and variables → Actions
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. Workflow will auto-run on next schedule

## Troubleshooting

### "No products found" during scrape

**Cause:** Selectors don't match Nanotek's HTML structure.

**Fix:**
1. Open `https://www.nanotek.lk/laptops` in browser
2. Inspect page source → Find actual product container class
3. Update selectors in `scrapers/nanotek.js`:
   ```javascript
   const productElements = $(".actual-class-name");
   ```
4. Re-run `npm run scrape:nanotek`

### Duplicate listings being inserted

**Cause:** Store has changed prices but `fingerprint_hash` is identical.

**Fix:** Fingerprint only includes `title:price` to detect exact duplicates. Different prices = different fingerprints (correct behavior).

### Matches all need review

**Cause:** Confidence scores below 0.75 threshold.

**Fix:** Adjust threshold in `.env.local`:
```
MATCH_CONFIDENCE_THRESHOLD=0.65
```

Or improve title normalization in `lib/normalize.js`.

### GitHub Actions failing silently

**Debug:**
1. Go to Actions tab in GitHub
2. Click latest "Scrape PricePilot Data" run
3. Check logs for errors
4. Verify secrets are set correctly

## Performance Notes

- **Scrape speed:** ~100-200 products/min (depends on Nanotek rate limits)
- **Match speed:** ~1000 products/sec
- **Storage:** ~100 KB per raw listing (includes full HTML payload)
- **Monthly data:** ~2-3 GB at 3-store, 500-product scale

## Future Enhancements

- [ ] Automatic price history snapshot creation
- [ ] Email alerts for price drops
- [ ] Concurrent multi-store scraping
- [ ] Proxy rotation for rate limit bypass
- [ ] Cache fingerprints in memory for faster deduplication
- [ ] S3 backup of raw HTML payloads
- [ ] Monitoring dashboard (scrape success rate, match quality)

## References

- **Supabase:** https://supabase.io/docs
- **Cheerio:** https://cheerio.js.org (jQuery-like HTML parsing)
- **Schema:** See `supabase/migrations/20260411_init_core_schema.sql`
