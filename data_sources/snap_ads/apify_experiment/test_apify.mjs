/**
 * Quick test of the Apify Snapchat Ads Scraper (zadexinho/snapchat-ads-scraper)
 *
 * Usage:
 *   APIFY_TOKEN=your_token node test_apify.mjs "Nike" DE 10
 *   APIFY_TOKEN=your_token node test_apify.mjs "adidas" DE 5
 *
 * Sign up (free $5 credits, no CC): https://console.apify.com/sign-up
 * Get your token: https://console.apify.com/account/integrations
 */

import { ApifyClient } from "apify-client";
import { writeFileSync, mkdirSync } from "node:fs";

const token = process.env.APIFY_TOKEN;
if (!token) {
  console.error("Missing APIFY_TOKEN. Get one at https://console.apify.com/account/integrations");
  process.exit(1);
}

const search = process.argv[2] || "Nike";
const country = process.argv[3] || "DE";
const maxItems = parseInt(process.argv[4] || "10", 10);

console.log(`[*] Searching: "${search}" | Country: ${country} | Max: ${maxItems}`);
console.log(`[*] Using actor: zadexinho/snapchat-ads-scraper`);

const client = new ApifyClient({ token });

console.log(`[*] Starting actor run...`);
const run = await client.actor("zadexinho/snapchat-ads-scraper").call({
  search,
  country,
  maxItems,
  proxyConfiguration: { useApifyProxy: true },
});

console.log(`[*] Run finished. Status: ${run.status}`);
console.log(`[*] Fetching results from dataset ${run.defaultDatasetId}...`);

const { items } = await client.dataset(run.defaultDatasetId).listItems();

console.log(`[*] Got ${items.length} ads`);

if (items.length > 0) {
  console.log(`\n--- First result ---`);
  console.log(JSON.stringify(items[0], null, 2));

  mkdirSync("results", { recursive: true });
  const filename = `results/${search.replace(/[^a-zA-Z0-9]/g, "_")}_${country}_${Date.now()}.json`;
  writeFileSync(filename, JSON.stringify(items, null, 2));
  console.log(`\n[*] All results saved to ${filename}`);
} else {
  console.log(`[!] No results returned. The actor may have hit rate limits or the name doesn't match.`);
}
