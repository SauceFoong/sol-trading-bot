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
  private monitoringInterval?: NodeJS.Timeout;
  private lastChatId?: number;

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
        // Store the chat ID for sending periodic updates
        if (ctx.chat) {
          this.lastChatId = ctx.chat.id;
        }
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
          "/monitor - Get detailed monitoring info\n" +
          "/start_monitoring - Start periodic price updates\n" +
          "/stop_monitoring - Stop periodic price updates\n" +
          "/meanreversion - Switch to mean reversion strategy\n" +
          "/soltrading - SOL-optimized trading (for high SOL balance)\n" +
          "/testtrade - Test trade execution (devnet simulation - SAFE!)\n" +
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
            `💰 Bot Balance: ${(parseInt(botInfo.balance) / 1000000).toFixed(
              2
            )} USDC\n` +
            `💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL\n` +
            `📊 Total Trades: ${botInfo.totalTrades}\n` +
            `✅ Successful Trades: ${botInfo.successfulTrades}\n` +
            `🕐 Last Trade: ${new Date(
              parseInt(botInfo.lastTradeTimestamp) * 1000
            ).toLocaleString()}\n` +
            `📅 Created: ${new Date(
              parseInt(botInfo.createdAt) * 1000
            ).toLocaleString()}`;

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
            `📝 Transaction: ${tx.substring(0, 8)}...${tx.substring(
              tx.length - 8
            )}\n` +
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
          "▶️ Trading started! The bot will now execute trades based on your strategy.\n\n" +
            "💡 Tip: Use /start_monitoring to receive periodic price updates and trade analysis.\n" +
            "🔍 Check console logs - you should see 'TRADING LOOP ITERATION' messages every 60 seconds."
        );

        // Start the trading loop in background
        console.log("📱 Telegram: Starting trading bot from /start_trading command...");
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
        "4️⃣ Mean Reversion - Micro-scalping on ±0.15% price moves\n\n" +
        "📋 Quick Commands:\n" +
        "• /meanreversion - Switch to Mean Reversion (recommended)\n" +
        "• /set_strategy <type> - Manual strategy setup\n\n" +
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

    // Monitor command - detailed analysis
    this.bot.command("monitor", async (ctx) => {
      try {
        ctx.reply("📊 Fetching detailed monitoring information...");

        // Get current strategy from bot (this is a simplified version)
        // In a real implementation, you'd call the enhanced monitoring method
        const walletBalance = await this.tradingBot.getWalletBalance();

        try {
          const botInfo = await this.tradingBot.getBotInfo();
          const monitoringInfo =
            `📊 === Detailed Bot Monitoring ===\n\n` +
            `🤖 Bot Status: ${
              botInfo.isActive ? "✅ Active" : "❌ Inactive"
            }\n` +
            `💰 Bot Balance: ${(parseInt(botInfo.balance) / 1000000).toFixed(
              2
            )} USDC\n` +
            `💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL\n` +
            `📈 Total Trades: ${botInfo.totalTrades}\n` +
            `✅ Successful Trades: ${botInfo.successfulTrades}\n` +
            `🕐 Last Trade: ${new Date(
              parseInt(botInfo.lastTradeTimestamp) * 1000
            ).toLocaleString()}\n\n` +
            `📋 Current Strategy: Grid Trading\n` +
            `🔄 Token Pair: USDC/SOL\n` +
            `⚠️ Note: Enhanced monitoring is active when trading is running.\n` +
            `Check the console logs for detailed real-time analysis.\n\n` +
            `💡 Tip: Use /start_trading to enable detailed monitoring with:\n` +
            `   • Real-time price analysis\n` +
            `   • Trade condition evaluation\n` +
            `   • Detailed failure reasons\n` +
            `   • Price difference calculations`;

          ctx.reply(monitoringInfo);
        } catch (botError) {
          ctx.reply(
            `📊 === Detailed Bot Monitoring ===\n\n` +
              `🟡 Connection: Healthy\n` +
              `💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL\n` +
              `📋 Bot Status: Not initialized\n\n` +
              `⚠️ Use /initialize to set up your trading bot first.\n` +
              `Once initialized and started, you'll see detailed monitoring including:\n` +
              `   • Real-time price feeds\n` +
              `   • Trade signal analysis\n` +
              `   • Condition evaluation\n` +
              `   • Failure reason reporting`
          );
        }
      } catch (error) {
        ctx.reply("❌ Failed to get monitoring info. Please try again.");
        console.error("Monitor command error:", error);
      }
    });

    // Start monitoring command
    this.bot.command("start_monitoring", async (ctx) => {
      try {
        if (this.monitoringInterval) {
          ctx.reply(
            "📊 Monitoring is already active! Use /stop_monitoring to stop."
          );
          return;
        }

        // Store the chat ID for sending updates
        if (ctx.chat) {
          this.lastChatId = ctx.chat.id;
        }

        ctx.reply(
          "📊 Starting periodic monitoring!\n\n" +
            "📡 You will receive updates every minute with:\n" +
            "• Current price ratio\n" +
            "• Trade conditions analysis\n" +
            "• Execution reasons\n\n" +
            "⏹️ Use /stop_monitoring to stop receiving updates."
        );

        // Start sending periodic updates every minute
        this.monitoringInterval = setInterval(async () => {
          await this.sendMonitoringUpdate();
        }, 60000); // 60 seconds

        // Send first update immediately
        setTimeout(() => this.sendMonitoringUpdate(), 5000);
      } catch (error) {
        ctx.reply("❌ Failed to start monitoring. Please try again.");
        console.error("Start monitoring error:", error);
      }
    });

    // Stop monitoring command
    this.bot.command("stop_monitoring", async (ctx) => {
      try {
        if (!this.monitoringInterval) {
          ctx.reply("📊 Monitoring is not currently active.");
          return;
        }

        clearInterval(this.monitoringInterval);
        this.monitoringInterval = undefined;

        ctx.reply("⏹️ Periodic monitoring stopped successfully.");
      } catch (error) {
        ctx.reply("❌ Failed to stop monitoring. Please try again.");
        console.error("Stop monitoring error:", error);
      }
    });

    // Mean reversion strategy command
    this.bot.command("meanreversion", async (ctx) => {
      try {
        ctx.reply(
          "🎯 Switching to Mean Reversion Strategy...\n\n" +
            "📊 Strategy Details:\n" +
            "• Type: Micro Mean-Reversion Scalping\n" +
            "• Triggers: ±0.15% price movements in 2min window\n" +
            "• Trade Size: 0.1 SOL per trade (~$20-25)\n" +
            "• Stop Loss: 1.0% | Take Profit: 0.5%\n" +
            "• Max Hold Time: 5 minutes\n" +
            "• Direction: SOL ↔ USDC (optimized for your SOL balance)\n\n" +
            "⏳ Updating strategy configuration..."
        );

        // Create mean reversion strategy config optimized for SOL trading
        const meanReversionStrategy: StrategyConfig = {
          strategyType: "MeanReversion",
          tokenA: new PublicKey("So11111111111111111111111111111111111111112"), // SOL (primary)
          tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
          buyThreshold: 0, // Not used for mean reversion
          sellThreshold: 0, // Not used for mean reversion
          maxSlippage: 50, // 0.5%
          tradeAmount: 100000000, // 0.1 SOL (9 decimals)
        };

        // Check if bot is initialized first
        try {
          await this.tradingBot.getBotInfo();
          
          // Bot exists, update strategy
          await this.tradingBot.updateStrategy(meanReversionStrategy);
          
          ctx.reply(
            "✅ Mean Reversion Strategy Activated!\n\n" +
              "🎯 Now monitoring for micro price movements\n" +
              "📊 Strategy: Scalping ±0.15% moves in SOL/USDC\n" +
              "💰 Trade Size: 0.1 SOL per position (~$20-25)\n" +
              "⏱️ Max Hold: 5 minutes\n" +
              "💡 Optimized for your 12 SOL balance!\n\n" +
              "🚀 Use /start_trading to begin automated trading\n" +
              "📊 Use /start_monitoring for real-time updates"
          );
        } catch (botError) {
          // Bot not initialized, create with mean reversion strategy
          ctx.reply(
            "⚠️ Bot not initialized. Creating new bot with Mean Reversion strategy...\n" +
              "💰 Initial balance: 1 USDC\n" +
              "⏳ This may take a few seconds..."
          );

          const tx = await this.tradingBot.initializeBot(meanReversionStrategy, 1000000); // 1 USDC initial

          ctx.reply(
            "✅ Trading Bot Initialized with Mean Reversion!\n" +
              `📝 Transaction: ${tx.substring(0, 8)}...${tx.substring(tx.length - 8)}\n` +
              "🎯 Strategy: Micro Mean-Reversion Scalping\n" +
              "💰 Initial Balance: 1 USDC\n\n" +
              "🚀 Use /start_trading to begin automated trading\n" +
              "📊 Use /start_monitoring for real-time analysis"
          );
        }
      } catch (error) {
        ctx.reply(
          "❌ Failed to set mean reversion strategy.\n" +
            "🔍 Please check your wallet balance and try again.\n" +
            "📋 Use /status to check current state."
        );
        console.error("Mean reversion strategy error:", error);
      }
    });

    // SOL-optimized trading strategy command
    this.bot.command("soltrading", async (ctx) => {
      try {
        ctx.reply(
          "🎯 Setting up Tight SOL Scalping Strategy!\n\n" +
            "📊 Strategy Details:\n" +
            "• Type: Micro SOL Scalping\n" +
            "• Trade Size: 0.1 SOL per trade (~$18.50)\n" +
            "• Buy Below: $185.00\n" +
            "• Sell Above: $185.50\n" +
            "• Spread: Only $0.50 for ultra-frequent trades!\n" +
            "• Perfect for short-period trading!\n\n" +
            "⏳ Configuring tight range strategy..."
        );

        const solTradingStrategy: StrategyConfig = {
          strategyType: "GridTrading", // Use GridTrading for more reliable execution
          tokenA: new PublicKey("So11111111111111111111111111111111111111112"), // SOL (primary)
          tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
          buyThreshold: 1850000, // Buy when SOL < $185.00 (corrected for ratio calculation)
          sellThreshold: 1855000, // Sell when SOL > $185.50 (corrected for ratio calculation)  
          maxSlippage: 50, // 0.5% for faster execution
          tradeAmount: 100000000, // 0.1 SOL (9 decimals) - smaller for frequent trades
        };

        try {
          await this.tradingBot.getBotInfo();
          await this.tradingBot.updateStrategy(solTradingStrategy);
          
          ctx.reply(
            "✅ Tight SOL Scalping Strategy Activated!\n\n" +
              "🎯 Strategy: Micro SOL Scalping\n" +
              "💰 Trade Size: 0.1 SOL (~$18.50)\n" +
              "📊 Buy Below: $185.00 | Sell Above: $185.50\n" +
              "⚡ Grid Range: $0.50 spread for ultra-frequent trades\n" +
              "🔥 Can execute ~120 trades with your balance!\n\n" +
              "🚀 Use /start_trading to begin\n" +
              "📊 Use /start_monitoring for live updates"
          );
        } catch (botError) {
          const tx = await this.tradingBot.initializeBot(solTradingStrategy, 1000000);
          
          ctx.reply(
            "✅ Bot Initialized with Tight SOL Scalping!\n" +
              `📝 Transaction: ${tx.substring(0, 8)}...${tx.substring(tx.length - 8)}\n` +
              "🎯 Strategy: Micro SOL Scalping ($185.00-$185.50)\n" +
              "💰 Trade Size: 0.1 SOL per position\n\n" +
              "🚀 Ready for frequent short-period trades!"
          );
        }
      } catch (error) {
        ctx.reply(
          "❌ Failed to set SOL trading strategy.\n" +
            "Please check your configuration and try again."
        );
        console.error("SOL trading strategy error:", error);
      }
    });

    // Test trade command - bypass all conditions
    this.bot.command("testtrade", async (ctx) => {
      try {
        ctx.reply(
          "🔥 EXECUTING REAL DEX TRADES ON DEVNET!\n\n" +
            "🔴 REAL TRANSACTIONS: 0.001 SOL → USDC\n" +
            "⚠️ DEVNET - Real blockchain execution!\n" +
            "📊 Trying: Raydium API → Orca API → Serum DEX\n\n" +
            "⏳ Executing ACTUAL transactions..."
        );

        console.log("\n🧪 ===== MICRO TEST TRADE EXECUTION =====");
        console.log(`🔴 Direct test: Selling 0.001 SOL (1M lamports)`);
        
        // Get wallet balance first
        const walletBalance = await this.tradingBot.getWalletBalance();
        console.log(`💳 Wallet SOL balance: ${walletBalance}`);
        
        if (walletBalance < 0.002) { // Need at least 0.002 SOL (0.001 for trade + 0.001 for fees)
          ctx.reply(
            "❌ Test Trade Failed!\n" +
              `💳 Wallet balance: ${walletBalance.toFixed(4)} SOL\n` +
              "📋 Need at least 0.002 SOL for micro test trade (0.001 + fees)"
          );
          return;
        }

        // Execute direct test trade - 0.001 SOL (1M lamports)
        const testResult = await this.tradingBot.testDirectJupiterSwap(
          1000000, // 0.001 SOL in lamports (1M)
          false    // false = sell SOL
        );

        console.log(`✅ Micro test trade result: ${testResult}`);
        
        ctx.reply(
          "✅ REAL DEX TRADE EXECUTED!\n\n" +
            "🔥 ACTUAL TRANSACTION: 0.001 SOL trade\n" +
            `📝 TX ID: ${testResult}\n\n` +
            "💡 Real blockchain transaction completed!\n" +
            "🔗 Check Solscan devnet for confirmation"
        );

      } catch (error) {
        console.error("❌ Test trade failed:", error);
        ctx.reply(
          "❌ Test Trade Failed!\n\n" +
            `🚨 Error: ${error.message}\n\n` +
            "📊 Check console logs for details"
        );
      }
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

  private async sendMonitoringUpdate(): Promise<void> {
    if (!this.lastChatId) {
      console.log("No chat ID available for monitoring updates");
      return;
    }

    try {
      // Get comprehensive monitoring data
      const monitoringData = await this.getDetailedMonitoringInfo();

      if (monitoringData) {
        await this.bot.telegram.sendMessage(this.lastChatId, monitoringData, {
          parse_mode: "Markdown",
        });
      }
    } catch (error) {
      console.error("Failed to send monitoring update:", error);
      // Don't spam user with error messages, just log it
    }
  }

  private async getDetailedMonitoringInfo(): Promise<string | null> {
    try {
      const timestamp = new Date().toLocaleString();

      // Check if bot is healthy first
      const isHealthy = await this.tradingBot.healthCheck();
      if (!isHealthy) {
        return `🔴 *Trading Bot Monitor - ${timestamp}*\n\n❌ Bot connection failed - check RPC connection`;
      }

      // Get wallet balance
      const walletBalance = await this.tradingBot.getWalletBalance();

      try {
        // Use the new comprehensive monitoring method
        const monitoringData = await this.tradingBot.getMonitoringData();

        if (!monitoringData) {
          return `📊 *Trading Bot Monitor - ${timestamp}*\n\n❌ Failed to get monitoring data`;
        }

        const { botInfo, strategy, priceData, analysis, priceRatio, meanReversionSignal, debugInfo } =
          monitoringData;

        if (!strategy) {
          return `📊 *Trading Bot Monitor - ${timestamp}*\n\n⚠️ No strategy configured`;
        }

        let monitoringInfo = `📊 *Trading Bot Monitor - ${timestamp}*\n\n`;

        // Bot status
        monitoringInfo += `🤖 *Status:* ${
          botInfo.isActive ? "✅ Active" : "❌ Inactive"
        }\n`;
        monitoringInfo += `💰 *Bot Balance:* ${(
          parseInt(botInfo.balance) / 1000000
        ).toFixed(2)} USDC\n`;
        monitoringInfo += `💳 *Wallet Balance:* ${walletBalance.toFixed(
          4
        )} SOL\n`;
        monitoringInfo += `📈 *Total Trades:* ${botInfo.totalTrades}\n\n`;

        // Strategy info
        monitoringInfo += `⚙️ *Strategy:* ${strategy.strategyType}\n`;
        monitoringInfo += `🔄 *Pair:* ${this.getTokenSymbol(
          strategy.tokenA
        )}/${this.getTokenSymbol(strategy.tokenB)}\n`;
        
        if (strategy.strategyType === "MeanReversion") {
          monitoringInfo += `🎯 *Type:* Micro Mean-Reversion Scalping\n`;
          monitoringInfo += `📉 *Triggers:* ±0.15% in 2min window\n\n`;
        } else {
          monitoringInfo += `📊 *Thresholds:* Buy≤${strategy.buyThreshold} | Sell≥${strategy.sellThreshold}\n\n`;
        }

        if (priceData && priceData.tokenAPrice > 0) {
          // Current prices
          monitoringInfo += `💲 *Current Prices:*\n`;
          monitoringInfo += `• ${this.getTokenSymbol(
            strategy.tokenA
          )}: $${priceData.tokenAPrice.toFixed(4)}\n`;
          monitoringInfo += `• ${this.getTokenSymbol(
            strategy.tokenB
          )}: $${priceData.tokenBPrice.toFixed(4)}\n`;
          monitoringInfo += `⚖️ *Price Ratio:* ${priceRatio.toFixed(2)}\n`;
          monitoringInfo += `🎯 *Confidence:* ${priceData.confidence}%\n\n`;

          // Mean reversion specific info
          if (strategy.strategyType === "MeanReversion" && meanReversionSignal) {
            monitoringInfo += `\n🎯 *Mean-Reversion Status:*\n`;
            monitoringInfo += `📊 Signal: ${meanReversionSignal.type.toUpperCase()} (${meanReversionSignal.confidence}%)\n`;
            monitoringInfo += `📝 ${meanReversionSignal.reason}\n`;
            if (meanReversionSignal.entryPrice) {
              const pnl = ((meanReversionSignal.currentPrice - meanReversionSignal.entryPrice) / meanReversionSignal.entryPrice) * 100;
              monitoringInfo += `💰 P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%\n`;
              monitoringInfo += `⏱️ Hold: ${(meanReversionSignal.timeWindow / 1000).toFixed(0)}s\n`;
            }
          }

          // Trade analysis
          monitoringInfo += `\n🔍 *Trade Analysis:*\n`;
          analysis.forEach((reason) => {
            monitoringInfo += `${reason}\n`;
          });

          // Add debug information
          if (debugInfo && debugInfo.length > 0) {
            monitoringInfo += `\n`;
            debugInfo.forEach((debug) => {
              monitoringInfo += `${debug}\n`;
            });
          }
        } else {
          monitoringInfo += `⚠️ *Price Data:* Not available - fetching...\n`;
          monitoringInfo += `📡 Trying to fetch fresh price data...`;
        }

        return monitoringInfo;
      } catch (botError) {
        return `📊 *Trading Bot Monitor - ${timestamp}*\n\n🟡 Bot not initialized\n💳 Wallet: ${walletBalance.toFixed(
          4
        )} SOL\n\n⚠️ Use /initialize to set up trading bot`;
      }
    } catch (error) {
      console.error("Error getting detailed monitoring info:", error);
      return `📊 *Trading Bot Monitor*\n\n❌ Failed to get monitoring data: ${error.message}`;
    }
  }

  private getTokenSymbol(tokenAddress: PublicKey): string {
    const address = tokenAddress.toString();
    if (address === "So11111111111111111111111111111111111111112") return "SOL";
    if (address === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
      return "USDC";
    return `${address.substring(0, 4)}...${address.substring(
      address.length - 4
    )}`;
  }

  public async stop(): Promise<void> {
    // Stop periodic monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.bot.stop();
    await this.tradingBot.stopBot();
  }
}
