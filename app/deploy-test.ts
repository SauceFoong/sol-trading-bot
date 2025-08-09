import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import { SolanaTradingBot } from "../target/types/solana_trading_bot";
import fs from "fs";

// Load the deployed program ID
const PROGRAM_ID = new PublicKey(
  "EroGopwwQVYXgbMZigR1UvQ9xZh7fviL4897ZUvYtt2F"
);

async function main() {
  console.log("🚀 Deploying Solana Trading Bot to Devnet...\n");

  // Setup connection and wallet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Load your keypair (make sure you have SOL in this wallet)
  const keypairPath =
    process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`;
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(keypairData));

  console.log("📍 Wallet Address:", wallet.publicKey.toString());

  // Check wallet balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(
    "💰 Wallet Balance:",
    balance / anchor.web3.LAMPORTS_PER_SOL,
    "SOL"
  );

  if (balance < anchor.web3.LAMPORTS_PER_SOL * 0.1) {
    console.log("⚠️  Low balance! You may need more SOL for testing.");
    console.log("💡 Run: solana airdrop 2");
  }

  // Setup Anchor provider
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  // Load the program
  const idl = require("../target/idl/solana_trading_bot.json");
  const program = new Program(
    idl,
    PROGRAM_ID,
    provider
  ) as Program<SolanaTradingBot>;

  console.log("🔗 Program ID:", program.programId.toString());

  // Derive bot account address
  const [botAccount, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("trading-bot"), wallet.publicKey.toBuffer()],
    program.programId
  );

  console.log("🤖 Bot Account:", botAccount.toString());

  try {
    // Check if bot already exists
    try {
      const existingBot = await program.account.tradingBot.fetch(botAccount);
      console.log("✅ Bot already exists!");
      console.log("📊 Current Status:");
      console.log("   - Active:", existingBot.isActive);
      console.log("   - Balance:", existingBot.balance.toString(), "units");
      console.log("   - Total Trades:", existingBot.totalTrades.toString());
      console.log(
        "   - Successful Trades:",
        existingBot.successfulTrades.toString()
      );
      return;
    } catch (error) {
      console.log("🆕 Bot doesn't exist yet, creating new one...");
    }

    // Configure strategy (Grid Trading example)
    const strategy = {
      strategyType: { gridTrading: {} },
      tokenA: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
      tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
      buyThreshold: new anchor.BN(45_000_000), // $45 (6 decimals)
      sellThreshold: new anchor.BN(55_000_000), // $55 (6 decimals)
      maxSlippage: 100, // 1%
      tradeAmount: new anchor.BN(1_000_000), // 1 USDC per trade
      stopLoss: new anchor.BN(10_000_000), // Stop loss at $10
      takeProfit: new anchor.BN(100_000_000), // Take profit at $100
    };

    const initParams = {
      strategy,
      initialBalance: new anchor.BN(50_000_000), // 50 USDC initial balance
    };

    console.log("⚙️  Strategy Configuration:");
    console.log("   - Type: Grid Trading");
    console.log("   - Token Pair: SOL/USDC");
    console.log("   - Buy Threshold: $45");
    console.log("   - Sell Threshold: $55");
    console.log("   - Trade Amount: 1 USDC");
    console.log("   - Initial Balance: 50 USDC\n");

    // Initialize the trading bot
    console.log("🔄 Initializing trading bot...");
    const tx = await program.methods
      .initializeBot(initParams)
      .accountsPartial({
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Bot initialized successfully!");
    console.log(
      "📝 Transaction:",
      `https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    // Fetch and display bot information
    const bot = await program.account.tradingBot.fetch(botAccount);
    console.log("\n🎯 Bot Information:");
    console.log("   - Authority:", bot.authority.toString());
    console.log("   - Active:", bot.isActive);
    console.log("   - Balance:", bot.balance.toString(), "units");
    console.log(
      "   - Created At:",
      new Date(bot.createdAt.toNumber() * 1000).toLocaleString()
    );
    console.log(
      "   - Strategy Type:",
      Object.keys(bot.strategy.strategyType)[0]
    );

    console.log("\n🧪 Testing basic operations...");

    // Test pause/resume functionality
    console.log("⏸️  Testing pause functionality...");
    const pauseTx = await program.methods
      .pauseBot()
      .accountsPartial({
        authority: wallet.publicKey,
      })
      .rpc();
    console.log(
      "✅ Bot paused:",
      `https://explorer.solana.com/tx/${pauseTx}?cluster=devnet`
    );

    console.log("▶️  Testing resume functionality...");
    const resumeTx = await program.methods
      .resumeBot()
      .accountsPartial({
        authority: wallet.publicKey,
      })
      .rpc();
    console.log(
      "✅ Bot resumed:",
      `https://explorer.solana.com/tx/${resumeTx}?cluster=devnet`
    );

    // Test price update functionality
    console.log("📈 Testing price update...");
    const priceData = {
      tokenAPrice: new anchor.BN(50_000_000), // $50 SOL
      tokenBPrice: new anchor.BN(1_000_000), // $1 USDC
      timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
      confidence: 95,
    };

    const priceUpdateTx = await program.methods
      .updatePrice(priceData)
      .accountsPartial({
        authority: wallet.publicKey,
      })
      .rpc();
    console.log(
      "✅ Price updated:",
      `https://explorer.solana.com/tx/${priceUpdateTx}?cluster=devnet`
    );

    // Test strategy check
    console.log("🔍 Testing strategy check...");
    const canTrade = await program.methods
      .checkStrategy()
      .accountsPartial({
        authority: wallet.publicKey,
      })
      .view();
    console.log("✅ Strategy check result:", canTrade);

    console.log("\n🎉 Deployment and Testing Complete!");
    console.log("🔗 Bot Account:", botAccount.toString());
    console.log(
      "📍 Explorer:",
      `https://explorer.solana.com/address/${botAccount.toString()}?cluster=devnet`
    );

    console.log("\n📋 Next Steps:");
    console.log("1. Monitor the bot account on Solana Explorer");
    console.log("2. Test trading operations with small amounts");
    console.log("3. Implement client-side monitoring");
    console.log("4. Set up price feeds and automated trading");
  } catch (error) {
    console.error("❌ Error during deployment:", error);

    if (error.message.includes("0x1")) {
      console.log("💡 This might be an insufficient funds error. Try:");
      console.log("   solana airdrop 2");
    }
  }
}

main().catch(console.error);
