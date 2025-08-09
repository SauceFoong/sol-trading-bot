import { PublicKey } from "@solana/web3.js";

export interface RiskParameters {
  maxPositionSize: number; // Maximum position size as percentage of total balance
  maxDailyLoss: number; // Maximum daily loss in USD
  maxSlippage: number; // Maximum allowed slippage in basis points
  cooldownPeriod: number; // Minimum time between trades in seconds
  emergencyStopLoss: number; // Emergency stop loss percentage
  maxDrawdown: number; // Maximum portfolio drawdown
  maxTradesPerDay: number; // Maximum number of trades per day
  minLiquidity: number; // Minimum liquidity required for trades
}

export interface TradeRisk {
  riskScore: number; // 0-100, 100 being highest risk
  reasoning: string[]; // Array of risk factors
  approved: boolean; // Whether the trade is approved
}

export class RiskManager {
  private riskParams: RiskParameters;
  private tradeHistory: TradeRecord[];
  private dailyStats: DailyStats;

  constructor(riskParams: RiskParameters) {
    this.riskParams = riskParams;
    this.tradeHistory = [];
    this.dailyStats = this.initializeDailyStats();
  }

  private initializeDailyStats(): DailyStats {
    return {
      date: new Date().toDateString(),
      totalTrades: 0,
      totalPnL: 0,
      maxLoss: 0,
      currentDrawdown: 0,
    };
  }

  assessTradeRisk(
    tradeAmount: number,
    currentPrice: number,
    targetPrice: number,
    portfolioBalance: number,
    slippage: number
  ): TradeRisk {
    const reasoning: string[] = [];
    let riskScore = 0;

    // Check position size risk
    const positionPercent = (tradeAmount / portfolioBalance) * 100;
    if (positionPercent > this.riskParams.maxPositionSize) {
      reasoning.push(
        `Position size (${positionPercent.toFixed(2)}%) exceeds maximum (${
          this.riskParams.maxPositionSize
        }%)`
      );
      riskScore += 30;
    }

    // Check slippage risk
    if (slippage > this.riskParams.maxSlippage) {
      reasoning.push(
        `Slippage (${slippage}bps) exceeds maximum (${this.riskParams.maxSlippage}bps)`
      );
      riskScore += 25;
    }

    // Check daily trade limit
    if (this.dailyStats.totalTrades >= this.riskParams.maxTradesPerDay) {
      reasoning.push(
        `Daily trade limit (${this.riskParams.maxTradesPerDay}) reached`
      );
      riskScore += 40;
    }

    // Check daily loss limit
    if (Math.abs(this.dailyStats.totalPnL) >= this.riskParams.maxDailyLoss) {
      reasoning.push(
        `Daily loss limit ($${this.riskParams.maxDailyLoss}) exceeded`
      );
      riskScore += 50;
    }

    // Check cooldown period
    const lastTrade = this.tradeHistory[this.tradeHistory.length - 1];
    if (lastTrade) {
      const timeSinceLastTrade = (Date.now() - lastTrade.timestamp) / 1000;
      if (timeSinceLastTrade < this.riskParams.cooldownPeriod) {
        reasoning.push(
          `Cooldown period not met (${timeSinceLastTrade.toFixed(0)}s < ${
            this.riskParams.cooldownPeriod
          }s)`
        );
        riskScore += 20;
      }
    }

    // Check portfolio drawdown
    if (this.dailyStats.currentDrawdown >= this.riskParams.maxDrawdown) {
      reasoning.push(
        `Portfolio drawdown (${this.dailyStats.currentDrawdown.toFixed(
          2
        )}%) exceeds maximum (${this.riskParams.maxDrawdown}%)`
      );
      riskScore += 45;
    }

    // Price volatility check
    const priceChange = Math.abs(targetPrice - currentPrice) / currentPrice;
    if (priceChange > 0.05) {
      // 5% price change
      reasoning.push(
        `High price volatility detected (${(priceChange * 100).toFixed(2)}%)`
      );
      riskScore += 15;
    }

    return {
      riskScore: Math.min(riskScore, 100),
      reasoning,
      approved: riskScore < 70, // Approve trades with risk score below 70
    };
  }

