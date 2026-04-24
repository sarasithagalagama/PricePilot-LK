#!/usr/bin/env node

/**
 * API Inspector for Nanotek - Extract Product Data
 * Finds and extracts actual product information from Nanotek pages
 */

import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function inspectAndExtractProducts() {
  console.log("🔍 Extracting products from Nanotek...\n");

  try {
    const categories = [
      { url: "https://www.nanotek.lk/category/laptop", name: "Laptop" },
      {
        url: "https://www.nanotek.lk/category/graphics-card",
        name: "Graphics Card",
      },
    ];

    for (const category of categories) {
      console.log(`📂 Category: ${category.name}`);
      console.log(`   URL: ${category.url}\n`);

      try {
        const response = await fetch(category.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        // Try multiple selector strategies
        let products = [];

        // Strategy 1: Look for divs with product-related attributes
        $(
          "div[class*='product'], div[class*='item'], a[href*='/product']",
        ).each((i, el) => {
          if (i > 4) return; // Limit to first 5

          const $el = $(el);
          const text = $el.text().trim();
          const href = $el.find("a").attr("href") || $el.attr("href") || "";
          const price = text.match(/\d+[,\d]*/)?.[0] || "";

          if (text.length > 5 && price.length > 0) {
            products.push({
              title: text.substring(0, 80),
              price,
              link: href,
            });
          }
        });

        if (products.length === 0) {
          // Strategy 2: Look for all links with prices
          $("a").each((i, el) => {
            if (i > 10) return;
            const $el = $(el);
            const text = $el.text().trim();
            const href = $el.attr("href") || "";
            const nextText =
              $el
                .next()
                .text()
                .match(/\d+[,\d]*/)?.[0] || "";

            if (
              text.length > 10 &&
              (nextText || text.match(/\d+[,\d]*lkr?/i))
            ) {
              products.push({
                title: text.substring(0, 80),
                price: nextText || "N/A",
                link: href,
              });
            }
          });
        }

        if (products.length > 0) {
          console.log(`   ✅ Found ${products.length} products:\n`);
          products.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.title}`);
            console.log(`      Price: ${p.price}`);
            console.log(`      Link: ${p.link}\n`);
          });
        } else {
          console.log(`   ⚠️  No products extracted\n`);

          // Show what we have
          console.log(`   📊 Total links on page: ${$("a").length}`);
          console.log(`   📊 Total divs: ${$("div").length}`);
          console.log(`   📊 Page size: ${html.length} bytes\n`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
  }
}

inspectAndExtractProducts();
