import { Telegraf } from "telegraf";
import * as dotenv from "dotenv";

dotenv.config();

interface TelegramBotConfig {
  token: string;
  allowedUsers?: string[];
}

export class SimpleTelegramTradingBot {
  private bot: Telegraf;
  private allowedUsers: Set<string>;

  constructor(config: TelegramBotConfig) {
    this.bot = new Telegraf(config.token);
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
          "/start_trading - Start automated trading\n" +
          "/stop_trading - Stop automated trading\n" +
          "/pause - Pause bot\n" +
          "/resume - Resume bot\n" +
          "/strategy - View trading strategies\n" +
          "/help - Show this help message\n\n" +
          "⚠️ Note: Trading functionality will be connected once the smart contract is properly deployed and initialized."
      );
    });

    // Help command
    this.bot.help((ctx) => {
      ctx.reply(
        "🆘 Trading Bot Commands Help:\n\n" +
          "📊 /status - Shows current bot status and information\n" +
          "💰 /balance - Displays current bot balance\n" +
          "▶️ /start_trading - Starts automated trading\n" +
          "⏹️ /stop_trading - Stops automated trading\n" +
          "⏸️ /pause - Pauses the bot\n" +
          "▶️ /resume - Resumes a paused bot\n" +
          "⚙️ /strategy - Shows available trading strategies\n\n" +
          "🚧 Status: Bot is running in demo mode\n" +
          "⚠️ Important: Always test with small amounts first!"
      );
    });

    // Status command
    this.bot.command("status", (ctx) => {
      const statusMessage =
        "🤖 Bot Status:\n" +
        "🟡 Mode: Demo/Testing\n" +
        "💰 Balance: Not connected\n" +
        "📊 Total Trades: 0\n" +
        "✅ Successful Trades: 0\n" +
        "🔗 Connection: Ready to connect to Solana\n" +
        "📅 Started: " + new Date().toLocaleString();

      ctx.reply(statusMessage);
    });

    // Balance command  
    this.bot.command("balance", (ctx) => {
      ctx.reply("💰 Balance: Trading functionality not yet connected.\n📋 Use /status for current bot state.");
    });

    // Start trading command
    this.bot.command("start_trading", (ctx) => {
      ctx.reply("▶️ Start Trading Command Received!\n🚧 Smart contract integration pending.\n📋 Use /status to check bot state.");
    });

    // Stop trading command
    this.bot.command("stop_trading", (ctx) => {
      ctx.reply("⏹️ Stop Trading Command Received!\n🚧 Smart contract integration pending.");
    });

    // Pause command
    this.bot.command("pause", (ctx) => {
      ctx.reply("⏸️ Pause Command Received!\n🚧 Smart contract integration pending.");
    });

    // Resume command
    this.bot.command("resume", (ctx) => {
      ctx.reply("▶️ Resume Command Received!\n🚧 Smart contract integration pending.");
    });

    // Strategy command
    this.bot.command("strategy", (ctx) => {
      const strategyOptions =
        "⚙️ Available Trading Strategies:\n\n" +
        "1️⃣ Grid Trading - Places buy/sell orders at regular intervals\n" +
        "2️⃣ DCA - Dollar Cost Averaging at regular intervals\n" +
        "3️⃣ Arbitrage - Exploits price differences between exchanges\n" +
        "4️⃣ Mean Reversion - Trades based on statistical analysis\n\n" +
        "🚧 Strategy configuration will be available once smart contract is connected.";

      ctx.reply(strategyOptions);
    });

    // Test connectivity
    this.bot.command("test", (ctx) => {
      ctx.reply(
        "✅ Telegram Bot Connection Test Successful!\n\n" +
        "📡 Bot is receiving commands\n" +
        "🔐 User authorization working\n" +
        "⚡ Ready for Solana integration\n\n" +
        "Next steps:\n" +
        "1. Deploy smart contract\n" +
        "2. Initialize trading bot\n" +
        "3. Connect wallet\n" +
        "4. Start trading!"
      );
    });

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error("Telegram bot error:", err);
      ctx.reply("❌ An unexpected error occurred. Please try again.");
    });
  }

  public async launch(): Promise<void> {
    console.log("🚀 Starting Simple Telegram Trading Bot...");
    console.log("📞 Bot Token:", process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) + "...");
    console.log("👥 Allowed Users:", Array.from(this.allowedUsers));
    
    await this.bot.launch();
    
    // Graceful shutdown
    process.once("SIGINT", () => this.bot.stop("SIGINT"));
    process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    
    console.log("✅ Telegram bot is running!");
    console.log("📲 Search for your bot and send /start to test");
  }

  public async stop(): Promise<void> {
    await this.bot.stop();
  }
}

// Main execution
async function main() {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowedUsers = process.env.TELEGRAM_ALLOWED_USERS?.split(",") || [];
  
  if (!telegramToken) {
    console.error("❌ TELEGRAM_BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  const telegramBot = new SimpleTelegramTradingBot({
    token: telegramToken,
    allowedUsers,
  });

  try {
    await telegramBot.launch();
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

main().catch(console.error);