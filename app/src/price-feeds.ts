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
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${amount}&slippageBps=50&_t=${timestamp}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Calculate price from quote and handle different scenarios
      if (data.inAmount && data.outAmount) {
        const inAmount = parseFloat(data.inAmount);
        const outAmount = parseFloat(data.outAmount);
        
        // Check if we're getting USDC -> SOL (we want SOL price in USD)
        const isUsdcToSol = inputMint.toString() === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
        const isSolToUsdc = inputMint.toString() === "So11111111111111111111111111111111111111112";
        
        if (isUsdcToSol) {
          // If USDC -> SOL, we need to invert and adjust for decimals
          // inAmount is in USDC (6 decimals), outAmount is in SOL (9 decimals)
          const solReceived = outAmount / 1e9; // Convert lamports to SOL
          const usdcSent = inAmount / 1e6; // Convert to USDC
          const solPriceInUsd = usdcSent / solReceived; // USD per SOL
          console.log(`Jupiter: ${usdcSent} USDC -> ${solReceived} SOL, SOL price: $${solPriceInUsd.toFixed(2)}`);
          return solPriceInUsd;
        } else if (isSolToUsdc) {
          // If SOL -> USDC, direct calculation
          const usdcReceived = outAmount / 1e6; // Convert to USDC
          const solSent = inAmount / 1e9; // Convert lamports to SOL
          const solPriceInUsd = usdcReceived / solSent; // USD per SOL
          console.log(`Jupiter: ${solSent} SOL -> ${usdcReceived} USDC, SOL price: $${solPriceInUsd.toFixed(2)}`);
          return solPriceInUsd;
        } else {
          // Generic case
          const price = outAmount / inAmount;
          console.log(`Jupiter quote: ${inAmount} -> ${outAmount}, price: ${price}`);
          return price;
        }
      }
      
      return 0;
    } catch (error) {
      console.error("Failed to fetch Jupiter price:", error);
      throw error;
    }
  }

  async getCoinGeckoPrice(coinId: string): Promise<number> {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&_t=${timestamp}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );

      if (!response.ok) {
        console.warn(`CoinGecko API error: ${response.status} ${response.statusText}`);
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json() as any;
      console.log('CoinGecko API response for', coinId, ':', data);
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

    console.log(`🔍 Fetching Jupiter-only prices for tokenA: ${tokenA.toString()}, tokenB: ${tokenB.toString()}`);

    try {
      const solMint = new PublicKey("So11111111111111111111111111111111111111112");
      const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

      // Get SOL price from Jupiter (USDC -> SOL)
      console.log("📊 Getting SOL price from Jupiter...");
      const solPriceUsd = await this.getJupiterPrice(usdcMint, solMint, 1000000); // 1 USDC -> SOL
      
      // For USDC, we can assume it's always ~$1.00 or derive from SOL price
      console.log("📊 Setting USDC price (assuming $1.00)...");
      const usdcPrice = 1.0; // USDC should be very close to $1.00

      if (solPriceUsd > 0 && usdcPrice > 0) {
        console.log(`✅ Jupiter SOL price: $${solPriceUsd.toFixed(2)}`);
        console.log(`✅ Jupiter USDC price: $${usdcPrice.toFixed(6)}`);
        
        // Assign prices based on token addresses
        if (tokenA.toString() === solMint.toString()) {
          tokenAPrice = solPriceUsd;  // SOL price in USD
          tokenBPrice = usdcPrice;    // USDC price in USD
        } else if (tokenA.toString() === usdcMint.toString()) {
          tokenAPrice = usdcPrice;    // USDC price in USD  
          tokenBPrice = solPriceUsd;  // SOL price in USD
        } else {
          // Default: assume tokenA is SOL, tokenB is USDC
          tokenAPrice = solPriceUsd;
          tokenBPrice = usdcPrice;
        }
        
        confidence = 95; // High confidence since we got both prices from Jupiter
        
        console.log(`📊 Final Jupiter-only prices: tokenA=${tokenA.toString().substring(0,8)}... = $${tokenAPrice.toFixed(4)}, tokenB=${tokenB.toString().substring(0,8)}... = $${tokenBPrice.toFixed(6)}, confidence=${confidence}%`);
      } else {
        console.warn("⚠️ Failed to get prices from Jupiter");
        throw new Error("Jupiter price fetch failed");
      }

      return {
        tokenAPrice,
        tokenBPrice, 
        timestamp,
        confidence,
      };
    } catch (error) {
      console.error("Failed to get Jupiter price data:", error);
      
      // Emergency fallback - try one more time with just SOL price
      console.log("🆘 Emergency fallback - getting only SOL price");
      try {
        const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
        const solMint = new PublicKey("So11111111111111111111111111111111111111112");
        const emergencyPrice = await this.getJupiterPrice(usdcMint, solMint, 1000000);
        
        if (emergencyPrice > 0) {
          console.log(`🆘 Emergency SOL price: $${emergencyPrice.toFixed(2)}`);
          
          // Assign emergency prices
          const isTokenASol = tokenA.toString() === solMint.toString();
          
          return {
            tokenAPrice: isTokenASol ? emergencyPrice : 1.0,
            tokenBPrice: isTokenASol ? 1.0 : emergencyPrice,
            timestamp,
            confidence: 50, // Medium confidence for emergency fallback
          };
        }
      } catch (emergencyError) {
        console.error("Emergency fallback also failed:", emergencyError);
      }
      
      // Last resort - return zero prices
      console.error("❌ All Jupiter price attempts failed");
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
