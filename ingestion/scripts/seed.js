#!/usr/bin/env node

import {
  supabase,
  getOrCreateStore,
  getOrCreateBrand,
  getOrCreateCategory,
} from "../lib/supabase-helpers.js";

async function seed() {
  console.log("🌱 Seeding categories, brands, and stores...\n");

  try {
    // Seed categories
    console.log("📁 Creating categories...");
    const categories = [
      { name: "Laptops", slug: "laptops" },
      { name: "Graphics Cards", slug: "graphics-cards" },
      { name: "Processors", slug: "processors" },
      { name: "Memory", slug: "memory" },
      { name: "Storage", slug: "storage" },
      { name: "Components", slug: "components" },
    ];

    for (const cat of categories) {
      await getOrCreateCategory(cat.name, cat.slug);
      console.log(`  ✓ ${cat.name}`);
    }

    // Seed brands
    console.log("\n🏷️  Creating brands...");
    const brands = [
      "MSI",
      "ASUS",
      "Dell",
      "HP",
      "Lenovo",
      "Acer",
      "Samsung",
      "Intel",
      "AMD",
      "Corsair",
      "Kingston",
      "Crucial",
      "Seagate",
      "Western Digital",
      "NVIDIA",
      "Gigabyte",
      "EVGA",
    ];

    for (const brand of brands) {
      await getOrCreateBrand(brand);
      console.log(`  ✓ ${brand}`);
    }

    // Seed stores
    console.log("\n🏪 Creating stores...");
    await getOrCreateStore(
      "Nanotek",
      "nanotek",
      "https://www.nanotek.lk",
      "Colombo",
    );
    console.log("  ✓ Nanotek");

    await getOrCreateStore(
      "Redline Technologies",
      "redline-technologies",
      "https://www.redlinetech.lk",
      "Colombo",
    );
    console.log("  ✓ Redline Technologies");

    await getOrCreateStore(
      "Winsoft",
      "winsoft",
      "https://www.winsoft.lk",
      "Gampaha",
    );
    console.log("  ✓ Winsoft");

    console.log("\n✅ Seed complete!");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seed();
