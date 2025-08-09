import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey(
  "EroGopwwQVYXgbMZigR1UvQ9xZh7fviL4897ZUvYtt2F"
);

async function testTradingBot() {
  console.log("🚀 Testing Solana Trading Bot on Devnet");
  console.log("=".repeat(50));

  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaTradingBot;
  console.log("📍 Program ID:", program.programId.toString());

  // Create test wallet
  const testWallet = Keypair.generate();
  console.log("👛 Test Wallet:", testWallet.publicKey.toString());

  try {
    // Airdrop SOL for testing
    console.log("💰 Requesting airdrop...");
    const airdropSig = await provider.connection.requestAirdrop(
      testWallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const balance = await provider.connection.getBalance(testWallet.publicKey);
    console.log(
      "✅ Airdrop successful! Balance:",
      balance / LAMPORTS_PER_SOL,
      "SOL"
    );

    // Derive bot account
    const [botAccount, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("trading-bot"), testWallet.publicKey.toBuffer()],
      program.programId
    );
    console.log("🤖 Bot Account:", botAccount.toString());

    // Grid trading strategy
    const strategy = {
      strategyType: { gridTrading: {} },
      tokenA: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
      tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
      buyThreshold: new anchor.BN(40_000_000), // $40
      sellThreshold: new anchor.BN(60_000_000), // $60
      maxSlippage: 100, // 1%
      tradeAmount: new anchor.BN(1_000_000), // 1 USDC
      stopLoss: new anchor.BN(10_000_000), // $10
      takeProfit: new anchor.BN(50_000_000), // $50
    };

    // Initialize bot
    console.log("\n🤖 Initializing trading bot...");
    const initTx = await program.methods
      .initializeBot({
        strategy,
        initialBalance: new anchor.BN(20_000_000), // 20 USDC virtual balance
      })
      .accountsPartial({
        authority: testWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testWallet])
      .rpc();

    console.log("✅ Bot initialized!");
    console.log(
      "📝 Transaction:",
      `https://explorer.solana.com/tx/${initTx}?cluster=devnet`
    );

    // Get bot info
    const bot = await program.account.tradingBot.fetch(botAccount);
    console.log("\n📊 Bot Information:");
    console.log("   Authority:", bot.authority.toString());
    console.log("   Active:", bot.isActive);
    console.log(
      "   Balance:",
      (bot.balance.toNumber() / 1_000_000).toFixed(2),
      "USDC"
    );
    console.log("   Strategy:", Object.keys(bot.strategy.strategyType)[0]);
    console.log("   Total Trades:", bot.totalTrades.toString());

    // Test price update
    console.log("\n📈 Testing price update...");
    const priceData = {
      tokenAPrice: new anchor.BN(35_000_000), // $35 SOL (below buy threshold)
      tokenBPrice: new anchor.BN(1_000_000), // $1 USDC
      timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
      confidence: 95,
    };

    const priceUpdateTx = await program.methods
      .updatePrice(priceData)
      .accountsPartial({
        authority: testWallet.publicKey,
      })
      .signers([testWallet])
      .rpc();

    console.log("✅ Price updated (should trigger buy signal)!");
    console.log(
      "📝 Transaction:",
      `https://explorer.solana.com/tx/${priceUpdateTx}?cluster=devnet`
    );

    // Test trade execution
    console.log("\n⚡ Testing trade execution...");
    const tradeParams = {
      amount: new anchor.BN(1_000_000), // 1 USDC
      minAmountOut: new anchor.BN(950_000), // Accept 5% slippage
      tradeType: { buy: {} },
    };

    const tradeTx = await program.methods
      .executeTrade(tradeParams)
      .accountsPartial({
        authority: testWallet.publicKey,
      })
      .signers([testWallet])
      .rpc();

    console.log("✅ Trade executed!");
    console.log(
      "📝 Transaction:",
      `https://explorer.solana.com/tx/${tradeTx}?cluster=devnet`
    );

    // Get updated bot info
    const updatedBot = await program.account.tradingBot.fetch(botAccount);
    console.log("\n📊 Updated Bot Stats:");
    console.log("   Total Trades:", updatedBot.totalTrades.toString());
    console.log(
      "   Successful Trades:",
      updatedBot.successfulTrades.toString()
    );
    console.log(
      "   Last Trade:",
      new Date(updatedBot.lastTradeTimestamp.toNumber() * 1000).toLocaleString()
    );

    // Test pause/resume
    console.log("\n⏸️  Testing pause functionality...");
    const pauseTx = await program.methods
      .pauseBot()
      .accountsPartial({
        authority: testWallet.publicKey,
      })
      .signers([testWallet])
      .rpc();

    console.log("✅ Bot paused!");
    console.log(
      "📝 Transaction:",
      `https://explorer.solana.com/tx/${pauseTx}?cluster=devnet`
    );

    console.log("\n▶️  Testing resume functionality...");
    const resumeTx = await program.methods
      .resumeBot()
      .accountsPartial({
        authority: testWallet.publicKey,
      })
      .signers([testWallet])
      .rpc();

    console.log("✅ Bot resumed!");
    console.log(
      "📝 Transaction:",
      `https://explorer.solana.com/tx/${resumeTx}?cluster=devnet`
    );

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   Bot Account:", botAccount.toString());
    console.log(
      "   Explorer:",
      `https://explorer.solana.com/address/${botAccount.toString()}?cluster=devnet`
    );
    console.log(
      "   Transactions: 5 (init, price update, trade, pause, resume)"
    );

    console.log("\n📊 Next: Monitor this bot using the dashboard:");
    console.log(`   npm run monitor ${botAccount.toString()}`);

    return {
      success: true,
      botAccount: botAccount.toString(),
      transactions: [initTx, priceUpdateTx, tradeTx, pauseTx, resumeTx],
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

testTradingBot().then((result) => {
  if (result.success) {
    console.log("\n✅ Testing completed successfully!");
    process.exit(0);
  } else {
    console.log("\n❌ Testing failed!");
    process.exit(1);
  }
});
