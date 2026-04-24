#!/usr/bin/env node

/**
 * Debug Product Page Scraper
 * Check what data is on individual product pages
 */

import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function debugProductPage() {
  const productUrl =
    "https://www.nanotek.lk/product/chuwi-corebook-air-ryzen-5";

  console.log("🔍 Debugging product page scraping\n");
  console.log(`📄 URL: ${productUrl}\n`);

  try {
    const response = await fetch(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $("h1, h2, [class*='title']").first().text().trim();
    console.log("📝 Title:", title, "\n");

    // Look for price patterns
    console.log("💰 Searching for prices...");

    // Strategy 1: Direct text search
    const allText = $.text();
    const priceMatches = allText.match(/\d+[\d,]*\s*LKR/gi);
    if (priceMatches) {
      console.log("   ✓ Found price patterns:", priceMatches.slice(0, 5));
    }

    // Strategy 2: Check specific elements
    console.log("\n   Checking price-related elements:");
    $("[class*='price'], [class*='cost'], [class*='amount']").each((i, el) => {
      if (i < 5) {
        console.log(
          `     ${i + 1}. [${$(el).attr("class")}]: ${$(el).text().substring(0, 50)}`,
        );
      }
    });

    // Strategy 3: Check all divs with numbers
    console.log("\n   Elements with LKR:");
    $("*").each((i, el) => {
      const text = $(el).text();
      if (text.includes("LKR") && text.length < 100) {
        console.log(`     • ${text.substring(0, 80)}`);
      }
    });

    // Strategy 4: Look at page structure
    console.log("\n📊 Page structure:");
    console.log(`   Total divs: ${$("div").length}`);
    console.log(`   Total spans: ${$("span").length}`);
    console.log(`   Total inputs: ${$("input").length}`);

    // Check for input values (price might be in form)
    console.log("\n   Form inputs:");
    $("input[type='text'], input[type='hidden'], input[name*='price']").each(
      (i, el) => {
        if (i < 5) {
          const $el = $(el);
          console.log(`     • [${$el.attr("name")}]: ${$el.val()}`);
        }
      },
    );

    // Strategy 5: Check meta tags
    console.log("\n   Meta tags with price/product info:");
    $("meta").each((i, el) => {
      const $el = $(el);
      const content = $el.attr("content") || "";
      if (content.includes("price") || content.match(/\d+[,\d]*/)) {
        console.log(
          `     • ${$el.attr("property") || $el.attr("name")}: ${content.substring(0, 60)}`,
        );
      }
    });

    // Strategy 6: Look for specific product data structures
    console.log("\n   Checking for structured data (JSON-LD, etc.):");
    $("script[type='application/ld+json']").each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        console.log(
          `     ✓ Found structured data:`,
          JSON.stringify(data).substring(0, 100),
        );
      } catch (e) {
        // Not valid JSON
      }
    });

    // Get sample of page HTML (first 2000 chars)
    console.log("\n📋 HTML sample (first 2000 chars):");
    console.log(html.substring(0, 2000));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

debugProductPage();
