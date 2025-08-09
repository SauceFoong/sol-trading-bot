import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  Connection,
  SystemProgram,
} from "@solana/web3.js";
import { SolanaTradingBot } from "../../target/types/solana_trading_bot";

export interface StrategyConfig {
  strategyType: "GridTrading" | "DCA" | "Arbitrage" | "MeanReversion";
  tokenA: PublicKey;
  tokenB: PublicKey;
  buyThreshold: number;
  sellThreshold: number;
  maxSlippage: number;
  tradeAmount: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface BotConfig {
  strategy: StrategyConfig;
  initialBalance: number;
  rpcUrl: string;
  privateKey: Uint8Array;
}

export class SimpleTradingBotClient {
  private connection: Connection;
  private program: Program<SolanaTradingBot>;
  private provider: anchor.AnchorProvider;
  private authority: Keypair;
  private botAccount: PublicKey;
  private isRunning: boolean = false;

  constructor(config: BotConfig) {
    this.connection = new Connection(config.rpcUrl, "confirmed");
    this.authority = Keypair.fromSecretKey(config.privateKey);

    const wallet = new anchor.Wallet(this.authority);
    this.provider = new anchor.AnchorProvider(this.connection, wallet, {
      commitment: "confirmed",
    });

    anchor.setProvider(this.provider);

    // Initialize program with the correct program ID
    const programId = new PublicKey(
      "EroGopwwQVYXgbMZigR1UvQ9xZh7fviL4897ZUvYtt2F"
    );
    this.program = anchor.workspace
      .SolanaTradingBot as Program<SolanaTradingBot>;

    // Derive bot account address
    [this.botAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("trading-bot"), this.authority.publicKey.toBuffer()],
      programId
    );
  }

  private getStrategyType(type: string): any {
    switch (type.toLowerCase()) {
      case "gridtrading":
        return { gridTrading: {} };
      case "dca":
        return { dca: {} };
      case "arbitrage":
        return { arbitrage: {} };
      case "meanreversion":
        return { meanReversion: {} };
      default:
        return { gridTrading: {} };
    }
  }

