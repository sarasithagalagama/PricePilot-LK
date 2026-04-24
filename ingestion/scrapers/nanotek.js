#!/usr/bin/env node

/**
 * Nanotek Web Scraper
 *
 * Fetches laptop, GPU, CPU, RAM, and SSD product listings from nanotek.lk
 * and inserts them as raw listings into Supabase.
 *
 * Note: This scraper assumes Nanotek's site structure.
 * You may need to adjust selectors based on their actual HTML.
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

dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.NANOTEK_BASE_URL || "https://www.nanotek.lk";
const TIMEOUT = parseInt(process.env.NANOTEK_REQUEST_TIMEOUT || "10000");
const RETRY_ATTEMPTS = parseInt(process.env.NANOTEK_RETRY_ATTEMPTS || "3");

// URLs for different product categories on Nanotek
const PRODUCT_URLS = [
  // Actual Nanotek category URLs
  `${BASE_URL}/category/laptop`,
  `${BASE_URL}/category/monitors-monitor-arms`,
  `${BASE_URL}/category/processor`,
  `${BASE_URL}/category/motherboards`,
  `${BASE_URL}/category/memory-ram`,
  `${BASE_URL}/category/graphics-card`,
];

async function fetchWithRetry(url, attempt = 1) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (attempt < RETRY_ATTEMPTS) {
      console.log(
        `  ⚠️  Retry attempt ${attempt + 1}/${RETRY_ATTEMPTS} for ${url}`,
      );
      await new Promise((r) => setTimeout(r, 1000 * attempt)); // Backoff
      return fetchWithRetry(url, attempt + 1);
    }
    throw error;
  }
}

async function scrapeCategoryPage(categoryUrl, storeId) {
  console.log(`  📄 Fetching: ${categoryUrl}`);

  try {
    const html = await fetchWithRetry(categoryUrl);
    const $ = cheerio.load(html);

    const products = [];

    // Adjust these selectors based on Nanotek's actual HTML structure
    // Common patterns: .product-item, .product-card, [data-product-id]
    const productElements = $(".product-item, .product-card, .product");

    if (productElements.length === 0) {
      console.log(
        `    ⚠️  No products found with current selectors. Inspect page HTML.`,
      );
      return products;
    }

    productElements.each((idx, elem) => {
      try {
        // Adapt these to Nanotek's actual HTML structure
        const titleElem = $(elem).find(".product-title, .product-name, h2, h3");
        const priceElem = $(elem).find(".product-price, .price, [data-price]");
        const stockElem = $(elem).find(".stock-status, .availability");
        const linkElem = $(elem).find("a");

        const title = titleElem.text().trim();
        const price = priceElem.text().trim();
        const stock = stockElem.text().trim();
        const url = linkElem.attr("href");

        if (!title || !price) {
          return; // Skip incomplete listings
        }

        const product = {
          title,
          price: parsePrice(price),
          stock,
          brand: extractBrand(title),
          url: url ? new URL(url, BASE_URL).href : categoryUrl,
          externalId: $(elem).attr("data-product-id") || null,
        };

        products.push(product);
      } catch (err) {
        console.log(`    ⚠️  Error parsing product element: ${err.message}`);
      }
    });

    console.log(`    ✓ Found ${products.length} products`);
    return products;
  } catch (error) {
    console.error(`    ✗ Failed to scrape ${categoryUrl}: ${error.message}`);
    return [];
  }
}

async function scrapeNanotek() {
  console.log("\n🕷️  Starting Nanotek scraper...\n");

  try {
    // Get or create Nanotek store
    console.log("🏪 Fetching Nanotek store ID...");
    const storeId = await getOrCreateStore(
      "Nanotek",
      "nanotek",
      "https://www.nanotek.lk",
      "Colombo",
    );
    console.log(`✓ Store ID: ${storeId}\n`);

    let totalInserted = 0;
    let totalDuplicates = 0;

    // Scrape each category
    for (const url of PRODUCT_URLS) {
      console.log(`\n📂 Scraping category: ${url}`);
      const products = await scrapeCategoryPage(url, storeId);

      // Insert each product as raw listing
      for (const product of products) {
        const category = extractCategory(product.title);
        const listingId = await insertRawListing(storeId, product.url, {
          title: product.title,
          brand: product.brand,
          category,
          price: product.price,
          stock: product.stock,
          externalId: product.externalId,
        });

        if (listingId) {
          totalInserted++;
        } else {
          totalDuplicates++;
        }
      }

      // Polite delay between categories
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Update store's last sync time
    await updateLastSyncTime(storeId);

    console.log(`\n✅ Scrape complete!`);
    console.log(`  📊 Inserted: ${totalInserted}`);
    console.log(`  ⊘ Duplicates: ${totalDuplicates}`);
  } catch (error) {
    console.error("\n❌ Scraper failed:", error.message);
    process.exit(1);
  }
}

scrapeNanotek();
