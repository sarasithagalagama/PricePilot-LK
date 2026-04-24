import { createClient } from "@supabase/supabase-js";
import { products, stores } from "../src/mock/seed-data/catalog";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("🌱 Starting Supabase seed...");

    // Step 1: Insert stores
    console.log("📍 Seeding stores...");
    const storesData = stores.map((store) => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      website_url: store.websiteUrl,
      district: store.district,
      is_active: true,
    }));

    const { error: storesError } = await supabase.from("stores").upsert(storesData, { onConflict: "id" });
    if (storesError) {
      console.error("❌ Error seeding stores:", storesError.message);
      process.exit(1);
    }
    console.log(`✅ Seeded ${storesData.length} stores`);

    // Step 2: Insert categories
    console.log("🏷️  Seeding categories...");
    const categories = [
      { slug: "laptops", name: "Laptops" },
      { slug: "gpu", name: "Graphics Cards" },
      { slug: "cpu", name: "Processors" },
      { slug: "ram", name: "Memory" },
      { slug: "ssd", name: "Storage" },
    ];

    const { error: categoriesError } = await supabase
      .from("categories")
      .upsert(categories.map((cat, i) => ({ id: `cat${i}`, ...cat })), { onConflict: "slug" });
    if (categoriesError) {
      console.error("❌ Error seeding categories:", categoriesError.message);
      process.exit(1);
    }
    console.log(`✅ Seeded ${categories.length} categories`);

    // Step 3: Get category IDs
    const { data: categoryData } = await supabase.from("categories").select("id, slug");
    const categoryMap = new Map((categoryData ?? []).map((cat) => [cat.slug, cat.id]));

    // Step 4: Insert brands
    console.log("🏢 Seeding brands...");
    const uniqueBrands = Array.from(new Set(products.map((p) => p.brand)));
    const brandsData = uniqueBrands.map((brand) => ({
      name: brand,
      slug: brand.toLowerCase().replace(/\s+/g, "-"),
    }));

    const { error: brandsError } = await supabase
      .from("brands")
      .upsert(brandsData, { onConflict: "slug" });
    if (brandsError) {
      console.error("❌ Error seeding brands:", brandsError.message);
      process.exit(1);
    }
    console.log(`✅ Seeded ${brandsData.length} brands`);

    // Step 5: Get brand IDs
    const { data: brandData } = await supabase.from("brands").select("id, name");
    const brandMap = new Map((brandData ?? []).map((brand) => [brand.name, brand.id]));

    // Step 6: Insert products
    console.log("📦 Seeding products...");
    const productsData = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      normalized_title: product.title.toLowerCase(),
      model_number: product.model,
      category_id: categoryMap.get(product.category),
      brand_id: brandMap.get(product.brand),
      specs_jsonb: { summary: product.specsSummary },
      is_active: true,
    }));

    const { error: productsError } = await supabase
      .from("products")
      .upsert(productsData, { onConflict: "id" });
    if (productsError) {
      console.error("❌ Error seeding products:", productsError.message);
      process.exit(1);
    }
    console.log(`✅ Seeded ${productsData.length} products`);

    // Step 7: Insert offers
    console.log("💰 Seeding offers...");
    const offersData: any[] = [];
    const offersHistoryData: any[] = [];

    for (const product of products) {
      for (const offer of product.offers) {
        offersData.push({
          id: offer.id,
          product_id: product.id,
          store_id: offer.storeId,
          offer_url: offer.offerUrl,
          current_price_lkr: offer.currentPriceLkr,
          availability_status: offer.availability,
        });

        for (const historyPoint of offer.history) {
          offersHistoryData.push({
            offer_id: offer.id,
            price_lkr: historyPoint.priceLkr,
            availability_status: offer.availability,
            captured_at: historyPoint.capturedAt,
          });
        }
      }
    }

    const { error: offersError } = await supabase
      .from("offers")
      .upsert(offersData, { onConflict: "id" });
    if (offersError) {
      console.error("❌ Error seeding offers:", offersError.message);
      process.exit(1);
    }
    console.log(`✅ Seeded ${offersData.length} offers`);

    // Step 8: Insert offer price history
    if (offersHistoryData.length > 0) {
      const { error: historyError } = await supabase
        .from("offer_price_history")
        .insert(offersHistoryData);
      if (historyError) {
        console.error("❌ Error seeding offer price history:", historyError.message);
        process.exit(1);
      }
      console.log(`✅ Seeded ${offersHistoryData.length} price history points`);
    }

    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main();
