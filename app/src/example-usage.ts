import {
  TradingBotClient,
  StrategyConfig,
  BotConfig,
} from "./trading-bot-client";
import { PublicKey, Keypair } from "@solana/web3.js";

async function main() {
  // Example configuration
  const config: BotConfig = {
    strategy: {
      strategyType: "GridTrading",
      tokenA: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
      tokenB: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
      buyThreshold: 50, // Buy when SOL/USDC ratio drops below 50
      sellThreshold: 60, // Sell when SOL/USDC ratio goes above 60
      maxSlippage: 100, // 1% slippage
      tradeAmount: 10_000_000, // 10 USDC (6 decimals)
      stopLoss: 80_000_000, // Stop loss at 80 USDC
      takeProfit: 200_000_000, // Take profit at 200 USDC
    },
    initialBalance: 100_000_000, // 100 USDC
    rpcUrl: "https://api.mainnet-beta.solana.com",
    privateKey: Keypair.generate().secretKey, // Replace with your actual private key
  };

  // Create bot client
  const botClient = new TradingBotClient(config);

  try {
    // Initialize the bot
    console.log("Initializing trading bot...");
    await botClient.initializeBot(config.strategy, config.initialBalance);

    // Get bot information
    console.log("Bot info:", await botClient.getBotInfo());

    // Start the bot (this will run continuously)
    // await botClient.startBot();

    // Example of updating strategy
    const newStrategy: StrategyConfig = {
      ...config.strategy,
      buyThreshold: 45,
      sellThreshold: 65,
    };

    console.log("Updating strategy...");
    await botClient.updateStrategy(newStrategy);

    // Example of pausing and resuming
    console.log("Pausing bot...");
    await botClient.pauseBot();

    console.log("Resuming bot...");
    await botClient.resumeBot();

    // Example of withdrawing funds
    console.log("Withdrawing 10 USDC...");
    await botClient.withdrawFunds(10_000_000);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