  recordTrade(trade: TradeRecord): void {
    this.tradeHistory.push(trade);
    this.updateDailyStats(trade);

    // Keep only last 1000 trades to manage memory
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory = this.tradeHistory.slice(-1000);
    }
  }

  private updateDailyStats(trade: TradeRecord): void {
    const tradeDate = new Date(trade.timestamp).toDateString();

    // Reset daily stats if new day
    if (this.dailyStats.date !== tradeDate) {
      this.dailyStats = this.initializeDailyStats();
      this.dailyStats.date = tradeDate;
    }

    this.dailyStats.totalTrades++;
    this.dailyStats.totalPnL += trade.pnl;

    if (trade.pnl < 0) {
      this.dailyStats.maxLoss = Math.min(this.dailyStats.maxLoss, trade.pnl);
    }

    // Update drawdown
    this.updateDrawdown();
  }

  private updateDrawdown(): void {
    if (this.tradeHistory.length < 2) return;

    let peak = this.tradeHistory[0].portfolioValue;
    let maxDrawdown = 0;

    for (const trade of this.tradeHistory) {
      if (trade.portfolioValue > peak) {
        peak = trade.portfolioValue;
      }

      const drawdown = ((peak - trade.portfolioValue) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    this.dailyStats.currentDrawdown = maxDrawdown;
  }

  shouldEmergencyStop(): boolean {
    const reasons: string[] = [];

    // Check emergency stop loss
    if (this.dailyStats.currentDrawdown >= this.riskParams.emergencyStopLoss) {
      reasons.push(
        `Emergency stop loss triggered (${this.dailyStats.currentDrawdown.toFixed(
          2
        )}%)`
      );
    }

    // Check daily loss limit
    if (Math.abs(this.dailyStats.totalPnL) >= this.riskParams.maxDailyLoss) {
      reasons.push(`Daily loss limit exceeded`);
    }

    if (reasons.length > 0) {
      console.error("EMERGENCY STOP TRIGGERED:", reasons);
      return true;
    }

    return false;
  }

  getRiskReport(): RiskReport {
    return {
      dailyStats: this.dailyStats,
      riskParameters: this.riskParams,
      recentTrades: this.tradeHistory.slice(-10),
      portfolioHealth: this.assessPortfolioHealth(),
    };
  }

  private assessPortfolioHealth(): PortfolioHealth {
    const winRate = this.calculateWinRate();
    const avgReturn = this.calculateAverageReturn();
    const sharpeRatio = this.calculateSharpeRatio();

    let status: "healthy" | "warning" | "critical" = "healthy";
    const issues: string[] = [];

    if (this.dailyStats.currentDrawdown > this.riskParams.maxDrawdown * 0.8) {
      status = "warning";
      issues.push("High drawdown detected");
    }

    if (winRate < 0.4) {
      status = "warning";
      issues.push("Low win rate");
    }

    if (this.dailyStats.currentDrawdown >= this.riskParams.emergencyStopLoss) {
      status = "critical";
      issues.push("Emergency stop loss threshold reached");
    }

    return {
      status,
      winRate,
      avgReturn,
      sharpeRatio,
      issues,
    };
  }

  private calculateWinRate(): number {
    if (this.tradeHistory.length === 0) return 0;

    const winningTrades = this.tradeHistory.filter(
      (trade) => trade.pnl > 0
    ).length;
    return winningTrades / this.tradeHistory.length;
  }

  private calculateAverageReturn(): number {
    if (this.tradeHistory.length === 0) return 0;

    const totalReturn = this.tradeHistory.reduce(
      (sum, trade) => sum + trade.pnl,
      0
    );
    return totalReturn / this.tradeHistory.length;
  }

  private calculateSharpeRatio(): number {
    if (this.tradeHistory.length < 2) return 0;

    const returns = this.tradeHistory.map((trade) => trade.pnl);
    const avgReturn =
      returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  updateRiskParameters(newParams: Partial<RiskParameters>): void {
    this.riskParams = { ...this.riskParams, ...newParams };
    console.log("Risk parameters updated:", newParams);
  }
}

export interface TradeRecord {
  timestamp: number;
  tradeType: "buy" | "sell";
  amount: number;
  price: number;
  slippage: number;
  pnl: number;
  portfolioValue: number;
  gasUsed: number;
}

export interface DailyStats {
  date: string;
  totalTrades: number;
  totalPnL: number;
  maxLoss: number;
  currentDrawdown: number;
}

export interface RiskReport {
  dailyStats: DailyStats;
  riskParameters: RiskParameters;
  recentTrades: TradeRecord[];
  portfolioHealth: PortfolioHealth;
}

export interface PortfolioHealth {
  status: "healthy" | "warning" | "critical";
  winRate: number;
  avgReturn: number;
  sharpeRatio: number;
  issues: string[];
}

// Circuit breaker implementation
export class CircuitBreaker {
  private isOpen: boolean = false;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly timeoutDuration: number; // in milliseconds

  constructor(failureThreshold: number = 5, timeoutDuration: number = 60000) {
    this.failureThreshold = failureThreshold;
    this.timeoutDuration = timeoutDuration;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      if (Date.now() - this.lastFailureTime > this.timeoutDuration) {
        // Half-open state - try one request
        this.isOpen = false;
        this.failureCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN - operations suspended");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.isOpen = true;
      console.error(
        `Circuit breaker OPENED after ${this.failureCount} failures`
      );
    }
  }

  getStatus(): {
    isOpen: boolean;
    failureCount: number;
    lastFailureTime: number;
  } {
    return {
      isOpen: this.isOpen,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.isOpen = false;
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
