#!/usr/bin/env node

/**
 * Standalone Post-Deployment Smoke Test Script
 * Usage: node scripts/smoke-test.js [BASE_URL]
 * Example: node scripts/smoke-test.js https://broker-streets-backend.up.railway.app
 */

const targetUrl = process.argv[2] || 'http://localhost:5000';

console.log(`\n🔍 Starting post-deployment smoke test against: ${targetUrl}\n`);

const endpoints = [
  { name: 'Root Health Check', path: '/health', expectedStatus: 200 },
  { name: 'API Health Check', path: '/api/health', expectedStatus: 200 },
  { name: 'Public Listings Endpoint', path: '/api/listings', expectedStatus: 200 },
  { name: '404 Fallback Route', path: '/api/non-existent-route-smoke-test', expectedStatus: 404 },
];

async function runSmokeTests() {
  let passedCount = 0;
  let failedCount = 0;

  for (const endpoint of endpoints) {
    const fullUrl = `${targetUrl.replace(/\/$/, '')}${endpoint.path}`;
    try {
      const response = await fetch(fullUrl, { method: 'GET' });
      const status = response.status;
      let body;
      try {
        body = await response.json();
      } catch (e) {
        body = null;
      }

      if (status === endpoint.expectedStatus) {
        console.log(`  ✅ [PASS] ${endpoint.name} (${endpoint.path}) -> HTTP ${status}`);
        passedCount++;
      } else {
        console.error(
          `  ❌ [FAIL] ${endpoint.name} (${endpoint.path}) -> Expected ${endpoint.expectedStatus}, got ${status}`
        );
        if (body) console.error(`     Response: ${JSON.stringify(body)}`);
        failedCount++;
      }
    } catch (error) {
      console.error(`  ❌ [FAIL] ${endpoint.name} (${endpoint.path}) -> Network/Fetch Error: ${error.message}`);
      failedCount++;
    }
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`Smoke Test Summary: ${passedCount} PASSED, ${failedCount} FAILED out of ${endpoints.length} checks.\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSmokeTests();
