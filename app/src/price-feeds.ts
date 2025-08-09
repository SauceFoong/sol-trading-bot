import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export interface PriceData {
  tokenAPrice: number;
  tokenBPrice: number;
  timestamp: number;
  confidence: number;
}

export class PriceFeedManager {
  private connection: Connection;
  private pythProgram: PublicKey;
  private chainlinkProgram: PublicKey;

  constructor(connection: Connection) {
    this.connection = connection;
    // Pyth Network Program ID
    this.pythProgram = new PublicKey(
      "FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH"
    );
    // Chainlink Program ID (placeholder)
    this.chainlinkProgram = new PublicKey(
      "HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny"
    );
  }

  async getPythPrice(priceAccount: PublicKey): Promise<number> {
    try {
      const accountInfo = await this.connection.getAccountInfo(priceAccount);
      if (!accountInfo) {
        throw new Error("Price account not found");
      }

      // Parse Pyth price data (simplified)
      // In a real implementation, you'd use the Pyth SDK
      const data = accountInfo.data;

      // This is a placeholder - use actual Pyth SDK for proper parsing
      const price = 50.0; // Placeholder price

      return price;
    } catch (error) {
      console.error("Failed to fetch Pyth price:", error);
      throw error;
    }
  }

  async getJupiterPrice(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: number
  ): Promise<number> {
    try {
      // Use Jupiter Price API
      const response = await fetch(
        `https://price.jup.ag/v4/price?ids=${inputMint.toString()}&vsToken=${outputMint.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Jupiter price");
      }

      const data = await response.json();
      return data.data[inputMint.toString()]?.price || 0;
    } catch (error) {
      console.error("Failed to fetch Jupiter price:", error);
      throw error;
    }
  }

  async getCoinGeckoPrice(coinId: string): Promise<number> {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch CoinGecko price");
      }

      const data = await response.json();
      return data[coinId]?.usd || 0;
    } catch (error) {
      console.error("Failed to fetch CoinGecko price:", error);
      throw error;
    }
  }

  async getComprehensivePriceData(
    tokenA: PublicKey,
    tokenB: PublicKey,
    pythAccountA?: PublicKey,
    pythAccountB?: PublicKey
  ): Promise<PriceData> {
    const timestamp = Date.now();
    let tokenAPrice = 0;
    let tokenBPrice = 0;
    let confidence = 0;

    try {
      // Try multiple price sources for redundancy
      const promises: Promise<number>[] = [];

      // Jupiter prices
      promises.push(this.getJupiterPrice(tokenA, tokenB, 1));

      // Pyth prices if available
      if (pythAccountA) {
        promises.push(this.getPythPrice(pythAccountA));
      }

      if (pythAccountB) {
        promises.push(this.getPythPrice(pythAccountB));
      }

      // CoinGecko as fallback for major tokens
      if (tokenA.toString() === "So11111111111111111111111111111111111111112") {
        // SOL
        promises.push(this.getCoinGeckoPrice("solana"));
      }

      if (
        tokenB.toString() === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      ) {
        // USDC
        promises.push(this.getCoinGeckoPrice("usd-coin"));
      }

      const results = await Promise.allSettled(promises);
      const successfulResults = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => (result as PromiseFulfilledResult<number>).value)
        .filter((price) => price > 0);

      if (successfulResults.length > 0) {
        // Use average of successful price fetches
        tokenAPrice =
          successfulResults.reduce((sum, price) => sum + price, 0) /
          successfulResults.length;
        tokenBPrice = 1; // Assuming token B is the base (like USDC)
        confidence = Math.min(successfulResults.length * 25, 100); // More sources = higher confidence
      }

      return {
        tokenAPrice,
        tokenBPrice,
        timestamp,
        confidence,
      };
    } catch (error) {
      console.error("Failed to get comprehensive price data:", error);
      return {
        tokenAPrice: 0,
        tokenBPrice: 0,
        timestamp,
        confidence: 0,
      };
    }
  }

  async startPriceMonitoring(
    tokenA: PublicKey,
    tokenB: PublicKey,
    callback: (priceData: PriceData) => void,
    intervalMs: number = 30000 // 30 seconds
  ): Promise<NodeJS.Timeout> {
    console.log("Starting price monitoring...");

    const interval = setInterval(async () => {
      try {
        const priceData = await this.getComprehensivePriceData(tokenA, tokenB);
        callback(priceData);
      } catch (error) {
        console.error("Error in price monitoring:", error);
      }
    }, intervalMs);

    return interval;
  }

  stopPriceMonitoring(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    console.log("Price monitoring stopped");
  }
}

// Example usage
export class PriceAlertManager {
  private priceFeed: PriceFeedManager;
  private alerts: Map<string, (price: number) => void>;

  constructor(connection: Connection) {
    this.priceFeed = new PriceFeedManager(connection);
    this.alerts = new Map();
  }

  addPriceAlert(
    id: string,
    targetPrice: number,
    condition: "above" | "below",
    callback: (price: number) => void
  ): void {
    this.alerts.set(id, (currentPrice: number) => {
      if (
        (condition === "above" && currentPrice > targetPrice) ||
        (condition === "below" && currentPrice < targetPrice)
      ) {
        callback(currentPrice);
        this.alerts.delete(id); // Remove alert after triggering
      }
    });
  }

  removePriceAlert(id: string): void {
    this.alerts.delete(id);
  }

  checkAlerts(priceData: PriceData): void {
    this.alerts.forEach((callback, id) => {
      callback(priceData.tokenAPrice);
    });
  }
}
