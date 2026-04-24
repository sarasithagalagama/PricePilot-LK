#!/usr/bin/env node

/**
 * Improved Nanotek Scraper
 * Uses product links to extract detailed information
 * More robust than CSS selectors alone
 */

import fetch from "node-fetch";
import * as cheerio from "cheerio";
import {
  supabase,
  getOrCreateStore,
  insertRawListing,
  updateLastSyncTime,
} from "../lib/supabase-helpers.js";
import {
  extractBrand,
  extractCategory,
  parsePrice,
  parseStockStatus,
} from "../lib/normalize.js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: ".env.local" });

const BASE_URL = "https://www.nanotek.lk";
const CATEGORIES = [
  { slug: "laptop", name: "Laptops" },
  { slug: "monitors-monitor-arms", name: "Monitors" },
  { slug: "processor", name: "Processors" },
  { slug: "motherboards", name: "Motherboards" },
  { slug: "memory-ram", name: "Memory" },
  { slug: "graphics-card", name: "Graphics Cards" },
];

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function extractProductLinks(categorySlug) {
  console.log(`  🔍 Fetching product links from /${categorySlug}...`);

  try {
    const html = await fetchPage(`${BASE_URL}/category/${categorySlug}`);
    const $ = cheerio.load(html);

    const links = new Set();

    // Find all product links
    $("a[href*='/product/']").each((i, el) => {
      const href = $(el).attr("href");
      if (href && !href.includes("javascript")) {
        const fullUrl = new URL(href, BASE_URL).href;
        links.add(fullUrl);
      }
    });

    console.log(`    ✓ Found ${links.size} unique product links`);
    return Array.from(links);
  } catch (error) {
    console.log(`    ✗ Error fetching category: ${error.message}`);
    return [];
  }
}

async function extractProductDetails(productUrl) {
  try {
    const html = await fetchPage(productUrl);
    const $ = cheerio.load(html);

    // Extract product information
    const title =
      $('h1, [class*="title"], [class*="name"]').first().text().trim() ||
      productUrl.split("/").pop();

    // Look for price in multiple places
    let price = null;
    const priceMatch = html.match(/(\d+[\d,]*)\s*(LKR|Rs|৳)/i);
    if (priceMatch) {
      price = parseInt(priceMatch[1].replace(/,/g, ""));
    } else {
      const priceElem = $(
        '[class*="price"], [class*="amount"], [class*="cost"]',
      ).first();
      const priceText = priceElem.text();
      const numMatch = priceText.match(/\d+[\d,]*/);
      if (numMatch) {
        price = parseInt(numMatch[0].replace(/,/g, ""));
      }
    }

    // Extract availability
    let stock = "in_stock";
    const stockText = $('[class*="stock"], [class*="availability"]')
      .text()
      .toLowerCase();
    if (stockText.includes("out") || stockText.includes("unavailable")) {
      stock = "out_of_stock";
    } else if (stockText.includes("limited") || stockText.includes("few")) {
      stock = "limited";
    }

    if (!title || title.length < 3) return null;

    return {
      url: productUrl,
      title: title.substring(0, 200),
      price,
      stock,
      brand: extractBrand(title),
      category: extractCategory(title),
    };
  } catch (error) {
    console.log(`    ✗ Error extracting details: ${error.message}`);
    return null;
  }
}

async function scrapeNanotek() {
  console.log("🕷️  Starting improved Nanotek scraper...\n");

  const storeId = await getOrCreateStore(
    "Nanotek",
    "nanotek",
    "https://www.nanotek.lk",
  );
  console.log("✓ Store ID:", storeId, "\n");

  let totalInserted = 0;
  let totalDuplicates = 0;

  for (const category of CATEGORIES) {
    console.log(`📂 Category: ${category.name}`);

    try {
      const productLinks = await extractProductLinks(category.slug);

      let categoryInserted = 0;
      let categoryDuplicates = 0;

      for (const link of productLinks) {
        const product = await extractProductDetails(link);

        if (!product || !product.price) continue;

        // Create fingerprint for duplicate detection
        const fingerprint = crypto
          .createHash("md5")
          .update(`${storeId}:${link}:${product.title}`)
          .digest("hex");

        try {
          const result = await insertRawListing(storeId, link, {
            title: product.title,
            price: product.price,
            stock: product.stock,
            brand: product.brand,
            url: link,
            externalId: link.split("/").pop(),
            fingerprint,
          });

          if (result) {
            categoryInserted++;
            totalInserted++;
            console.log(
              `    ✓ ${product.title.substring(0, 50)}... - LKR ${product.price}`,
            );
          } else {
            categoryDuplicates++;
            totalDuplicates++;
          }
        } catch (error) {
          console.log(`    ⚠️  Error inserting: ${error.message}`);
        }
      }

      console.log(
        `  ✅ ${category.name}: ${categoryInserted} inserted, ${categoryDuplicates} duplicates\n`,
      );
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}\n`);
    }
  }

  await updateLastSyncTime(storeId);

  console.log("✅ Scrape complete!");
  console.log(`   📊 Total inserted: ${totalInserted}`);
  console.log(`   ⊘ Total duplicates: ${totalDuplicates}`);
}

scrapeNanotek().catch((err) => {
  console.error("❌ Scraper failed:", err);
  process.exit(1);
});
