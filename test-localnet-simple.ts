import * as anchor from "@coral-xyz/anchor";

async function testLocalnet() {
  console.log("🧪 Testing Solana Trading Bot on Localnet");
  console.log("=" .repeat(60));
  
  // Configure the client to use localnet
  const provider = anchor.AnchorProvider.local("http://localhost:8899");
  anchor.setProvider(provider);
  
  const program = anchor.workspace.SolanaTradingBot;
  console.log("📋 Program ID:", program.programId.toString());
  console.log("🌐 RPC URL:", provider.connection.rpcEndpoint);
  console.log("👛 Wallet:", provider.wallet.publicKey.toString());

  // Check balance
  const balance = await provider.connection.getBalance(provider.wallet.publicKey);
  console.log("💰 Balance:", balance / anchor.web3.LAMPORTS_PER_SOL, "SOL");

  // Create test bot account
  const testWallet = anchor.web3.Keypair.generate();
  const [botAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("trading-bot"), testWallet.publicKey.toBuffer()],
    program.programId
  );

  console.log("\n🤖 Creating test bot...");
  console.log("Test Wallet:", testWallet.publicKey.toString());
  console.log("Bot Account:", botAccount.toString());
  
  try {
    // Airdrop some SOL to test wallet
    const airdropSig = await provider.connection.requestAirdrop(
      testWallet.publicKey, 
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
    console.log("💰 Airdropped 2 SOL to test wallet");

    // Grid trading strategy configuration
    const strategy = {
      strategyType: { gridTrading: {} },
      tokenA: new anchor.web3.PublicKey("So11111111111111111111111111111111111111112"), // SOL
      tokenB: new anchor.web3.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
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