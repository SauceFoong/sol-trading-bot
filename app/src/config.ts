import { PublicKey } from "@solana/web3.js";
import { RiskParameters } from "./risk-management";

export interface BotConfiguration {
  // Network settings
  network: "mainnet-beta" | "devnet" | "testnet" | "localnet";
  rpcUrl: string;
  commitment: "processed" | "confirmed" | "finalized";

  // Bot settings
  botName: string;
  strategy: StrategyConfig;
  riskParameters: RiskParameters;

  // Execution settings
  executionInterval: number; // How often to check conditions (ms)
  priceUpdateInterval: number; // How often to update prices (ms)

  // Token settings
  tokens: {
    base: TokenConfig;
    quote: TokenConfig;
  };

  // Jupiter/DEX settings
  jupiterApiUrl: string;
  slippageBps: number;

  // Monitoring and alerts
  monitoring: MonitoringConfig;

  // Emergency settings
  emergencyContacts: string[]; // Email addresses or webhook URLs
  emergencyStopConditions: EmergencyStopConfig;
}

export interface StrategyConfig {
  type: "grid" | "dca" | "arbitrage" | "meanReversion";
  parameters: {
    [key: string]: any;
  };
}

export interface TokenConfig {
  mint: PublicKey;
  symbol: string;
  decimals: number;
  name: string;
  priceFeeds: {
    pyth?: PublicKey;
    chainlink?: PublicKey;
    coingeckoId?: string;
  };
}

export interface MonitoringConfig {
  enableLogging: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  enableMetrics: boolean;
  metricsPort: number;
  enableAlerts: boolean;
  alertWebhook?: string;
  discordWebhook?: string;
  telegramBot?: {
    token: string;
    chatId: string;
  };
}

export interface EmergencyStopConfig {
  maxDrawdownPercent: number;
  maxDailyLossUsd: number;
  consecutiveFailures: number;
  networkLatencyMs: number;
  minLiquidityUsd: number;
}

// Default configurations for different environments
export const defaultConfigs: Record<string, Partial<BotConfiguration>> = {
  development: {
    network: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
    commitment: "confirmed",
    executionInterval: 10000, // 10 seconds
    priceUpdateInterval: 5000, // 5 seconds
    jupiterApiUrl: "https://quote-api.jup.ag/v6",
    slippageBps: 50, // 0.5%
    riskParameters: {
      maxPositionSize: 10, // 10%
      maxDailyLoss: 100, // $100
      maxSlippage: 100, // 1%
      cooldownPeriod: 60, // 1 minute
      emergencyStopLoss: 20, // 20%
      maxDrawdown: 15, // 15%
      maxTradesPerDay: 50,
      minLiquidity: 1000, // $1000
    },
    monitoring: {
      enableLogging: true,
      logLevel: "debug",
      enableMetrics: true,
      metricsPort: 3001,
      enableAlerts: true,
    },
    emergencyStopConditions: {
      maxDrawdownPercent: 20,
      maxDailyLossUsd: 100,
      consecutiveFailures: 5,
      networkLatencyMs: 5000,
      minLiquidityUsd: 1000,
    },
  },

  production: {
    network: "mainnet-beta",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    commitment: "confirmed",
    executionInterval: 30000, // 30 seconds
    priceUpdateInterval: 15000, // 15 seconds
    jupiterApiUrl: "https://quote-api.jup.ag/v6",
    slippageBps: 30, // 0.3%
    riskParameters: {
      maxPositionSize: 5, // 5%
      maxDailyLoss: 1000, // $1000
      maxSlippage: 50, // 0.5%
      cooldownPeriod: 300, // 5 minutes
      emergencyStopLoss: 10, // 10%
      maxDrawdown: 8, // 8%
      maxTradesPerDay: 20,
      minLiquidity: 10000, // $10000
    },
    monitoring: {
      enableLogging: true,
      logLevel: "info",
      enableMetrics: true,
      metricsPort: 3001,
      enableAlerts: true,
    },
    emergencyStopConditions: {
      maxDrawdownPercent: 10,
      maxDailyLossUsd: 1000,
      consecutiveFailures: 3,
      networkLatencyMs: 2000,
      minLiquidityUsd: 10000,
    },
  },
};

