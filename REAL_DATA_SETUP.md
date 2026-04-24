# Real Data Integration - Quick Start Guide

Your PricePilot app is now ready for real Sri Lankan computer shop data. Here's how to get it running:

## Step 1: Prepare Supabase Credentials

You'll need your Supabase project URL and service role key.

**If you don't have a Supabase project yet:**
1. Go to https://supabase.com
2. Sign up / log in
3. Create a new project
4. Wait for it to initialize

**Get your credentials:**
1. Go to your Supabase project dashboard
2. Click "Settings" (gear icon)
3. Click "API"
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep secret!)

## Step 2: Configure Next.js App

Create `.env.local` in the project root:

```bash
# d:\PricePilot-LK\.env.local
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 3: Configure Ingestion Pipeline

Create `.env.local` in the ingestion folder:

```bash
# d:\PricePilot-LK\ingestion\.env.local
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Run Database Migrations

The schema has already been created (`supabase/migrations/20260411_init_core_schema.sql`), but you need to apply it to your Supabase project.

**Option A: Via Supabase Dashboard**
1. Go to Supabase dashboard
2. Click "SQL Editor"
3. Create a new query
4. Copy contents of `supabase/migrations/20260411_init_core_schema.sql`
5. Paste and run

**Option B: Via Supabase CLI**
```bash
npm install -g supabase
supabase link --project-ref your_project_id
supabase db push
```

## Step 5: Populate Initial Data (Local Testing)

```bash
cd ingestion
npm install
npm run pipeline
```

This will:
1. ✓ Create stores (Nanotek, Redline, Winsoft)
2. ✓ Create categories and brands
3. ✓ Scrape Nanotek's product listings
4. ✓ Match raw listings to canonical products
5. ✓ Create offers with real prices

**Expected output:**
```
🚀 PricePilot Ingestion Pipeline

====================
▶️  STEP 1: Seeding categories, brands, stores
====================
✓ Laptops
✓ Graphics Cards
... (etc)

====================
▶️  STEP 2: Scraping Nanotek listings
====================
✓ Found 150 products
✓ Inserted 150 new listings

====================
▶️  STEP 3: Matching raw listings to products
====================
✓ Matched & created offer: MSI Katana 15... → MSI Katana 15
... (etc)

✅ Pipeline Complete!
```

## Step 6: Test the App

```bash
cd ..  # Back to root
npm run dev
```

Open http://localhost:3000 and:

1. ✓ Products page shows real Nanotek prices
2. ✓ Product detail shows Nanotek as store with real price
3. ✓ Store page shows Nanotek with real product count
4. ✓ Sign up, add to wishlist, create price alert
5. ✓ Dashboard shows your saved items and alerts

## Step 7: Setup GitHub Actions (Optional, but recommended)

GitHub Actions will automatically scrape new prices every 6 hours.

1. **Add secrets to GitHub:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add `SUPABASE_URL` with your project URL
   - Add `SUPABASE_SERVICE_ROLE_KEY` with your service key

2. **Workflow auto-runs** on schedule
3. **Manual trigger:** 
   - Go to Actions tab
   - Click "Scrape PricePilot Data"
   - Click "Run workflow"

## Troubleshooting

### ❌ "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"

**Fix:** Check `.env.local` exists in `ingestion/` folder with correct values.

### ❌ "Failed to connect to Supabase"

**Fix:** Verify credentials are correct:
1. Copy from Supabase dashboard again
2. Check for extra spaces or quotes
3. Ensure project is active (not paused)

### ❌ "No products found" during scrape

**Cause:** Nanotek's website HTML structure may have changed.

**Fix:**
1. Open https://www.nanotek.lk in browser
2. Right-click → "Inspect" on a product
3. Find the actual HTML class name
4. Update `scrapers/nanotek.js` selectors
5. Re-run `npm run scrape:nanotek`

### ❌ Matches all marked "needs_review"

**Cause:** Product titles don't match well enough.

**Fix:** Lower confidence threshold in `ingestion/.env.local`:
```
MATCH_CONFIDENCE_THRESHOLD=0.65
```

Then re-run matching.

### ❌ "App still shows mock data"

**Cause:** Supabase not configured or connection failing.

**Fix:**
1. Check `.env.local` is in root (not just ingestion)
2. Run `npm run dev` and check console for Supabase errors
3. Verify network tab for failed queries
4. Check Supabase project is active

## What's Next?

✅ **You now have:**
- Real Nanotek prices in database
- Functioning auth + wishlist + alerts
- Automatic data refresh (GitHub Actions)

🚀 **Coming soon:**
- Add Redline Technologies scraper
- Add Winsoft scraper
- Price history tracking
- Email alerts for price drops
- Analytics dashboard

## Questions?

- See `ingestion/README.md` for detailed pipeline docs
- Check `docs/architecture.md` for system overview
- Review `docs/implementation-plan.md` for roadmap

---

**Happy price tracking! 🎉**
