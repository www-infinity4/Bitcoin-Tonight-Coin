/**
 * Bitcoin Tonight Coin — Coin Registry
 * All coins listed here. Each coin starts at $1.00 at 11 PM on its launch date
 * and rises $1–$5 per day via a deterministic seeded algorithm.
 */

const LAUNCH_HOUR = 23; // 11 PM

const COINS = [
  {
    id: "btn",
    name: "Bitcoin Tonight",
    ticker: "BTN",
    description:
      "The flagship coin of Bitcoin Tonight. Bitcoin-grade SHA-256 hashing, born independent of the corrupt legacy chain. This is the real deal — decentralised, transparent, and tonight-powered.",
    launchDate: "2026-04-01",
    color: "#f7931a",
    icon: "₿",
  },
  {
    id: "jaimie",
    name: "Jaimie Coin",
    ticker: "JMC",
    description:
      "Dedicated to Jaimie — a pillar of the Bitcoin Tonight community. Own a piece of the legend.",
    launchDate: "2026-04-01",
    color: "#9b59b6",
    icon: "J",
  },
  {
    id: "djvertigo",
    name: "DJ Vertigo Coin",
    ticker: "DJV",
    description:
      "Drop the beat and hold the coin. DJ Vertigo's personal token spins up value every single day.",
    launchDate: "2026-04-01",
    color: "#3498db",
    icon: "♫",
  },
  {
    id: "fred",
    name: "Fred Coin",
    ticker: "FRD",
    description:
      "Solid, reliable, and always rising. Fred Coin is for those who keep it real.",
    launchDate: "2026-04-01",
    color: "#27ae60",
    icon: "F",
  },
  {
    id: "darkside",
    name: "Darkside Coin",
    ticker: "DRK",
    description:
      "Embrace the dark side of the market. Darkside Coin thrives where others fear to tread.",
    launchDate: "2026-04-01",
    color: "#2c3e50",
    icon: "☽",
  },
  {
    id: "gary",
    name: "Gary Coin",
    ticker: "GRY",
    description:
      "Gary's coin: straightforward, no-nonsense, and climbing every day.",
    launchDate: "2026-04-01",
    color: "#e74c3c",
    icon: "G",
  },
  {
    id: "grantcardone",
    name: "Grant Cardone Coin",
    ticker: "GCC",
    description:
      "10X your portfolio. Grant Cardone Coin is for those who refuse to play small.",
    launchDate: "2026-04-01",
    color: "#e67e22",
    icon: "10X",
  },
];

/**
 * Deterministic seeded pseudo-random number in [0, 1)
 * Based on a simple LCG so the same day always produces the same increase.
 * @param {number} seed
 * @returns {number}
 */
function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Calculate the current price of a coin.
 * @param {string} launchDate  ISO date string "YYYY-MM-DD"
 * @param {string} coinId      Used as part of the seed so each coin moves differently
 * @returns {{ price: number, dailyIncrease: number, daysElapsed: number }}
 */
function calculateCoinPrice(launchDate, coinId) {
  const now = new Date();

  // Launch moment: 11 PM on the launch date
  const [year, month, day] = launchDate.split("-").map(Number);
  const launch = new Date(year, month - 1, day, LAUNCH_HOUR, 0, 0, 0);

  if (now < launch) {
    return { price: 1.0, dailyIncrease: 0, daysElapsed: 0, launched: false };
  }

  const msElapsed = now - launch;
  const hoursElapsed = msElapsed / (1000 * 60 * 60);

  // Seed offset unique to each coin so coins diverge
  const coinSeed = coinId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // Full days completed
  const fullDays = Math.floor(hoursElapsed / 24);

  // Build price by summing each completed day's increase
  let price = 1.0;
  for (let d = 0; d < fullDays; d++) {
    // Daily increase: $1.00 – $5.00  (seeded by day + coinSeed)
    const rand = seededRandom(coinSeed + d * 137);
    const increase = 1.0 + rand * 4.0; // range [1, 5)
    price += increase;
  }

  // Partial day: $0.20 per hour approximation (fractional)
  const partialHours = hoursElapsed - fullDays * 24;
  const todaySeed = seededRandom(coinSeed + fullDays * 137);
  const todayRate = (1.0 + todaySeed * 4.0) / 24; // today's hourly rate
  price += partialHours * todayRate;

  // Today's projected full-day increase (for display)
  const dailyIncrease = 1.0 + todaySeed * 4.0;

  return {
    price: Math.round(price * 100) / 100,
    dailyIncrease: Math.round(dailyIncrease * 100) / 100,
    daysElapsed: fullDays,
    launched: true,
  };
}

/**
 * Simple SHA-256 hash display using the Web Crypto API.
 * Returns a hex string for the given message.
 * @param {string} message
 * @returns {Promise<string>}
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
