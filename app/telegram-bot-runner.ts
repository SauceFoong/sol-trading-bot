import { TelegramTradingBot } from "./src/telegram-bot";
import { BotConfig } from "./src/simple-trading-bot-client";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

async function main() {
  // Load environment variables
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowedUsers = process.env.TELEGRAM_ALLOWED_USERS?.split(",") || [];
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const privateKeyPath = process.env.PRIVATE_KEY_PATH || "./id.json";

  if (!telegramToken) {
    console.error("❌ TELEGRAM_BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  // Load private key
  let privateKey: Uint8Array;
  try {
    if (fs.existsSync(privateKeyPath)) {
      const keyData = JSON.parse(fs.readFileSync(privateKeyPath, "utf8"));
      privateKey = new Uint8Array(keyData);
    } else {
      console.error(`❌ Private key file not found: ${privateKeyPath}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to load private key:", error);
    process.exit(1);
  }

  // Trading bot configuration
  const tradingBotConfig: BotConfig = {
    rpcUrl,
    privateKey,
    strategy: {
      strategyType: "GridTrading",
      tokenA: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
      tokenB: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
      buyThreshold: 100, // $100
      sellThreshold: 110, // $110
      maxSlippage: 0.01, // 1%
      tradeAmount: 1000000, // 1 USDC (6 decimals)
    },
    initialBalance: 10000000, // 10 USDC
  };

  // Create and start Telegram bot
  const telegramBot = new TelegramTradingBot({
    token: telegramToken,
    allowedUsers,
    tradingBotConfig,
  });

  try {
    console.log("🚀 Initializing Telegram Trading Bot...");
    await telegramBot.launch();
    console.log("✅ Bot is running! Send /start to interact with it.");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

main().catch(console.error);
