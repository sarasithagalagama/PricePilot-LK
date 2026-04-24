#!/usr/bin/env node

/**
 * Test Data Seeder
 * Creates sample products and offers so we can test the full pipeline
 */

import {
  supabase,
  getOrCreateStore,
  getOrCreateBrand,
  getOrCreateCategory,
} from "../lib/supabase-helpers.js";

async function seedTestProducts() {
  console.log("📦 Seeding test products and offers...\n");

  try {
    // Get store and category IDs
    const nanotek = await getOrCreateStore(
      "Nanotek",
      "nanotek",
      "https://www.nanotek.lk",
    );
    const laptopCategory = await getOrCreateCategory("Laptops", "laptops");
    const asusEBrand = await getOrCreateBrand("ASUS");
    const dellBrand = await getOrCreateBrand("Dell");
    const msiGpuBrand = await getOrCreateBrand("MSI");
    const gpuCategory = await getOrCreateCategory(
      "Graphics Cards",
      "graphics-cards",
    );

    // Create test products
    const products = [
      {
        categoryId: laptopCategory,
        brandId: asusEBrand,
        title: "ASUS VivoBook 15 X515EA",
        slug: "asus-vivobook-15-x515ea",
        normalized: "asus vivobook 15 x515ea",
        specs: {
          cpu: "Intel Core i5-11th Gen",
          ram: "8GB",
          storage: "512GB SSD",
        },
      },
      {
        categoryId: laptopCategory,
        brandId: dellBrand,
        title: "Dell Inspiron 15 3000",
        slug: "dell-inspiron-15-3000",
        normalized: "dell inspiron 15 3000",
        specs: { cpu: "AMD Ryzen 5", ram: "8GB", storage: "256GB SSD" },
      },
      {
        categoryId: gpuCategory,
        brandId: msiGpuBrand,
        title: "MSI RTX 3060 Ti Gaming X Trio",
        slug: "msi-rtx-3060-ti-gaming-x-trio",
        normalized: "msi rtx 3060 ti gaming x trio",
        specs: { memory: "8GB GDDR6", boost: "1860 MHz", power: "320W" },
      },
    ];

    for (const prod of products) {
      const { data: product } = await supabase
        .from("products")
        .insert([
          {
            category_id: prod.categoryId,
            brand_id: prod.brandId,
            title: prod.title,
            slug: prod.slug,
            normalized_title: prod.normalized,
            specs_jsonb: prod.specs,
          },
        ])
        .select("id")
        .single();

      console.log(`  ✓ Created product: ${prod.title}`);

      // Create offers for this product
      const prices = [
        {
          store: nanotek,
          price: 89999,
          availability: "in_stock",
          url: `https://www.nanotek.lk/products/${prod.slug}`,
        },
      ];

      for (const offer of prices) {
        await supabase.from("offers").insert([
          {
            product_id: product.id,
            store_id: offer.store,
            offer_url: offer.url,
            current_price_lkr: offer.price,
            availability_status: offer.availability,
          },
        ]);
      }

      console.log(`    → Added offers (LKR ${prices[0].price})`);
    }

    console.log("\n✅ Test data seeded successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    throw error;
  }
}

seedTestProducts();
