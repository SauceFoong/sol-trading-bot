import { PublicKey } from "@solana/web3.js";
import { PriceFeedManager, PriceData } from "./price-feeds";

interface PricePoint {
  price: number;
  timestamp: number;
}

interface MeanReversionConfig {
  // Thresholds
  dropThreshold: number; // e.g., 0.15 for 0.15%
  bounceThreshold: number; // e.g., 0.15 for 0.15%
  
  // Time windows
  monitorWindowMs: number; // e.g., 120000 for 2 minutes
  maxPositionTimeMs: number; // e.g., 300000 for 5 minutes max hold
  
  // Trade amounts
  tradeAmountUsdc: number; // e.g., 10 USDC per trade
  maxSlippageBps: number; // e.g., 50 for 0.5%
  
  // Risk management
  stopLossPercent: number; // e.g., 1.0 for 1% stop loss
  takeProfitPercent: number; // e.g., 0.5 for 0.5% take profit
}

export interface MeanReversionSignal {
  type: 'buy' | 'sell' | 'none';
  reason: string;
  confidence: number; // 0-100
  priceChange: number; // percentage
  timeWindow: number; // milliseconds
  currentPrice: number;
  entryPrice?: number;
}

export class MicroMeanReversionStrategy {
  private config: MeanReversionConfig;
  private priceHistory: PricePoint[] = [];
  private currentPosition: 'none' | 'long' = 'none';
  private entryPrice: number = 0;
  private entryTime: number = 0;
  private priceFeed: PriceFeedManager;
  
  constructor(priceFeed: PriceFeedManager, config?: Partial<MeanReversionConfig>) {
    this.priceFeed = priceFeed;
    this.config = {
      // Default configuration
      dropThreshold: 0.15, // 0.15%
      bounceThreshold: 0.15, // 0.15%
      monitorWindowMs: 120000, // 2 minutes
      maxPositionTimeMs: 300000, // 5 minutes
      tradeAmountUsdc: 10, // 10 USDC
      maxSlippageBps: 50, // 0.5%
      stopLossPercent: 1.0, // 1%
      takeProfitPercent: 0.5, // 0.5%
      ...config
    };
  }

  // Update price history and clean old data
  updatePriceHistory(priceData: PriceData): void {
    const now = Date.now();
    
    // Add new price point
    this.priceHistory.push({
      price: priceData.tokenAPrice,
      timestamp: now
    });

    // Remove data older than monitor window
    const cutoffTime = now - this.config.monitorWindowMs;
    this.priceHistory = this.priceHistory.filter(point => point.timestamp > cutoffTime);

    // Keep only last 100 points to prevent memory issues
    if (this.priceHistory.length > 100) {
      this.priceHistory = this.priceHistory.slice(-100);
    }
  }

  // Calculate percentage change over time window
  private calculatePriceChange(timeWindowMs: number): { change: number, duration: number } | null {
    if (this.priceHistory.length < 2) {
      return null;
    }

    const now = Date.now();
    const cutoffTime = now - timeWindowMs;
    const currentPrice = this.priceHistory[this.priceHistory.length - 1];
    
    // Find the earliest price within the time window
    let earliestPrice: PricePoint | null = null;
    for (const point of this.priceHistory) {
      if (point.timestamp >= cutoffTime) {
        if (!earliestPrice || point.timestamp < earliestPrice.timestamp) {
          earliestPrice = point;
        }
      }
    }

    if (!earliestPrice || earliestPrice.timestamp === currentPrice.timestamp) {
      return null;
    }

    const change = ((currentPrice.price - earliestPrice.price) / earliestPrice.price) * 100;
    const duration = currentPrice.timestamp - earliestPrice.timestamp;

    return { change, duration };
  }

  // Check for stop loss or take profit
  private checkExitConditions(currentPrice: number): MeanReversionSignal | null {
    if (this.currentPosition !== 'long' || this.entryPrice === 0) {
      return null;
    }

    const priceChange = ((currentPrice - this.entryPrice) / this.entryPrice) * 100;
    const timeInPosition = Date.now() - this.entryTime;

    // Stop loss check
    if (priceChange <= -this.config.stopLossPercent) {
      return {
        type: 'sell',
        reason: `Stop loss triggered: ${priceChange.toFixed(2)}% loss`,
        confidence: 90,
        priceChange,
        timeWindow: timeInPosition,
        currentPrice,
        entryPrice: this.entryPrice
      };
    }

    // Take profit check
    if (priceChange >= this.config.takeProfitPercent) {
      return {
        type: 'sell',
        reason: `Take profit triggered: ${priceChange.toFixed(2)}% gain`,
        confidence: 85,
        priceChange,
        timeWindow: timeInPosition,
        currentPrice,
        entryPrice: this.entryPrice
      };
    }

    // Max position time check
    if (timeInPosition > this.config.maxPositionTimeMs) {
      return {
        type: 'sell',
        reason: `Max position time exceeded: ${(timeInPosition / 60000).toFixed(1)} minutes`,
        confidence: 75,
        priceChange,
        timeWindow: timeInPosition,
        currentPrice,
        entryPrice: this.entryPrice
      };
    }

    return null;
  }

