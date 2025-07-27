import axios from "axios";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
const SUPPORTED_CURRENCIES = {
  BTC: "bitcoin",
  ETH: "ethereum",
};
const CACHE_DURATION = 10000; // 10 seconds in ms

const priceCache = {};

class CryptoService {
  async getPrices() {
    const now = Date.now();
    const currencyIds = Object.values(SUPPORTED_CURRENCIES).join(",");

    // Check if a valid cache exists for all currencies
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

    // Fetch from API if cache is stale or non-existent
    try {
      const response = await axios.get(COINGECKO_API_URL, {
        params: {
          ids: currencyIds,
          vs_currencies: "usd",
        },
        timeout: 5000, // 5-second timeout
      });

      const prices = {};
      for (const symbol in SUPPORTED_CURRENCIES) {
        const id = SUPPORTED_CURRENCIES[symbol];
        if (response.data[id]) {
          prices[symbol] = response.data[id].usd;
          // Update cache
          priceCache[symbol] = {
            price: prices[symbol],
            lastFetch: now,
          };
        }
      }

      console.log(prices);
      return prices;
    } catch (error) {
      console.error("Error fetching crypto prices from API:", error.message);
      // On failure, fallback to the last known prices if available
      const fallbackPrices = {};
      for (const symbol in priceCache) {
        fallbackPrices[symbol] = priceCache[symbol].price;
      }
      if (Object.keys(fallbackPrices).length > 0) {
        console.log("Using stale cache as fallback.");
        return fallbackPrices;
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
    const price = prices[currencySymbol];
    return usdAmount / price;
  }
}

// Export a singleton instance of the service
export default new CryptoService();
