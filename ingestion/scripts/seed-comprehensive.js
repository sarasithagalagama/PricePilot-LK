#!/usr/bin/env node

/**
 * Comprehensive Test Data Seeder
 * Creates realistic Sri Lankan computer shop products and prices
 */

import {
  supabase,
  getOrCreateStore,
  getOrCreateBrand,
  getOrCreateCategory,
  getOrCreateProduct,
} from "../lib/supabase-helpers.js";

async function seedComprehensiveData() {
  console.log("📦 Seeding comprehensive test data...\n");

  try {
    // Create stores
    const nanotek = await getOrCreateStore(
      "Nanotek",
      "nanotek",
      "https://www.nanotek.lk",
    );
    const redline = await getOrCreateStore(
      "Redline Technologies",
      "redline",
      "https://www.redline.lk",
    );
    const winsoft = await getOrCreateStore(
      "Winsoft",
      "winsoft",
      "https://www.winsoft.lk",
    );

    // Create categories
    const laptopCat = await getOrCreateCategory("Laptops", "laptops");
    const gpuCat = await getOrCreateCategory(
      "Graphics Cards",
      "graphics-cards",
    );
    const cpuCat = await getOrCreateCategory("Processors", "processors");
    const ramCat = await getOrCreateCategory("Memory", "memory");
    const ssdCat = await getOrCreateCategory("Storage", "storage");
    const monitorCat = await getOrCreateCategory("Monitors", "monitors");

    // Create brands
    const brands = {
      asus: await getOrCreateBrand("ASUS"),
      dell: await getOrCreateBrand("Dell"),
      hp: await getOrCreateBrand("HP"),
      lenovo: await getOrCreateBrand("Lenovo"),
      acer: await getOrCreateBrand("Acer"),
      msi: await getOrCreateBrand("MSI"),
      nvidia: await getOrCreateBrand("NVIDIA"),
      amd: await getOrCreateBrand("AMD"),
      intel: await getOrCreateBrand("Intel"),
      samsung: await getOrCreateBrand("Samsung"),
      corsair: await getOrCreateBrand("Corsair"),
      kingston: await getOrCreateBrand("Kingston"),
      lg: await getOrCreateBrand("LG"),
    };

    // Product catalog with realistic LKR pricing
    const products = [
      // Laptops
      {
        cat: laptopCat,
        brand: brands.asus,
        title:
          "ASUS VivoBook 15 X515EA (Intel Core i5-11th Gen, 8GB RAM, 512GB SSD)",
        slug: "asus-vivobook-15-x515ea",
        specs: {
          cpu: "Intel Core i5-11th Gen",
          ram: "8GB",
          storage: "512GB SSD",
          display: "15.6 FHD",
        },
        offers: [
          { store: nanotek, price: 89999, status: "in_stock" },
          { store: redline, price: 92000, status: "in_stock" },
        ],
      },
      {
        cat: laptopCat,
        brand: brands.dell,
        title: "Dell Inspiron 15 3000 (AMD Ryzen 5, 8GB RAM, 256GB SSD)",
        slug: "dell-inspiron-15-3000",
        specs: {
          cpu: "AMD Ryzen 5 5500U",
          ram: "8GB",
          storage: "256GB SSD",
          display: "15.6 FHD",
        },
        offers: [
          { store: nanotek, price: 82000, status: "in_stock" },
          { store: winsoft, price: 84500, status: "limited" },
        ],
      },
      {
        cat: laptopCat,
        brand: brands.hp,
        title: "HP Pavilion 15 (Intel Core i7, 16GB RAM, 512GB SSD)",
        slug: "hp-pavilion-15-i7",
        specs: {
          cpu: "Intel Core i7-11th Gen",
          ram: "16GB",
          storage: "512GB SSD",
          display: "15.6 FHD",
        },
        offers: [
          { store: redline, price: 145000, status: "in_stock" },
          { store: nanotek, price: 142500, status: "in_stock" },
        ],
      },
      {
        cat: laptopCat,
        brand: brands.lenovo,
        title: "Lenovo ThinkBook 14 (Intel Core i5, 8GB RAM, 256GB SSD)",
        slug: "lenovo-thinkbook-14",
        specs: {
          cpu: "Intel Core i5",
          ram: "8GB",
          storage: "256GB SSD",
          display: "14 FHD",
        },
        offers: [
          { store: winsoft, price: 95000, status: "in_stock" },
          { store: nanotek, price: 93000, status: "limited" },
        ],
      },
      {
        cat: laptopCat,
        brand: brands.acer,
        title: "Acer Aspire 5 (AMD Ryzen 7, 16GB RAM, 512GB SSD)",
        slug: "acer-aspire-5-ryzen7",
        specs: {
          cpu: "AMD Ryzen 7 5700U",
          ram: "16GB",
          storage: "512GB SSD",
          display: "15.6 FHD",
        },
        offers: [{ store: redline, price: 155000, status: "in_stock" }],
      },

      // Graphics Cards
      {
        cat: gpuCat,
        brand: brands.msi,
        title: "MSI RTX 3060 Ti Gaming X Trio (8GB GDDR6)",
        slug: "msi-rtx-3060-ti-gaming-x-trio",
        specs: {
          memory: "8GB GDDR6",
          boost: "1860 MHz",
          power: "320W",
          interface: "PCIe 4.0",
        },
        offers: [
          { store: nanotek, price: 285000, status: "in_stock" },
          { store: redline, price: 290000, status: "limited" },
        ],
      },
      {
        cat: gpuCat,
        brand: brands.nvidia,
        title: "NVIDIA RTX 4070 (12GB GDDR6X)",
        slug: "nvidia-rtx-4070-12gb",
        specs: {
          memory: "12GB GDDR6X",
          boost: "2475 MHz",
          power: "200W",
          interface: "PCIe 4.0",
        },
        offers: [
          { store: redline, price: 385000, status: "in_stock" },
          { store: nanotek, price: 380000, status: "in_stock" },
        ],
      },
      {
        cat: gpuCat,
        brand: brands.amd,
        title: "AMD Radeon RX 6700 XT (12GB GDDR6)",
        slug: "amd-radeon-rx-6700-xt",
        specs: {
          memory: "12GB GDDR6",
          boost: "2544 MHz",
          power: "230W",
          interface: "PCIe 4.0",
        },
        offers: [{ store: winsoft, price: 275000, status: "in_stock" }],
      },

      // Processors
      {
        cat: cpuCat,
        brand: brands.intel,
        title: "Intel Core i9-13900K (24-Core, 5.8GHz)",
        slug: "intel-core-i9-13900k",
        specs: {
          cores: "24-core",
          threads: "32",
          baseClk: "3.0GHz",
          boostClk: "5.8GHz",
          socket: "LGA1700",
        },
        offers: [
          { store: nanotek, price: 189000, status: "limited" },
          { store: redline, price: 192000, status: "in_stock" },
        ],
      },
      {
        cat: cpuCat,
        brand: brands.amd,
        title: "AMD Ryzen 9 7950X (16-Core, 5.7GHz)",
        slug: "amd-ryzen-9-7950x",
        specs: {
          cores: "16-core",
          threads: "32",
          baseClk: "4.5GHz",
          boostClk: "5.7GHz",
          socket: "AM5",
        },
        offers: [
          { store: redline, price: 175000, status: "in_stock" },
          { store: nanotek, price: 172000, status: "in_stock" },
        ],
      },

      // RAM
      {
        cat: ramCat,
        brand: brands.corsair,
        title: "Corsair Vengeance RGB Pro 32GB (2x16GB) DDR4 3200MHz",
        slug: "corsair-vengeance-rgb-pro-32gb-ddr4-3200",
        specs: {
          capacity: "32GB (2x16GB)",
          speed: "3200MHz",
          type: "DDR4",
          voltage: "1.35V",
        },
        offers: [
          { store: nanotek, price: 28000, status: "in_stock" },
          { store: winsoft, price: 29500, status: "in_stock" },
        ],
      },
      {
        cat: ramCat,
        brand: brands.kingston,
        title: "Kingston Fury Beast 16GB DDR5 5200MHz",
        slug: "kingston-fury-beast-16gb-ddr5-5200",
        specs: {
          capacity: "16GB",
          speed: "5200MHz",
          type: "DDR5",
          voltage: "1.25V",
        },
        offers: [
          { store: redline, price: 16500, status: "in_stock" },
          { store: nanotek, price: 15800, status: "in_stock" },
        ],
      },

      // Storage
      {
        cat: ssdCat,
        brand: brands.samsung,
        title: "Samsung 980 Pro 1TB NVMe SSD (PCIe 4.0)",
        slug: "samsung-980-pro-1tb-nvme",
        specs: {
          capacity: "1TB",
          interface: "PCIe 4.0",
          readSpeed: "7100 MB/s",
          writeSpeed: "6000 MB/s",
          form: "M.2 2280",
        },
        offers: [
          { store: nanotek, price: 18500, status: "in_stock" },
          { store: redline, price: 19200, status: "in_stock" },
        ],
      },
      {
        cat: ssdCat,
        brand: brands.kingston,
        title: "Kingston A2000 1TB NVMe SSD (PCIe 3.0)",
        slug: "kingston-a2000-1tb-nvme",
        specs: {
          capacity: "1TB",
          interface: "PCIe 3.0",
          readSpeed: "3200 MB/s",
          writeSpeed: "2200 MB/s",
          form: "M.2 2280",
        },
        offers: [
          { store: winsoft, price: 9500, status: "in_stock" },
          { store: nanotek, price: 9200, status: "limited" },
        ],
      },

      // Monitors
      {
        cat: monitorCat,
        brand: brands.lg,
        title: "LG 27UP550 27-inch 4K UHD IPS Monitor",
        slug: "lg-27up550-27-4k-ips",
        specs: {
          size: "27-inch",
          resolution: "4K (3840x2160)",
          panel: "IPS",
          refresh: "60Hz",
          response: "5ms",
        },
        offers: [
          { store: redline, price: 125000, status: "in_stock" },
          { store: nanotek, price: 122500, status: "in_stock" },
        ],
      },
      {
        cat: monitorCat,
        brand: brands.asus,
        title: "ASUS PA248QV 24-inch 1080p IPS Monitor",
        slug: "asus-pa248qv-24-1080p-ips",
        specs: {
          size: "24-inch",
          resolution: "1080p (1920x1200)",
          panel: "IPS",
          refresh: "60Hz",
          response: "5ms",
        },
        offers: [
          { store: nanotek, price: 35000, status: "in_stock" },
          { store: winsoft, price: 36500, status: "in_stock" },
        ],
      },
    ];

    let productCount = 0;
    let offerCount = 0;

    for (const prod of products) {
      try {
        const productId = await getOrCreateProduct(
          prod.cat,
          prod.brand,
          prod.title,
          prod.slug,
          prod.specs,
        );

        productCount++;
        console.log(`  ✓ ${prod.title}`);

        for (const offer of prod.offers) {
          const { error: offerError } = await supabase.from("offers").insert([
            {
              product_id: productId,
              store_id: offer.store,
              offer_url: `https://www.nanotek.lk/products/${prod.slug}`,
              current_price_lkr: offer.price,
              availability_status: offer.status,
            },
          ]);

          if (!offerError) {
            offerCount++;
          }
        }
      } catch (error) {
        console.log(`  ✗ Failed to create ${prod.title}: ${error.message}`);
      }
    }

    console.log(`\n✅ Data seeded!`);
    console.log(`   📦 ${productCount} products created`);
    console.log(`   💰 ${offerCount} offers across 3 stores`);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    throw error;
  }
}

seedComprehensiveData();
