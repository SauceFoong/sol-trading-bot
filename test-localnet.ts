import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { SolanaTradingBot } from "./target/types/solana_trading_bot";
import fs from "fs";

const PROGRAM_ID = new PublicKey("EroGopwwQVYXgbMZigR1UvQ9xZh7fviL4897ZUvYtt2F");

async function testLocalnet() {
  console.log("🧪 Testing Solana Trading Bot on Localnet");
  console.log("=" .repeat(60));
  
  // Connect to localnet
  const connection = new Connection("http://localhost:8899", "confirmed");
  
  // Load wallet
  const keypairPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`;
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(keypairData));
  
  console.log("🌐 Connected to localnet");
  console.log("👛 Wallet:", wallet.publicKey.toString());
  
  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("💰 Balance:", balance / LAMPORTS_PER_SOL, "SOL");
  
  // Setup provider
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  // Load program
  const idl = require("./target/idl/solana_trading_bot.json");
  const program = new Program(idl, PROGRAM_ID, provider) as Program<SolanaTradingBot>;
  
  console.log("📋 Program ID:", program.programId.toString());

  // Create test bot
  const testWallet = Keypair.generate();
  const [botAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("trading-bot"), testWallet.publicKey.toBuffer()],
    program.programId
  );

  console.log("\n🤖 Creating test bot...");
  console.log("Bot Account:", botAccount.toString());
  
  try {
    // Airdrop some SOL to test wallet
    const airdropSig = await connection.requestAirdrop(testWallet.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSig);
    console.log("💰 Airdropped 2 SOL to test wallet");

    // Grid trading strategy configuration
    const strategy = {
      strategyType: { gridTrading: {} },
      tokenA: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
      tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
      buyThreshold: new anchor.BN(40_000_000), // $40 buy threshold
      sellThreshold: new anchor.BN(60_000_000), // $60 sell threshold
      maxSlippage: 50, // 0.5%
      tradeAmount: new anchor.BN(1_000_000), // 1 USDC per trade
      stopLoss: new anchor.BN(5_000_000), // $5 stop loss
      takeProfit: new anchor.BN(100_000_000), // $100 take profit
    };

    // Initialize bot
    const initTx = await program.methods
      .initializeBot({ 
        strategy, 
        initialBalance: new anchor.BN(50_000_000) // 50 USDC virtual balance
      })
      .accountsPartial({
        authority: testWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testWallet])
      .rpc();

    console.log("✅ Bot initialized:", initTx);

    // Get bot state
    const botState = await program.account.tradingBot.fetch(botAccount);
    console.log("\n📊 Bot State:");
    console.log("   Authority:", botState.authority.toString());
    console.log("   Active:", botState.isActive);
    console.log("   Balance:", botState.balance.toString());
    console.log("   Total Trades:", botState.totalTrades.toString());
    console.log("   Strategy Type:", Object.keys(botState.strategy.strategyType)[0]);
    
    // Test price update
    console.log("\n📈 Testing price update...");
    const priceData = {
      tokenAPrice: new anchor.BN(45_000_000), // $45 SOL
      tokenBPrice: new anchor.BN(1_000_000),  // $1 USDC
      timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
      confidence: 95,
    };

    const priceTx = await program.methods
      .updatePrice(priceData)
      .accountsPartial({
        authority: testWallet.publicKey,
      })
      .signers([testWallet])
      .rpc();

    console.log("✅ Price updated:", priceTx);
    
    console.log("\n🎉 Localnet test completed successfully!");
    console.log("Bot Account for monitoring:", botAccount.toString());
    
    return botAccount.toString();
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run test
testLocalnet()
  .then((botAccount) => {
    console.log("\n📝 Bot Account created:", botAccount);
    console.log("Use this account with the telegram bot or monitoring scripts");
  })
  .catch(console.error);