// Popular token configurations
export const tokenConfigs: Record<string, TokenConfig> = {
  SOL: {
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    symbol: "SOL",
    decimals: 9,
    name: "Solana",
    priceFeeds: {
      coingeckoId: "solana",
    },
  },

  USDC: {
    mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    symbol: "USDC",
    decimals: 6,
    name: "USD Coin",
    priceFeeds: {
      coingeckoId: "usd-coin",
    },
  },

  USDT: {
    mint: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    symbol: "USDT",
    decimals: 6,
    name: "Tether",
    priceFeeds: {
      coingeckoId: "tether",
    },
  },

  RAY: {
    mint: new PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"),
    symbol: "RAY",
    decimals: 6,
    name: "Raydium",
    priceFeeds: {
      coingeckoId: "raydium",
    },
  },
};

// Strategy configurations
export const strategyConfigs = {
  gridTrading: {
    type: "grid" as const,
    parameters: {
      gridLevels: 10,
      priceRange: 0.2, // 20% range
      gridSpacing: 0.02, // 2% between levels
      rebalanceThreshold: 0.05, // 5% deviation
    },
  },

  dca: {
    type: "dca" as const,
    parameters: {
      interval: 3600000, // 1 hour in ms
      amount: 10, // $10 per buy
      priceDropThreshold: 0.05, // Only buy on 5%+ drops
      maxBuys: 10, // Maximum 10 buys per cycle
    },
  },

  arbitrage: {
    type: "arbitrage" as const,
    parameters: {
      minProfitBps: 10, // Minimum 0.1% profit
      exchanges: ["raydium", "orca", "serum"],
      maxExecutionTime: 30000, // 30 seconds
    },
  },

  meanReversion: {
    type: "meanReversion" as const,
    parameters: {
      lookbackPeriod: 24, // 24 hours
      stdDevThreshold: 2, // 2 standard deviations
      meanCalculationMethod: "sma", // Simple Moving Average
      reentryThreshold: 0.5, // 50% of original threshold
    },
  },
};

export class ConfigurationManager {
  private config: BotConfiguration;

  constructor(environment: string = "development") {
    const baseConfig =
      defaultConfigs[environment] || defaultConfigs.development;
    this.config = this.mergeConfigs(baseConfig);
  }

  private mergeConfigs(
    baseConfig: Partial<BotConfiguration>
  ): BotConfiguration {
    return {
      network: "devnet",
      rpcUrl: "https://api.devnet.solana.com",
      commitment: "confirmed",
      botName: "Solana Trading Bot",
      strategy: strategyConfigs.gridTrading,
      riskParameters: {
        maxPositionSize: 5,
        maxDailyLoss: 100,
        maxSlippage: 100,
        cooldownPeriod: 60,
        emergencyStopLoss: 20,
        maxDrawdown: 15,
        maxTradesPerDay: 50,
        minLiquidity: 1000,
      },
      executionInterval: 30000,
      priceUpdateInterval: 15000,
      tokens: {
        base: tokenConfigs.SOL,
        quote: tokenConfigs.USDC,
      },
      jupiterApiUrl: "https://quote-api.jup.ag/v6",
      slippageBps: 50,
      monitoring: {
        enableLogging: true,
        logLevel: "info",
        enableMetrics: false,
        metricsPort: 3001,
        enableAlerts: false,
      },
      emergencyContacts: [],
      emergencyStopConditions: {
        maxDrawdownPercent: 20,
        maxDailyLossUsd: 100,
        consecutiveFailures: 5,
        networkLatencyMs: 5000,
        minLiquidityUsd: 1000,
      },
      ...baseConfig,
    };
  }

  getConfig(): BotConfiguration {
    return { ...this.config };
  }

  updateConfig(updates: Partial<BotConfiguration>): void {
    this.config = { ...this.config, ...updates };
  }

  loadFromFile(filePath: string): void {
    try {
      const fs = require("fs");
      const fileContent = fs.readFileSync(filePath, "utf8");
      const configFromFile = JSON.parse(fileContent);
      this.config = { ...this.config, ...configFromFile };
    } catch (error) {
      console.error("Failed to load config from file:", error);
    }
  }

  saveToFile(filePath: string): void {
    try {
      const fs = require("fs");
      fs.writeFileSync(filePath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error("Failed to save config to file:", error);
    }
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.rpcUrl) {
      errors.push("RPC URL is required");
    }

    if (
      this.config.riskParameters.maxPositionSize <= 0 ||
      this.config.riskParameters.maxPositionSize > 100
    ) {
      errors.push("Max position size must be between 0 and 100 percent");
    }

    if (this.config.slippageBps < 0 || this.config.slippageBps > 10000) {
      errors.push("Slippage must be between 0 and 10000 basis points");
    }

    if (this.config.executionInterval < 1000) {
      errors.push("Execution interval must be at least 1000ms");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
