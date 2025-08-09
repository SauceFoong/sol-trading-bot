import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("EroGopwwQVYXgbMZigR1UvQ9xZh7fviL4897ZUvYtt2F");

async function monitorBot(botAccountAddress: string) {
  console.log("🤖 SOLANA TRADING BOT MONITOR");
  console.log("=" .repeat(60));
  
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.SolanaTradingBot;
  console.log("📍 Program ID:", program.programId.toString());
  console.log("🔗 Network: Devnet");
  console.log("👛 Wallet:", provider.wallet.publicKey.toString());

  const botAccount = new PublicKey(botAccountAddress);
  console.log("🤖 Monitoring Bot:", botAccount.toString());
  console.log("📱 Explorer:", `https://explorer.solana.com/address/${botAccount.toString()}?cluster=devnet`);
  console.log();

  let previousTrades = 0;
  let monitoringCount = 0;

  const monitoringLoop = setInterval(async () => {
    try {
      monitoringCount++;
      const now = new Date();
      
      console.clear();
      console.log("🤖 TRADING BOT LIVE DASHBOARD");
      console.log("=" .repeat(60));
      console.log(`📅 ${now.toLocaleString()}`);
      console.log(`🔄 Update #${monitoringCount} (refreshes every 15s)`);
      console.log(`🤖 Bot: ${botAccount.toString().slice(0, 20)}...`);
      console.log("=" .repeat(60));

      // Fetch bot data
      const bot = await program.account.tradingBot.fetch(botAccount);
      
      // Calculate metrics
      const strategyType = Object.keys(bot.strategy.strategyType)[0];
      const winRate = bot.totalTrades.toNumber() > 0 
        ? ((bot.successfulTrades.toNumber() / bot.totalTrades.toNumber()) * 100).toFixed(1)
        : "0.0";
      
      const balanceUsd = (bot.balance.toNumber() / 1_000_000).toFixed(2);
      const tradeAmountUsd = (bot.strategy.tradeAmount.toNumber() / 1_000_000).toFixed(2);
      
      const lastTradeTime = bot.lastTradeTimestamp.toNumber() > 0 
        ? new Date(bot.lastTradeTimestamp.toNumber() * 1000).toLocaleString()
        : "No trades yet";

      const createdTime = new Date(bot.createdAt.toNumber() * 1000);
      const hoursActive = ((now.getTime() - createdTime.getTime()) / (1000 * 60 * 60)).toFixed(1);

      // Check for new trades
      const currentTrades = bot.totalTrades.toNumber();
      const newTrades = currentTrades - previousTrades;
      if (newTrades > 0) {
        console.log(`🚨 ${newTrades} NEW TRADE${newTrades > 1 ? 'S' : ''} DETECTED!`);
        console.log();
      }
      previousTrades = currentTrades;

      // Display bot status
      console.log("📊 BOT STATUS");
      console.log("-" .repeat(30));
      console.log(`Status:           ${bot.isActive ? '🟢 ACTIVE' : '🔴 PAUSED'}`);
      console.log(`Strategy:         ${strategyType.toUpperCase()}`);
      console.log(`Balance:          $${balanceUsd} USDC`);
      console.log(`Hours Active:     ${hoursActive}h`);
      console.log();

      // Display trading stats
      console.log("📈 TRADING PERFORMANCE");
      console.log("-" .repeat(30));
      console.log(`Total Trades:     ${currentTrades}`);
      console.log(`Successful:       ${bot.successfulTrades.toNumber()}`);
      console.log(`Win Rate:         ${winRate}%`);
      console.log(`Trade Size:       $${tradeAmountUsd} USDC`);
      console.log(`Last Trade:       ${lastTradeTime}`);
      console.log();

      // Display strategy parameters
      console.log("⚙️  STRATEGY SETTINGS");
      console.log("-" .repeat(30));
      console.log(`Buy Threshold:    $${(bot.strategy.buyThreshold.toNumber() / 1_000_000).toFixed(2)}`);
      console.log(`Sell Threshold:   $${(bot.strategy.sellThreshold.toNumber() / 1_000_000).toFixed(2)}`);
      console.log(`Max Slippage:     ${(bot.strategy.maxSlippage / 100).toFixed(2)}%`);
      
      if (bot.strategy.stopLoss) {
        console.log(`Stop Loss:        $${(bot.strategy.stopLoss.toNumber() / 1_000_000).toFixed(2)}`);
      }
      if (bot.strategy.takeProfit) {
        console.log(`Take Profit:      $${(bot.strategy.takeProfit.toNumber() / 1_000_000).toFixed(2)}`);
      }
      console.log();

      // Display alerts
      console.log("🚨 ALERTS");
      console.log("-" .repeat(30));
      
      const alerts = [];
      
      if (!bot.isActive) {
        alerts.push("🔴 Bot is currently PAUSED");
      }
      
      if (bot.balance.toNumber() < 1_000_000) { // Less than $1
        alerts.push("🟡 LOW BALANCE: Less than $1 remaining");
      }
      
      if (currentTrades > 5 && parseFloat(winRate) < 40) {
        alerts.push(`🟠 LOW WIN RATE: ${winRate}% (below 40%)`);
      }

      if (bot.lastTradeTimestamp.toNumber() > 0) {
        const timeSinceLastTrade = (now.getTime() / 1000) - bot.lastTradeTimestamp.toNumber();
        if (timeSinceLastTrade > 3600) { // 1 hour
          const hoursAgo = (timeSinceLastTrade / 3600).toFixed(1);
          alerts.push(`🟠 No trades for ${hoursAgo} hours`);
        }
      }
      
      if (alerts.length === 0) {
        console.log("✅ All systems operating normally");
      } else {
        alerts.forEach(alert => console.log(`   ${alert}`));
      }
      
      console.log();
      console.log("=" .repeat(60));
      console.log("📊 QUICK STATS");
      console.log(`Avg trades/hour: ${parseFloat(hoursActive) > 0 ? (currentTrades / parseFloat(hoursActive)).toFixed(2) : '0.00'}`);
      console.log(`Total volume: $${(currentTrades * parseFloat(tradeAmountUsd)).toFixed(2)} USDC`);
      console.log();
      console.log("Press Ctrl+C to stop monitoring");

    } catch (error) {
      console.error("❌ Error fetching bot data:", error.message);
      console.log("⚠️  Will retry in 15 seconds...");
    }
  }, 15000); // Update every 15 seconds

  // Initial fetch
  try {
    const bot = await program.account.tradingBot.fetch(botAccount);
    console.log("✅ Bot found! Starting live monitoring...");
    previousTrades = bot.totalTrades.toNumber();
  } catch (error) {
    console.error("❌ Failed to fetch initial bot data:", error.message);
    console.log("Please check the bot account address and try again.");
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log("\n\n👋 Stopping bot monitoring...");
    clearInterval(monitoringLoop);
    
    console.log("\n📋 FINAL SUMMARY");
    console.log(`   Monitored for: ${monitoringCount} updates`);
    console.log(`   Bot Account: ${botAccount.toString()}`);
    console.log(`   Explorer: https://explorer.solana.com/address/${botAccount.toString()}?cluster=devnet`);
    
    console.log("\n✅ Monitoring stopped. Goodbye!");
    process.exit(0);
  });
}

// Get bot account from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("❌ Please provide a bot account address to monitor");
  console.log("Usage: npm run monitor <bot-account-address>");
  console.log("\nExample:");
  console.log("npm run monitor C4mfNMPaxcfBui8smgj8MX6cFMXBfPukAmafLMYC96Rc");
  process.exit(1);
}

const botAccountAddress = args[0];

// Validate the address
try {
  new PublicKey(botAccountAddress);
} catch {
  console.log("❌ Invalid bot account address provided");
  process.exit(1);
}

monitorBot(botAccountAddress).catch(console.error);