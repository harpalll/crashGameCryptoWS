import axios from "axios";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
const SUPPORTED_CURRENCIES = {
  BTC: "bitcoin",
  ETH: "ethereum",
};
const CACHE_DURATION = 10000; // 10s

const priceCache = {};

class CryptoService {
  async getPrices() {
    const now = Date.now();
    const currencyIds = Object.values(SUPPORTED_CURRENCIES).join(",");

    // ✅ Use cache if valid
    const areAllCached = Object.keys(SUPPORTED_CURRENCIES).every(
      (symbol) =>
        priceCache[symbol] &&
        now - priceCache[symbol].lastFetch < CACHE_DURATION
    );

    if (areAllCached) {
      const prices = {};
      for (const symbol in priceCache) {
        prices[symbol] = priceCache[symbol].price;
      }
      return prices;
    }

    // 🔁 Fetch from CoinGecko
    try {
      const response = await axios.get(COINGECKO_API_URL, {
        params: {
          ids: currencyIds,
          vs_currencies: "usd",
        },
        timeout: 5000,
      });

      const prices = {};
      for (const symbol in SUPPORTED_CURRENCIES) {
        const id = SUPPORTED_CURRENCIES[symbol];
        const price = response.data?.[id]?.usd;

        if (price) {
          prices[symbol] = price;
          priceCache[symbol] = {
            price,
            lastFetch: now,
          };
        } else {
          throw new Error(`Missing price for ${id}`);
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("💸 Live Prices:", prices);
      }

      return prices;
    } catch (error) {
      console.error("❌ Error fetching crypto prices from API:");
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Body:", error.response.data);
      } else {
        console.error("Message:", error.message);
      }

      // 🔁 Fallback to cached prices
      const fallbackPrices = {};
      for (const symbol in priceCache) {
        fallbackPrices[symbol] = priceCache[symbol].price;
      }

      if (Object.keys(fallbackPrices).length > 0) {
        console.warn("⚠️ Using stale cached prices.");
        return fallbackPrices;
      }

      // ⚠️ Final fallback: hardcoded prices (for demo/stability)
      if (process.env.NODE_ENV === "production") {
        console.warn("⚠️ Using hardcoded fallback prices.");
        return {
          BTC: 60000,
          ETH: 3500,
        };
      }

      throw new Error("Could not fetch cryptocurrency prices.");
    }
  }

  convertUsdToCrypto(usdAmount, currencySymbol, prices) {
    if (!prices[currencySymbol]) {
      throw new Error(`Price for ${currencySymbol} is not available.`);
    }
    if (usdAmount <= 0) {
      throw new Error("USD amount must be positive.");
    }
    return usdAmount / prices[currencySymbol];
  }
}

export default new CryptoService();
