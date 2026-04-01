/**
 * Unit tests for the Bitcoin Tonight Coin price algorithm.
 * Run with: node tests/price-algorithm.test.js
 */

// ── Inline the algorithm (Node.js doesn't have Web Crypto in older versions) ──
const LAUNCH_HOUR = 23;

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function calculateCoinPrice(launchDate, coinId) {
  const now = new Date();
  const [year, month, day] = launchDate.split("-").map(Number);
  const launch = new Date(year, month - 1, day, LAUNCH_HOUR, 0, 0, 0);

  if (now < launch) {
    return { price: 1.0, dailyIncrease: 0, daysElapsed: 0, launched: false };
  }

  const msElapsed = now - launch;
  const hoursElapsed = msElapsed / (1000 * 60 * 60);
  const coinSeed = coinId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const fullDays = Math.floor(hoursElapsed / 24);

  let price = 1.0;
  for (let d = 0; d < fullDays; d++) {
    const rand = seededRandom(coinSeed + d * 137);
    const increase = 1.0 + rand * 4.0;
    price += increase;
  }

  const partialHours = hoursElapsed - fullDays * 24;
  const todaySeed = seededRandom(coinSeed + fullDays * 137);
  const todayRate = (1.0 + todaySeed * 4.0) / 24;
  price += partialHours * todayRate;

  const dailyIncrease = 1.0 + todaySeed * 4.0;

  return {
    price: Math.round(price * 100) / 100,
    dailyIncrease: Math.round(dailyIncrease * 100) / 100,
    daysElapsed: fullDays,
    launched: true,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== Bitcoin Tonight Coin — Price Algorithm Tests ===\n");

// ── Test 1: Pre-launch coin starts at $1 ─────────────────────────────────────
console.log("Test 1: Pre-launch price");
{
  // Far future date
  const result = calculateCoinPrice("2099-01-01", "btn");
  assert(result.price === 1.0, "Pre-launch price is exactly $1.00");
  assert(result.launched === false, "Pre-launch launched flag is false");
  assert(result.daysElapsed === 0, "Pre-launch daysElapsed is 0");
}

// ── Test 2: Post-launch price is above $1 ────────────────────────────────────
console.log("\nTest 2: Post-launch price growth");
{
  // Past date that has been running for at least 1 day
  const result = calculateCoinPrice("2020-01-01", "btn");
  assert(result.launched === true, "Old coin is launched");
  assert(result.price > 1.0, "Price is above $1 after many days");
  assert(result.daysElapsed > 0, "daysElapsed > 0 for old coin");
}

// ── Test 3: Daily increase stays in $1–$5 range ──────────────────────────────
console.log("\nTest 3: Daily increase bounds");
{
  const coins = ["btn", "jaimie", "djvertigo", "fred", "darkside", "gary", "grantcardone"];
  coins.forEach((id) => {
    const result = calculateCoinPrice("2020-01-01", id);
    assert(
      result.dailyIncrease >= 1.0 && result.dailyIncrease <= 5.0,
      `${id}: dailyIncrease $${result.dailyIncrease} is within $1–$5`
    );
  });
}

// ── Test 4: Each coin has a different price (seeded by coinId) ───────────────
console.log("\nTest 4: Coins diverge (different prices)");
{
  const prices = ["btn", "jaimie", "djvertigo", "fred", "darkside", "gary", "grantcardone"]
    .map((id) => calculateCoinPrice("2020-01-01", id).price);
  const unique = new Set(prices);
  assert(unique.size === prices.length, `All ${prices.length} coins have distinct prices`);
}

// ── Test 5: Price is deterministic (same inputs → same output) ────────────────
console.log("\nTest 5: Determinism");
{
  const r1 = calculateCoinPrice("2020-01-01", "btn");
  const r2 = calculateCoinPrice("2020-01-01", "btn");
  assert(r1.price === r2.price, "Same inputs produce same price");
  assert(r1.dailyIncrease === r2.dailyIncrease, "Same inputs produce same dailyIncrease");
}

// ── Test 6: seededRandom always in [0, 1) ────────────────────────────────────
console.log("\nTest 6: seededRandom range");
{
  let allInRange = true;
  for (let i = 0; i < 1000; i++) {
    const v = seededRandom(i);
    if (v < 0 || v >= 1) {
      allInRange = false;
      break;
    }
  }
  assert(allInRange, "seededRandom(0..999) always in [0, 1)");
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
