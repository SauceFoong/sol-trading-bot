export interface BotMetrics {
  botAccount: string;
  authority: string;
  isActive: boolean;
  strategy: string;
  balance: number;
  totalTrades: number;
  successfulTrades: number;
  winRate: number;
  lastTradeTimestamp: Date | null;
  createdAt: Date;
  performance: {
    totalVolume: number;
    avgTradeSize: number;
    profitLoss: number;
    dailyTrades: number;
  };
}

export interface StrategyConfig {
  strategyType: "GridTrading" | "DCA" | "Arbitrage" | "MeanReversion";
  tokenA: string;
  tokenB: string;
  buyThreshold: number;
  sellThreshold: number;
  maxSlippage: number;
  tradeAmount: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface BotConfiguration {
  botName: string;
  strategy: StrategyConfig;
  initialBalance: number;
  riskParameters: {
    maxPositionSize: number;
    maxDailyLoss: number;
    maxSlippage: number;
    cooldownPeriod: number;
    emergencyStopLoss: number;
    maxDrawdown: number;
    maxTradesPerDay: number;
    minLiquidity: number;
  };
}

export interface Alert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  timestamp: Date;
  botAccount?: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: Date;
}

export interface TradeHistory {
  id: string;
  botAccount: string;
  type: "buy" | "sell";
  amount: number;
  price: number;
  timestamp: Date;
  success: boolean;
  transactionHash: string;
}