  // Analyze current conditions and generate trading signal
  analyzeSignal(priceData: PriceData): MeanReversionSignal {
    // Update price history
    this.updatePriceHistory(priceData);
    
    const currentPrice = priceData.tokenAPrice;
    
    // Check exit conditions first if we have a position
    const exitSignal = this.checkExitConditions(currentPrice);
    if (exitSignal) {
      return exitSignal;
    }

    // If we already have a position, don't look for new entries
    if (this.currentPosition === 'long') {
      const priceChange = ((currentPrice - this.entryPrice) / this.entryPrice) * 100;
      return {
        type: 'none',
        reason: `Holding position: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}% from entry $${this.entryPrice.toFixed(2)}`,
        confidence: 50,
        priceChange,
        timeWindow: Date.now() - this.entryTime,
        currentPrice,
        entryPrice: this.entryPrice
      };
    }

    // Look for buy signals (drops)
    const shortTermChange = this.calculatePriceChange(this.config.monitorWindowMs);
    
    if (!shortTermChange) {
      return {
        type: 'none',
        reason: 'Insufficient price history for analysis',
        confidence: 0,
        priceChange: 0,
        timeWindow: 0,
        currentPrice
      };
    }

    // Buy signal: price dropped by threshold amount
    if (shortTermChange.change <= -this.config.dropThreshold) {
      const confidence = Math.min(
        95,
        50 + Math.abs(shortTermChange.change) * 10 // Higher confidence for bigger drops
      );

      return {
        type: 'buy',
        reason: `Price drop detected: ${shortTermChange.change.toFixed(2)}% in ${(shortTermChange.duration / 1000).toFixed(0)}s`,
        confidence,
        priceChange: shortTermChange.change,
        timeWindow: shortTermChange.duration,
        currentPrice
      };
    }

    // No signal
    return {
      type: 'none',
      reason: `Price change: ${shortTermChange.change >= 0 ? '+' : ''}${shortTermChange.change.toFixed(2)}% in ${(shortTermChange.duration / 1000).toFixed(0)}s (threshold: ±${this.config.dropThreshold}%)`,
      confidence: 30,
      priceChange: shortTermChange.change,
      timeWindow: shortTermChange.duration,
      currentPrice
    };
  }

  // Execute buy signal
  executeBuy(currentPrice: number): void {
    this.currentPosition = 'long';
    this.entryPrice = currentPrice;
    this.entryTime = Date.now();
    console.log(`🟢 ENTERED LONG: $${currentPrice.toFixed(2)} at ${new Date().toLocaleTimeString()}`);
  }

  // Execute sell signal
  executeSell(currentPrice: number, reason: string): { profit: number, holdTime: number } {
    if (this.currentPosition !== 'long') {
      return { profit: 0, holdTime: 0 };
    }

    const profit = ((currentPrice - this.entryPrice) / this.entryPrice) * 100;
    const holdTime = Date.now() - this.entryTime;
    
    console.log(`🔴 EXITED LONG: $${currentPrice.toFixed(2)} | ${profit >= 0 ? '+' : ''}${profit.toFixed(2)}% | ${(holdTime / 1000).toFixed(0)}s | ${reason}`);
    
    this.currentPosition = 'none';
    this.entryPrice = 0;
    this.entryTime = 0;

    return { profit, holdTime };
  }

  // Get current strategy status
  getStatus(): {
    position: string;
    entryPrice: number;
    entryTime: number;
    priceHistoryCount: number;
    config: MeanReversionConfig;
  } {
    return {
      position: this.currentPosition,
      entryPrice: this.entryPrice,
      entryTime: this.entryTime,
      priceHistoryCount: this.priceHistory.length,
      config: { ...this.config }
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<MeanReversionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 Mean reversion config updated:', this.config);
  }
}