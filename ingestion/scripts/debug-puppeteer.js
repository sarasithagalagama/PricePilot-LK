#!/usr/bin/env node

/**
 * Debug Puppeteer Product Extraction
 */

import puppeteer from "puppeteer";

async function debugProduct() {
  console.log("🔍 Debugging Puppeteer product extraction\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    const productUrl =
      "https://www.nanotek.lk/product/chuwi-corebook-air-ryzen-5";
    console.log(`📄 Loading: ${productUrl}\n`);

    await page.goto(productUrl, { waitUntil: "networkidle2" });
    console.log("✓ Page loaded\n");

    // Extract page content
    const content = await page.evaluate(() => {
      return {
        title: document.querySelector("h1")?.textContent || "NO H1",
        allText: document.body.innerText.substring(0, 500),
        pricePattern:
          document.body.innerText.match(/(\d+[\d,]*)\s*LKR/i)?.[0] ||
          "NO PRICE",
        bodyLength: document.body.innerText.length,
      };
    });

    console.log("📝 Extracted content:");
    console.log(`   Title: ${content.title}`);
    console.log(`   Price: ${content.pricePattern}`);
    console.log(`   Body length: ${content.bodyLength} chars\n`);
    console.log(`   First 500 chars of page:\n   ${content.allText}\n`);

    // Check for common price selectors
    const priceInfo = await page.evaluate(() => {
      const selectors = [
        "span.price",
        "[class*='price']",
        "[class*='amount']",
        "[class*='cost']",
        "h2",
        "h3",
      ];

      const results = {};
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results[selector] = Array.from(elements)
            .slice(0, 3)
            .map((el) => el.textContent.substring(0, 100));
        }
      }
      return results;
    });

    console.log("🏷️  Price-related elements:");
    console.log(JSON.stringify(priceInfo, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await browser.close();
  }
}

debugProduct();
