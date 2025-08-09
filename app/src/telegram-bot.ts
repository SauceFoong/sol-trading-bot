import { Telegraf, Context } from "telegraf";
import {
  SimpleTradingBotClient,
  StrategyConfig,
  BotConfig,
} from "./simple-trading-bot-client";
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";

dotenv.config();

interface TelegramBotConfig {
  token: string;
  allowedUsers?: string[];
  tradingBotConfig: BotConfig;
}

export class TelegramTradingBot {
  private bot: Telegraf;
  private tradingBot: SimpleTradingBotClient;
  private allowedUsers: Set<string>;
  private isAuthorized: boolean = false;

  constructor(config: TelegramBotConfig) {
    this.bot = new Telegraf(config.token);
    this.tradingBot = new SimpleTradingBotClient(config.tradingBotConfig);
    this.allowedUsers = new Set(config.allowedUsers || []);

    this.setupCommands();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // Authorization middleware
    this.bot.use((ctx, next) => {
      const userId = ctx.from?.id.toString();
      if (
        this.allowedUsers.size === 0 ||
        (userId && this.allowedUsers.has(userId))
      ) {
        return next();
      }
      ctx.reply("❌ Unauthorized access. You are not allowed to use this bot.");
    });
  }

  private setupCommands() {
    // Start command
    this.bot.start((ctx) => {
      ctx.reply(
        "🤖 Welcome to Solana Trading Bot!\n\n" +
          "📋 Available commands:\n" +
          "/status - Get bot status\n" +
          "/balance - Check bot balance\n" +
          "/initialize - Initialize trading bot\n" +
          "/start_trading - Start automated trading\n" +
          "/stop_trading - Stop automated trading\n" +
          "/pause - Pause bot\n" +
          "/resume - Resume bot\n" +
          "/strategy - Update trading strategy\n" +
          "/withdraw - Withdraw funds\n" +
          "/trades - Show recent trades\n" +
          "/help - Show this help message"
      );
    });

    // Help command
    this.bot.help((ctx) => {
      ctx.reply(
        "🆘 Trading Bot Commands Help:\n\n" +
          "📊 /status - Shows current bot status, balance, and trade statistics\n" +
          "💰 /balance - Displays current bot balance\n" +
          "▶️ /start_trading - Starts automated trading based on current strategy\n" +
          "⏹️ /stop_trading - Stops automated trading\n" +
          "⏸️ /pause - Pauses the bot (can be resumed later)\n" +
          "▶️ /resume - Resumes a paused bot\n" +
          "⚙️ /strategy - Shows current strategy or updates it\n" +
          "💸 /withdraw <amount> - Withdraws specified amount from bot\n" +
          "📈 /trades - Shows recent trading activity\n\n" +
          "⚠️ Important: Always test strategies with small amounts first!"
      );
    });

    // Status command
    this.bot.command("status", async (ctx) => {
      try {
        // First check connection health
        const isHealthy = await this.tradingBot.healthCheck();
        const walletBalance = await this.tradingBot.getWalletBalance();
        
        if (!isHealthy) {
          ctx.reply(
            `🤖 Bot Status:\n` +
            `🔴 Connection: Failed\n` +
            `💰 Wallet Balance: ${walletBalance.toFixed(4)} SOL\n` +
            `⚠️ Bot is not connected to blockchain. Check your RPC connection.`
          );
          return;
        }

        try {
          const botInfo = await this.tradingBot.getBotInfo();
          const statusMessage =
            `🤖 Bot Status:\n` +
            `🟢 Active: ${botInfo.isActive ? "Yes" : "No"}\n` +
            `💰 Bot Balance: ${(parseInt(botInfo.balance) / 1000000).toFixed(2)} USDC\n` +
            `💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL\n` +
            `📊 Total Trades: ${botInfo.totalTrades}\n` +
            `✅ Successful Trades: ${botInfo.successfulTrades}\n` +
            `🕐 Last Trade: ${new Date(parseInt(botInfo.lastTradeTimestamp) * 1000).toLocaleString()}\n` +
            `📅 Created: ${new Date(parseInt(botInfo.createdAt) * 1000).toLocaleString()}`;

          ctx.reply(statusMessage);
        } catch (botError) {
          // Bot not initialized yet
          ctx.reply(
            `🤖 Bot Status:\n` +
            `🟡 Connection: Healthy\n` +
            `💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL\n` +
            `📋 Bot Status: Not initialized\n` +
            `⚠️ Use /initialize to set up your trading bot first.`
          );
        }
      } catch (error) {
        ctx.reply("❌ Failed to get bot status. Please try again.");
        console.error("Status command error:", error);
      }
    });

    // Balance command
    this.bot.command("balance", async (ctx) => {
      try {
        const walletBalance = await this.tradingBot.getWalletBalance();
        
        try {
          const botInfo = await this.tradingBot.getBotInfo();
          const balance = (parseInt(botInfo.balance) / 1000000).toFixed(2);
          ctx.reply(
            `💰 Balances:\n` +
            `🤖 Bot Balance: ${balance} USDC\n` +
            `💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL`
          );
        } catch (botError) {
          ctx.reply(
            `💰 Balances:\n` +
            `🤖 Bot Balance: Not initialized\n` +
            `💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL\n` +
            `⚠️ Use /initialize to set up your trading bot.`
          );
        }
      } catch (error) {
        ctx.reply("❌ Failed to get balance. Please try again.");
        console.error("Balance command error:", error);
      }
    });

    // Initialize command
    this.bot.command("initialize", async (ctx) => {
      try {
        const walletBalance = await this.tradingBot.getWalletBalance();
        
        if (walletBalance < 0.01) {
          ctx.reply(
            `⚠️ Insufficient SOL balance!\n` +
            `💳 Current: ${walletBalance.toFixed(4)} SOL\n` +
            `📋 Required: ~0.01 SOL for transactions\n` +
            `Please add SOL to your wallet first.`
          );
          return;
        }

        ctx.reply(
          `🚀 Initializing Trading Bot...\n` +
          `💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL\n` +
          `⚙️ Setting up default Grid Trading strategy\n` +
          `💰 Initial Balance: 1 USDC\n\n` +
          `⏳ This may take a few seconds...`
        );

        // Initialize with default strategy
        const strategy = {
          strategyType: "GridTrading" as const,
          tokenA: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
          tokenB: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
          buyThreshold: 100000000, // $100
          sellThreshold: 110000000, // $110  
          maxSlippage: 100, // 1%
          tradeAmount: 1000000, // 1 USDC
        };

        const tx = await this.tradingBot.initializeBot(strategy, 1000000); // 1 USDC initial
        
        ctx.reply(
          `✅ Trading Bot Initialized!\n` +
          `📝 Transaction: ${tx.substring(0, 8)}...${tx.substring(tx.length - 8)}\n` +
          `⚙️ Strategy: Grid Trading\n` +
          `💰 Initial Balance: 1 USDC\n\n` +
          `🎉 Your bot is ready! Use /status to check details.`
        );

      } catch (error) {
        ctx.reply(
          `❌ Failed to initialize bot.\n` +
          `🔍 This might happen if the bot is already initialized.\n` +
          `📋 Use /status to check current state.`
        );
        console.error("Initialize command error:", error);
      }
    });

    // Start trading command
    this.bot.command("start_trading", async (ctx) => {
      try {
        await this.tradingBot.resumeBot();
        ctx.reply(
          "▶️ Trading started! The bot will now execute trades based on your strategy."
        );

        // Start the trading loop in background
        this.tradingBot.startBot().catch(console.error);
      } catch (error) {
        ctx.reply("❌ Failed to start trading. Please try again.");
        console.error("Start trading error:", error);
      }
    });

    // Stop trading command
    this.bot.command("stop_trading", async (ctx) => {
      try {
        await this.tradingBot.stopBot();
        ctx.reply("⏹️ Trading stopped successfully.");
      } catch (error) {
        ctx.reply("❌ Failed to stop trading. Please try again.");
        console.error("Stop trading error:", error);
      }
    });

    // Pause command
    this.bot.command("pause", async (ctx) => {
      try {
        await this.tradingBot.pauseBot();
        ctx.reply("⏸️ Bot paused successfully. Use /resume to continue.");
      } catch (error) {
        ctx.reply("❌ Failed to pause bot. Please try again.");
        console.error("Pause command error:", error);
      }
    });

    // Resume command
    this.bot.command("resume", async (ctx) => {
      try {
        await this.tradingBot.resumeBot();
        ctx.reply("▶️ Bot resumed successfully.");
      } catch (error) {
        ctx.reply("❌ Failed to resume bot. Please try again.");
        console.error("Resume command error:", error);
      }
    });

    // Strategy command
    this.bot.command("strategy", (ctx) => {
      const strategyOptions =
        "⚙️ Trading Strategies:\n\n" +
        "1️⃣ Grid Trading - Places buy/sell orders at regular intervals\n" +
        "2️⃣ DCA - Dollar Cost Averaging at regular intervals\n" +
        "3️⃣ Arbitrage - Exploits price differences between exchanges\n" +
        "4️⃣ Mean Reversion - Trades based on statistical analysis\n\n" +
        "Use /set_strategy <type> to change strategy\n" +
        "Example: /set_strategy grid";

      ctx.reply(strategyOptions);
    });

    // Set strategy command
    this.bot.command("set_strategy", (ctx) => {
      const args = ctx.message.text.split(" ");
      if (args.length < 2) {
        ctx.reply(
          "❌ Please specify a strategy type: grid, dca, arbitrage, or meanreversion"
        );
        return;
      }

      const strategyType = args[1].toLowerCase();
      const validStrategies = ["grid", "dca", "arbitrage", "meanreversion"];

      if (!validStrategies.includes(strategyType)) {
        ctx.reply(
          "❌ Invalid strategy. Use: grid, dca, arbitrage, or meanreversion"
        );
        return;
      }

      // This would typically show a form or ask for parameters
      ctx.reply(
        `⚙️ Setting up ${strategyType} strategy...\n\n` +
          "Please provide the following parameters:\n" +
          "• Token A address (e.g., USDC)\n" +
          "• Token B address (e.g., SOL)\n" +
          "• Buy threshold\n" +
          "• Sell threshold\n" +
          "• Max slippage\n" +
          "• Trade amount\n\n" +
          "Format: /update_params <tokenA> <tokenB> <buyThreshold> <sellThreshold> <maxSlippage> <tradeAmount>"
      );
    });

    // Update parameters command
    this.bot.command("update_params", async (ctx) => {
      try {
        const args = ctx.message.text.split(" ");
        if (args.length < 7) {
          ctx.reply(
            "❌ Please provide all parameters: tokenA, tokenB, buyThreshold, sellThreshold, maxSlippage, tradeAmount"
          );
          return;
        }

        const [
          ,
          tokenA,
          tokenB,
          buyThreshold,
          sellThreshold,
          maxSlippage,
          tradeAmount,
        ] = args;

        const strategyConfig: StrategyConfig = {
          strategyType: "GridTrading",
          tokenA: new PublicKey(tokenA),
          tokenB: new PublicKey(tokenB),
          buyThreshold: parseFloat(buyThreshold),
          sellThreshold: parseFloat(sellThreshold),
          maxSlippage: parseFloat(maxSlippage),
          tradeAmount: parseFloat(tradeAmount),
        };

        await this.tradingBot.updateStrategy(strategyConfig);
        ctx.reply("✅ Strategy updated successfully!");
      } catch (error) {
        ctx.reply(
          "❌ Failed to update strategy. Please check your parameters."
        );
        console.error("Update params error:", error);
      }
    });

    // Withdraw command
    this.bot.command("withdraw", async (ctx) => {
      try {
        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
          ctx.reply("❌ Please specify withdrawal amount: /withdraw <amount>");
          return;
        }

        const amount = parseFloat(args[1]);
        if (isNaN(amount) || amount <= 0) {
          ctx.reply("❌ Please provide a valid amount greater than 0");
          return;
        }

        const amountLamports = Math.floor(amount * 1000000); // Convert to lamports (6 decimals for USDC)
        const tx = await this.tradingBot.withdrawFunds(amountLamports);

        ctx.reply(
          `💸 Withdrawal successful!\n` +
            `Amount: ${amount} USDC\n` +
            `Transaction: ${tx.substring(0, 8)}...${tx.substring(
              tx.length - 8
            )}`
        );
      } catch (error) {
        ctx.reply("❌ Failed to withdraw funds. Please try again.");
        console.error("Withdraw command error:", error);
      }
    });

    // Trades command (placeholder)
    this.bot.command("trades", (ctx) => {
      ctx.reply(
        "📈 Recent Trades:\n\n" +
          "🔄 Trade history feature coming soon...\n" +
          "Use /status to see trade statistics for now."
      );
    });

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error("Telegram bot error:", err);
      ctx.reply("❌ An unexpected error occurred. Please try again.");
    });
  }

  public async launch(): Promise<void> {
    console.log("🚀 Starting Telegram Trading Bot...");
    await this.bot.launch();

    // Graceful shutdown
    process.once("SIGINT", () => this.bot.stop("SIGINT"));
    process.once("SIGTERM", () => this.bot.stop("SIGTERM"));

    console.log("✅ Telegram bot is running!");
  }

  public async stop(): Promise<void> {
    await this.bot.stop();
    await this.tradingBot.stopBot();
  }
}