  async initializeBot(
    config: StrategyConfig,
    initialBalance: number
  ): Promise<string> {
    try {
      const strategy = {
        strategyType: this.getStrategyType(config.strategyType),
        tokenA: config.tokenA,
        tokenB: config.tokenB,
        buyThreshold: new anchor.BN(config.buyThreshold),
        sellThreshold: new anchor.BN(config.sellThreshold),
        maxSlippage: config.maxSlippage,
        tradeAmount: new anchor.BN(config.tradeAmount),
        stopLoss: config.stopLoss ? new anchor.BN(config.stopLoss) : null,
        takeProfit: config.takeProfit ? new anchor.BN(config.takeProfit) : null,
      };

      const params = {
        strategy,
        initialBalance: new anchor.BN(initialBalance),
      };

      const tx = await this.program.methods
        .initializeBot(params as any)
        .accountsPartial({
          tradingBot: this.botAccount,
          authority: this.authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([this.authority])
        .rpc();

      console.log("Bot initialized with transaction:", tx);
      return tx;
    } catch (error) {
      console.error("Failed to initialize bot:", error);
      throw error;
    }
  }

  async updateStrategy(newStrategy: StrategyConfig): Promise<string> {
    try {
      const strategy = {
        strategyType: this.getStrategyType(newStrategy.strategyType),
        tokenA: newStrategy.tokenA,
        tokenB: newStrategy.tokenB,
        buyThreshold: new anchor.BN(newStrategy.buyThreshold),
        sellThreshold: new anchor.BN(newStrategy.sellThreshold),
        maxSlippage: newStrategy.maxSlippage,
        tradeAmount: new anchor.BN(newStrategy.tradeAmount),
        stopLoss: newStrategy.stopLoss
          ? new anchor.BN(newStrategy.stopLoss)
          : null,
        takeProfit: newStrategy.takeProfit
          ? new anchor.BN(newStrategy.takeProfit)
          : null,
      };

      const strategyParams = { strategy };

      const tx = await this.program.methods
        .updateStrategy(strategyParams as any)
        .accountsPartial({
          tradingBot: this.botAccount,
          authority: this.authority.publicKey,
        })
        .signers([this.authority])
        .rpc();

      console.log("Strategy updated with transaction:", tx);
      return tx;
    } catch (error) {
      console.error("Failed to update strategy:", error);
      throw error;
    }
  }

  async pauseBot(): Promise<string> {
    try {
      const tx = await this.program.methods
        .pauseBot()
        .accountsPartial({
          tradingBot: this.botAccount,
          authority: this.authority.publicKey,
        })
        .signers([this.authority])
        .rpc();

      this.isRunning = false;
      console.log("Bot paused with transaction:", tx);
      return tx;
    } catch (error) {
      console.error("Failed to pause bot:", error);
      throw error;
    }
  }

  async resumeBot(): Promise<string> {
    try {
      const tx = await this.program.methods
        .resumeBot()
        .accountsPartial({
          tradingBot: this.botAccount,
          authority: this.authority.publicKey,
        })
        .signers([this.authority])
        .rpc();

      this.isRunning = true;
      console.log("Bot resumed with transaction:", tx);
      return tx;
    } catch (error) {
      console.error("Failed to resume bot:", error);
      throw error;
    }
  }

  async getBotInfo(): Promise<any> {
    try {
      const botAccount = await this.program.account.tradingBot.fetch(
        this.botAccount
      );
      return {
        authority: botAccount.authority.toString(),
        isActive: botAccount.isActive,
        balance: botAccount.balance.toString(),
        totalTrades: botAccount.totalTrades.toString(),
        successfulTrades: botAccount.successfulTrades.toString(),
        lastTradeTimestamp: botAccount.lastTradeTimestamp.toString(),
        createdAt: botAccount.createdAt.toString(),
        strategy: botAccount.strategy,
      };
    } catch (error) {
      console.error("Failed to get bot info:", error);
      throw error;
    }
  }

  async checkTradingConditions(): Promise<boolean> {
    try {
      const canTrade = await this.program.methods
        .checkStrategy()
        .accountsPartial({
          tradingBot: this.botAccount,
          authority: this.authority.publicKey,
        })
        .view();

      return canTrade;
    } catch (error) {
      console.error("Failed to check trading conditions:", error);
      return false;
    }
  }

  async executeTrade(amount: number, minAmountOut: number, isBuy: boolean): Promise<string> {
    try {
      const tradeParams = {
        amount: new anchor.BN(amount),
        minAmountOut: new anchor.BN(minAmountOut),
        tradeType: isBuy ? { buy: {} } : { sell: {} },
      };

      const tx = await this.program.methods
        .executeTrade(tradeParams as any)
        .accountsPartial({
          tradingBot: this.botAccount,
          authority: this.authority.publicKey,
        })
        .signers([this.authority])
        .rpc();

      console.log("Trade executed with transaction:", tx);
      return tx;
    } catch (error) {
      console.error("Failed to execute trade:", error);
      throw error;
    }
  }

  async withdrawFunds(amount: number): Promise<string> {
    try {
      const tx = await this.program.methods
        .withdrawFunds(new anchor.BN(amount))
        .accountsPartial({
          tradingBot: this.botAccount,
          authority: this.authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([this.authority])
        .rpc();

      console.log("Funds withdrawn with transaction:", tx);
      return tx;
    } catch (error) {
      console.error("Failed to withdraw funds:", error);
      throw error;
    }
  }

  async startBot(): Promise<void> {
    if (this.isRunning) {
      console.log("Bot is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting trading bot...");

    // Simplified bot loop for demo
    while (this.isRunning) {
      try {
        const shouldTrade = await this.checkTradingConditions();
        
        if (shouldTrade) {
          // Execute a small test trade
          await this.executeTrade(100000, 95000, true); // 0.1 USDC buy trade
        }

        // Wait 60 seconds between checks
        await this.sleep(60000);
      } catch (error) {
        console.error("Error in bot loop:", error);
        await this.sleep(30000);
      }
    }
  }

  async stopBot(): Promise<void> {
    this.isRunning = false;
    console.log("Stopping trading bot...");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const balance = await this.connection.getBalance(this.authority.publicKey);
      return balance > 0; // Has some SOL for transactions
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.authority.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error("Failed to get wallet balance:", error);
      return 0;
    }
  }
}