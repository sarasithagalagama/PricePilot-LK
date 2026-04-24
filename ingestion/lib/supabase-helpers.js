import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getOrCreateStore(
  storeName,
  storeSlug,
  websiteUrl = null,
  district = null,
) {
  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("stores")
    .insert([
      {
        name: storeName,
        slug: storeSlug,
        website_url: websiteUrl,
        district: district,
        is_active: true,
      },
    ])
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create store: ${error.message}`);
  return created.id;
}

export async function getOrCreateBrand(brandName) {
  const slug = brandName.toLowerCase().replace(/\s+/g, "-");

  const { data: existing } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("brands")
    .insert([
      {
        name: brandName,
        slug: slug,
      },
    ])
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create brand: ${error.message}`);
  return created.id;
}

export async function getOrCreateCategory(
  categoryName,
  categorySlug,
  parentSlug = null,
) {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (existing) return existing.id;

  let parentId = null;
  if (parentSlug) {
    const { data: parent } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", parentSlug)
      .single();
    parentId = parent?.id;
  }

  const { data: created, error } = await supabase
    .from("categories")
    .insert([
      {
        name: categoryName,
        slug: categorySlug,
        parent_category_id: parentId,
      },
    ])
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create category: ${error.message}`);
  return created.id;
}

export async function insertRawListing(storeId, sourceUrl, rawData) {
  const { title, price, stock, externalId } = rawData;

  // Create fingerprint to detect duplicates
  const fingerprint = `${storeId}:${sourceUrl}:${title}:${price}`.toLowerCase();

  const { data, error } = await supabase
    .from("raw_listings")
    .insert([
      {
        store_id: storeId,
        source_url: sourceUrl,
        external_listing_id: externalId || null,
        raw_title: title,
        raw_brand: rawData.brand || null,
        raw_price_lkr: price,
        raw_currency: "LKR",
        raw_stock_text: stock || null,
        payload_jsonb: rawData,
        fingerprint_hash: fingerprint,
        scraped_at: new Date().toISOString(),
      },
    ])
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("duplicate")) {
      console.log(`  ⊘ Duplicate listing (skipped): ${title}`);
      return null;
    }
    throw new Error(`Failed to insert raw listing: ${error.message}`);
  }

  return data.id;
}

export async function getOrCreateProduct(
  categoryId,
  brandId,
  title,
  slug,
  specs = {},
) {
  // Check if product already exists
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) return existing.id;

  // Create new product
  const { data: created, error } = await supabase
    .from("products")
    .insert([
      {
        category_id: categoryId,
        brand_id: brandId,
        title: title,
        slug: slug,
        normalized_title: title.toLowerCase(),
        specs_jsonb: specs,
      },
    ])
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create product: ${error.message}`);
  return created.id;
}

export async function updateLastSyncTime(storeId) {
  await supabase
    .from("stores")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", storeId);
}
