#!/usr/bin/env node

/**
 * Pipeline Orchestrator
 *
 * Coordinates the complete ingestion workflow:
 * 1. Seed → Create stores, categories, brands
 * 2. Scrape → Fetch raw listings from stores
 * 3. Match → Link raw listings to canonical products
 * 4. Snapshot → Record price_history
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

function runScript(scriptPath, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`▶️  ${description}`);
    console.log(`${"=".repeat(60)}`);

    const child = spawn("node", [scriptPath], {
      cwd: ROOT,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${description} failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function runPipeline() {
  console.log("\n🚀 PricePilot Ingestion Pipeline\n");

  try {
    // Step 1: Seed
    await runScript(
      join(ROOT, "scripts", "seed.js"),
      "STEP 1: Seeding categories, brands, stores",
    );

    // Step 2: Scrape Nanotek
    await runScript(
      join(ROOT, "scrapers", "nanotek.js"),
      "STEP 2: Scraping Nanotek listings",
    );

    // Step 3: Match listings to products
    // This is imported and run directly since it's not a standalone script yet
    console.log(`\n${"=".repeat(60)}`);
    console.log(`▶️  STEP 3: Matching raw listings to products`);
    console.log(`${"=".repeat(60)}`);

    const { matchRawListings } = await import("../lib/match.js");
    await matchRawListings(100);

    // Step 4: Summary
    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ Pipeline Complete!`);
    console.log(`${"=".repeat(60)}`);
    console.log(`\n📊 Next steps:`);
    console.log(
      `   1. Review unmatched listings in listing_matches (needs_review)`,
    );
    console.log(`   2. Manually match or create products as needed`);
    console.log(`   3. Check Supabase dashboard for data integrity`);
    console.log(`   4. Test app: npm run dev\n`);
  } catch (error) {
    console.error("\n❌ Pipeline failed:", error.message);
    process.exit(1);
  }
}

runPipeline();
