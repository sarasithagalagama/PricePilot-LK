/**
 * Matching logic: raw_listings → listing_matches → offers
 *
 * Process:
 * 1. Get all unmatched raw listings
 * 2. For each listing, find best-matching canonical product
 * 3. Create listing_match record with confidence score
 * 4. Upsert offer based on match
 */

import { supabase } from "./supabase-helpers.js";
import {
  computeTitleSimilarity,
  extractCategory,
  extractBrand,
} from "./normalize.js";

const CONFIDENCE_THRESHOLD = parseFloat(
  process.env.MATCH_CONFIDENCE_THRESHOLD || "0.75",
);

export async function matchRawListings(batchSize = 50) {
  console.log("\n🔗 Matching raw listings to canonical products...\n");

  try {
    // Get already-matched raw listing IDs
    const { data: matchedIds, error: matchedError } = await supabase
      .from("listing_matches")
      .select("raw_listing_id");

    if (matchedError)
      throw new Error(
        `Failed to fetch matched listings: ${matchedError.message}`,
      );

    const matchedSet = new Set(matchedIds.map((m) => m.raw_listing_id));

    // Get all raw listings
    const { data: allListings, error: fetchError } = await supabase
      .from("raw_listings")
      .select(
        "id, store_id, raw_title, raw_brand, raw_price_lkr, raw_stock_text",
      )
      .limit(batchSize);

    if (fetchError)
      throw new Error(`Failed to fetch listings: ${fetchError.message}`);

    // Filter to unmatched listings
    const unmatchedListings = allListings.filter((l) => !matchedSet.has(l.id));

    if (!unmatchedListings.length) {
      console.log("✓ All listings already matched!");
      return 0;
    }

    console.log(`📋 Found ${unmatchedListings.length} unmatched listings\n`);

    let matchCount = 0;

    for (const listing of unmatchedListings) {
      const match = await findBestMatch(listing);

      if (match) {
        await createMatchAndOffer(listing, match);
        matchCount++;
      } else {
        // Create listing_match with needs_review status
        await createReviewMatch(listing);
      }
    }

    console.log(`\n✅ Matching complete: ${matchCount} new offers created`);
    return matchCount;
  } catch (error) {
    console.error("\n❌ Matching failed:", error.message);
    throw error;
  }
}

async function findBestMatch(listing) {
  // Strategy: search canonical products by brand + category
  const category = extractCategory(listing.raw_title);
  const brand = listing.raw_brand || extractBrand(listing.raw_title);

  // Get all products matching category and brand
  const { data: candidates } = await supabase
    .from("products")
    .select("id, title, normalized_title")
    .eq("brand_id", await getOrCreateBrandId(brand))
    .eq("category_id", await getOrCreateCategoryId(category))
    .limit(10);

  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Score each candidate by title similarity
  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = computeTitleSimilarity(listing.raw_title, candidate.title);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { ...candidate, confidence: score };
    }
  }

  // Return if confidence above threshold
  if (bestMatch && bestMatch.confidence >= CONFIDENCE_THRESHOLD) {
    return bestMatch;
  }

  return null;
}

async function createMatchAndOffer(listing, product) {
  // Create listing_match with auto_matched status
  const { data: match, error: matchError } = await supabase
    .from("listing_matches")
    .insert([
      {
        raw_listing_id: listing.id,
        product_id: product.id,
        match_status: "auto_matched",
        confidence_score: product.confidence,
        matched_by: "auto_matcher_v1",
      },
    ])
    .select("id")
    .single();

  if (matchError) {
    console.error(
      `Failed to create match for listing ${listing.id}: ${matchError.message}`,
    );
    return;
  }

  // Upsert offer
  const { error: offerError } = await supabase.from("offers").upsert(
    [
      {
        product_id: product.id,
        store_id: listing.store_id,
        listing_match_id: match.id,
        offer_url: "", // Would need to extract from raw listing if available
        current_price_lkr: listing.raw_price_lkr,
        availability_status: parseAvailabilityStatus(listing.raw_stock_text),
        last_seen_at: new Date().toISOString(),
      },
    ],
    {
      onConflict: "product_id,store_id",
      ignoreDuplicates: false,
    },
  );

  if (offerError) {
    console.error(`Failed to upsert offer: ${offerError.message}`);
  } else {
    console.log(
      `  ✓ Matched & created offer: ${listing.raw_title} → ${product.title}`,
    );
  }
}

async function createReviewMatch(listing) {
  await supabase.from("listing_matches").insert([
    {
      raw_listing_id: listing.id,
      product_id: null,
      match_status: "needs_review",
      confidence_score: 0,
      matched_by: "auto_matcher_v1",
    },
  ]);

  console.log(`  ⚠️  Needs review: ${listing.raw_title}`);
}

function parseAvailabilityStatus(stockText) {
  if (!stockText) return "in_stock";
  const normalized = stockText.toLowerCase();
  if (normalized.includes("out")) return "out_of_stock";
  if (normalized.includes("limited")) return "limited";
  return "in_stock";
}

// Helper: Get or create brand ID (memoized)
const brandCache = {};
async function getOrCreateBrandId(brandName) {
  if (brandCache[brandName]) return brandCache[brandName];

  const slug = brandName.toLowerCase().replace(/\s+/g, "-");
  const { data, error } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!data && !error) {
    // Create if doesn't exist
    const { data: created } = await supabase
      .from("brands")
      .insert([{ name: brandName, slug }])
      .select("id")
      .single();
    brandCache[brandName] = created?.id;
    return created?.id;
  }

  brandCache[brandName] = data?.id;
  return data?.id;
}

// Helper: Get or create category ID (memoized)
const categoryCache = {};
async function getOrCreateCategoryId(categorySlug) {
  if (categoryCache[categorySlug]) return categoryCache[categorySlug];

  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (!data && !error) {
    // Create if doesn't exist
    const categoryName = categorySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const { data: created } = await supabase
      .from("categories")
      .insert([{ name: categoryName, slug: categorySlug }])
      .select("id")
      .single();

    categoryCache[categorySlug] = created?.id;
    return created?.id;
  }

  categoryCache[categorySlug] = data?.id;
  return data?.id;
}

export default { matchRawListings };
