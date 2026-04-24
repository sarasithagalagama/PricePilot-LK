#!/usr/bin/env node

/**
 * API Inspector for Nanotek
 * Finds API endpoints and JSON data embedded in page
 */

import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function inspectNanotek() {
  console.log("🔍 Inspecting Nanotek API structure...\n");

  try {
    const response = await fetch("https://www.nanotek.lk/category/laptop", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for script tags with data
    const scripts = $("script");
    console.log("📝 Found", scripts.length, "script tags\n");

    let apiEndpointFound = false;
    let jsonDataFound = false;

    scripts.each((i, script) => {
      const content = $(script).html() || "";

      // Look for API endpoints
      if (
        content.includes("/api/") ||
        content.includes("fetch(") ||
        content.includes("graphql")
      ) {
        console.log("🔗 Script", i, "contains API reference:");
        console.log(content.substring(0, 300));
        console.log("...\n");
        apiEndpointFound = true;
      }

      // Look for JSON data
      if (content.includes("window.") && content.includes("{")) {
        console.log("📊 Script", i, "contains data object:");
        console.log(content.substring(0, 300));
        console.log("...\n");
        jsonDataFound = true;
      }
    });

    // Look for product elements in HTML
    const products = $(".product, [class*='product'], .item, [class*='item']");
    console.log("📦 Found", products.length, "potential product elements\n");

    if (products.length > 0) {
      console.log("📦 Sample product element (first 3):");
      products.slice(0, 3).each((i, el) => {
        const text = $(el).text().substring(0, 150);
        console.log(`  ${i + 1}. ${text}`);
      });
    }

    // Look for data attributes
    const elementsWithData = $("[data-*]");
    if (elementsWithData.length > 0) {
      console.log(
        "\n🏷️  Found",
        elementsWithData.length,
        "elements with data attributes",
      );
      elementsWithData.slice(0, 3).each((i, el) => {
        const attrs = el.attribs;
        console.log(`  ${i + 1}. ${JSON.stringify(attrs).substring(0, 200)}`);
      });
    }

    // Check for Next.js or other framework patterns
    if (html.includes("__NEXT_DATA__")) {
      console.log("\n✅ Found Next.js data (page is likely Next.js)");
    }
    if (html.includes("__NUXT__")) {
      console.log("\n✅ Found Nuxt data");
    }
    if (html.includes("initialState")) {
      console.log("\n✅ Found initialState (likely React)");
    }

    // Look for meta tags with API endpoints
    const metas = $("meta");
    metas.each((i, meta) => {
      const attrs = $(meta).attr() || {};
      if (JSON.stringify(attrs).includes("api")) {
        console.log("\n🔗 Meta tag with API:", JSON.stringify(attrs));
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

inspectNanotek();
