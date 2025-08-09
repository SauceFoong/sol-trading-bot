import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  Connection,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
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

export class TradingBotClient {
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

    // Initialize program (you'll need to provide the actual program ID)
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

  async initializeBot(
    config: StrategyConfig,
    initialBalance: number
  ): Promise<string> {
    try {
      // Convert string to proper enum format
      const getStrategyType = (type: string) => {
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
      };

      const strategy = {
        strategyType: getStrategyType(config.strategyType),
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
        .initializeBot(params)
        .accounts({
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
      // Convert string to proper enum format
      const getStrategyType = (type: string) => {
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
      };

      const strategy = {
        strategyType: getStrategyType(newStrategy.strategyType),
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

      const tx = await this.program.methods
        .updateStrategy({ strategy })
        .accounts({
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
        .accounts({
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
        .accounts({
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

  async startBot(): Promise<void> {
    if (this.isRunning) {
      console.log("Bot is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting trading bot...");

    // Main bot loop
    while (this.isRunning) {
      try {
        // Check if bot should execute a trade
        const shouldTrade = await this.checkTradingConditions();

        if (shouldTrade) {
          await this.executeTrade();
        }

        // Wait before next iteration (e.g., 30 seconds)
        await this.sleep(30000);
      } catch (error) {
        console.error("Error in bot loop:", error);
        // Continue running unless critical error
        await this.sleep(5000);
      }
    }
  }

  private async checkTradingConditions(): Promise<boolean> {
    try {
      // This would integrate with price feeds (Chainlink, Pyth, etc.)
      // For now, return false as placeholder
      const canTrade = await this.program.methods
        .checkStrategy()
        .accounts({
          authority: this.authority.publicKey,
        })
        .view();

      return canTrade;
    } catch (error) {
      console.error("Failed to check trading conditions:", error);
      return false;
    }
  }

  private async executeTrade(): Promise<void> {
    try {
      // This would execute actual trades through Jupiter/Raydium
      console.log("Executing trade...");

      // Example trade execution (placeholder)
      const tradeParams = {
        amount: new anchor.BN(1000000), // 1 USDC (6 decimals)
        minAmountOut: new anchor.BN(950000), // 0.95 USDC minimum
        tradeType: { buy: {} },
      };

      const tx = await this.program.methods
        .executeTrade(tradeParams)
        .accounts({
          authority: this.authority.publicKey,
        })
        .signers([this.authority])
        .rpc();

      console.log("Trade executed with transaction:", tx);
    } catch (error) {
      console.error("Failed to execute trade:", error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async stopBot(): Promise<void> {
    this.isRunning = false;
    console.log("Stopping trading bot...");
  }

  async withdrawFunds(amount: number): Promise<string> {
    try {
      const tx = await this.program.methods
        .withdrawFunds(new anchor.BN(amount))
        .accounts({
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
}
