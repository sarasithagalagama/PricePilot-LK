#!/usr/bin/env node

/**
 * Nanotek Scraper with Puppeteer
 * Handles JavaScript-rendered content for accurate product extraction
 */

import puppeteer from "puppeteer";
import crypto from "crypto";
import {
  supabase,
  getOrCreateStore,
  insertRawListing,
  updateLastSyncTime,
} from "../lib/supabase-helpers.js";
import { extractBrand, extractCategory, parsePrice } from "../lib/normalize.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE_URL = "https://www.nanotek.lk";
const CATEGORIES = [
  { slug: "laptop", name: "Laptops" },
  { slug: "graphics-card", name: "Graphics Cards" },
  { slug: "processor", name: "Processors" },
  { slug: "memory-ram", name: "Memory" },
  { slug: "motherboards", name: "Motherboards" },
  { slug: "monitors-monitor-arms", name: "Monitors" },
];

const TIMEOUT = 15000;
const PRODUCTS_PER_CATEGORY = 20; // Limit per category to keep execution time reasonable

async function scrapeWithPuppeteer() {
  console.log("🕷️  Starting Nanotek scraper with Puppeteer...\n");

  let browser = null;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

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
        const categoryUrl = `${BASE_URL}/category/${category.slug}`;
        const products = await scrapeCategory(
          browser,
          categoryUrl,
          category.slug,
        );

        let categoryInserted = 0;
        let categoryDuplicates = 0;

        for (const product of products) {
          if (!product.title || !product.price) continue;

          const fingerprint = crypto
            .createHash("md5")
            .update(`${storeId}:${product.url}:${product.title}`)
            .digest("hex");

          try {
            const result = await insertRawListing(storeId, product.url, {
              title: product.title,
              price: product.price,
              stock: product.stock,
              brand: product.brand,
              category: product.category,
              url: product.url,
              externalId: product.url.split("/").pop(),
              fingerprint,
            });

            if (result) {
              categoryInserted++;
              totalInserted++;
              console.log(
                `    ✓ ${product.title.substring(0, 60)}... - LKR ${product.price}`,
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
        console.log(`  ✗ Error scraping ${category.name}: ${error.message}\n`);
      }
    }

    await updateLastSyncTime(storeId);

    console.log("✅ Scrape complete!");
    console.log(`   📊 Total inserted: ${totalInserted}`);
    console.log(`   ⊘ Total duplicates: ${totalDuplicates}`);
  } catch (error) {
    console.error("❌ Scraper failed:", error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeCategory(browser, categoryUrl, categorySlug) {
  console.log(`  🔍 Loading ${categoryUrl}...`);

  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);

  try {
    await page.goto(categoryUrl, { waitUntil: "networkidle2" });

    // Wait for products to load
    await page
      .waitForSelector("a[href*='/product/']", { timeout: 5000 })
      .catch(() => {});

    // Extract product links
    const productLinks = await page.evaluate(() => {
      const links = new Set();
      document.querySelectorAll("a[href*='/product/']").forEach((el) => {
        const href = el.href;
        if (href && !href.includes("javascript")) {
          links.add(href);
        }
      });
      return Array.from(links);
    });

    console.log(`    ✓ Found ${productLinks.length} products`);

    // Extract details from each product page
    const products = [];

    for (
      let i = 0;
      i < Math.min(productLinks.length, PRODUCTS_PER_CATEGORY);
      i++
    ) {
      const productUrl = productLinks[i];
      const product = await extractProductDetails(browser, productUrl);

      if (product) {
        products.push(product);
      }
    }

    console.log(`    ✓ Extracted ${products.length} product details`);
    return products;
  } catch (error) {
    console.log(`    ✗ Error: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}

async function extractProductDetails(browser, productUrl) {
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);

  try {
    await page.goto(productUrl, { waitUntil: "networkidle2" });

    // Extract product data using Puppeteer's evaluate (runs in browser context)
    const product = await page.evaluate(() => {
      // Get title
      const titleElem =
        document.querySelector("h1") ||
        document.querySelector("h2") ||
        document.querySelector("[class*='title']");
      const title = titleElem?.textContent?.trim() || "";

      // Get price - search for all text containing "LKR"
      let price = null;
      const bodyText = document.body.innerText;
      const priceMatch = bodyText.match(/(\d+[\d,]*)\s*LKR/i);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ""));
      }

      // Get availability
      let stock = "in_stock";
      const stockText = document.body.innerText.toLowerCase();
      if (
        stockText.includes("out of stock") ||
        stockText.includes("unavailable")
      ) {
        stock = "out_of_stock";
      } else if (stockText.includes("limited") || stockText.includes("few")) {
        stock = "limited";
      }

      return {
        title: title.substring(0, 200),
        price,
        stock,
      };
    });

    if (!product.title || product.title.length < 3 || !product.price) {
      return null;
    }

    return {
      url: productUrl,
      title: product.title,
      price: product.price,
      stock: product.stock,
      brand: extractBrand(product.title),
      category: extractCategory(product.title),
    };
  } catch (error) {
    console.log(
      `      ⚠️  Failed to extract from ${productUrl.split("/").pop()}: ${error.message}`,
    );
    return null;
  } finally {
    await page.close();
  }
}

scrapeWithPuppeteer();
