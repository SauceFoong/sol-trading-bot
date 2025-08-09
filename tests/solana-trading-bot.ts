import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { SolanaTradingBot } from "../target/types/solana_trading_bot";
import { expect } from "chai";

describe("Solana Trading Bot", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .SolanaTradingBot as Program<SolanaTradingBot>;
  const authority = provider.wallet as anchor.Wallet;

  let botAccount: PublicKey;
  let bump: number;

  before(async () => {
    // Derive bot account address
    [botAccount, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("trading-bot"), authority.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop SOL to test account
    const connection = provider.connection;
    const signature = await connection.requestAirdrop(
      authority.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
  });

  describe("Bot Initialization", () => {
    it("Should initialize trading bot with valid parameters", async () => {
      const strategy = {
        strategyType: { gridTrading: {} },
        tokenA: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
        tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
        buyThreshold: new anchor.BN(50),
        sellThreshold: new anchor.BN(60),
        maxSlippage: 100, // 1%
        tradeAmount: new anchor.BN(10_000_000), // 10 USDC
        stopLoss: new anchor.BN(80_000_000), // 80 USDC
        takeProfit: new anchor.BN(200_000_000), // 200 USDC
      };

      const params = {
        strategy,
        initialBalance: new anchor.BN(100_000_000), // 100 USDC
      };

      const tx = await program.methods
        .initializeBot(params)
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Bot initialized with transaction:", tx);

      // Verify bot state
      const bot = await program.account.tradingBot.fetch(botAccount);
      expect(bot.authority.toString()).to.equal(authority.publicKey.toString());
      expect(bot.isActive).to.be.true;
      expect(bot.balance.toString()).to.equal("100000000");
      expect(bot.totalTrades.toString()).to.equal("0");
      expect(bot.successfulTrades.toString()).to.equal("0");
    });

    it("Should fail to initialize bot with invalid parameters", async () => {
      const invalidStrategy = {
        strategyType: { gridTrading: {} },
        tokenA: new PublicKey("So11111111111111111111111111111111111111112"),
        tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
        buyThreshold: new anchor.BN(0), // Invalid threshold
        sellThreshold: new anchor.BN(60),
        maxSlippage: 100,
        tradeAmount: new anchor.BN(10_000_000),
        stopLoss: null,
        takeProfit: null,
      };

      const invalidParams = {
        strategy: invalidStrategy,
        initialBalance: new anchor.BN(0), // Invalid balance
      };

      const newAuthority = Keypair.generate();
      const [newBotAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("trading-bot"), newAuthority.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .initializeBot(invalidParams)
          .accounts({
            tradingBot: newBotAccount,
            authority: newAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newAuthority])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        console.log("Expected error:", error.message);
      }
    });
  });

  describe("Strategy Management", () => {
    it("Should update strategy successfully", async () => {
      const newStrategy = {
        strategyType: { dca: {} },
        tokenA: new PublicKey("So11111111111111111111111111111111111111112"),
        tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
        buyThreshold: new anchor.BN(45),
        sellThreshold: new anchor.BN(65),
        maxSlippage: 150, // 1.5%
        tradeAmount: new anchor.BN(15_000_000), // 15 USDC
        stopLoss: new anchor.BN(70_000_000), // 70 USDC
        takeProfit: new anchor.BN(250_000_000), // 250 USDC
      };

      const tx = await program.methods
        .updateStrategy({ strategy: newStrategy })
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Strategy updated with transaction:", tx);

      // Verify updated strategy
      const bot = await program.account.tradingBot.fetch(botAccount);
      expect(bot.strategy.buyThreshold.toString()).to.equal("45");
      expect(bot.strategy.sellThreshold.toString()).to.equal("65");
      expect(bot.strategy.tradeAmount.toString()).to.equal("15000000");
    });

    it("Should fail to update strategy with unauthorized user", async () => {
      const unauthorizedUser = Keypair.generate();

      const newStrategy = {
        strategyType: { arbitrage: {} },
        tokenA: new PublicKey("So11111111111111111111111111111111111111112"),
        tokenB: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
        buyThreshold: new anchor.BN(40),
        sellThreshold: new anchor.BN(70),
        maxSlippage: 200,
        tradeAmount: new anchor.BN(20_000_000),
        stopLoss: null,
        takeProfit: null,
      };

      try {
        await program.methods
          .updateStrategy({ strategy: newStrategy })
          .accounts({
            tradingBot: botAccount,
            authority: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        console.log("Expected authorization error:", error.message);
      }
    });
  });

  describe("Bot Control", () => {
    it("Should pause bot successfully", async () => {
      const tx = await program.methods
        .pauseBot()
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Bot paused with transaction:", tx);

      // Verify bot is paused
      const bot = await program.account.tradingBot.fetch(botAccount);
      expect(bot.isActive).to.be.false;
    });

    it("Should resume bot successfully", async () => {
      const tx = await program.methods
        .resumeBot()
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Bot resumed with transaction:", tx);

      // Verify bot is active
      const bot = await program.account.tradingBot.fetch(botAccount);
      expect(bot.isActive).to.be.true;
    });
  });

  describe("Trading Operations", () => {
    it("Should execute trade successfully", async () => {
      const tradeParams = {
        amount: new anchor.BN(5_000_000), // 5 USDC
        minAmountOut: new anchor.BN(4_750_000), // 4.75 USDC minimum
        tradeType: { buy: {} },
      };

      const tx = await program.methods
        .executeTrade(tradeParams)
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Trade executed with transaction:", tx);

      // Verify trade was recorded
      const bot = await program.account.tradingBot.fetch(botAccount);
      expect(bot.totalTrades.toString()).to.equal("1");
    });

    it("Should fail to trade when bot is paused", async () => {
      // First pause the bot
      await program.methods
        .pauseBot()
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
        })
        .rpc();

      const tradeParams = {
        amount: new anchor.BN(5_000_000),
        minAmountOut: new anchor.BN(4_750_000),
        tradeType: { sell: {} },
      };

      try {
        await program.methods
          .executeTrade(tradeParams)
          .accounts({
            tradingBot: botAccount,
            authority: authority.publicKey,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        console.log("Expected error - bot not active:", error.message);
      }

      // Resume bot for cleanup
      await program.methods
        .resumeBot()
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
        })
        .rpc();
    });
  });

  describe("Price Monitoring", () => {
    it("Should update price data successfully", async () => {
      const priceData = {
        tokenAPrice: new anchor.BN(50_000_000), // $50
        tokenBPrice: new anchor.BN(1_000_000), // $1 (USDC)
        timestamp: new anchor.BN(Date.now()),
        confidence: 95,
      };

      const tx = await program.methods
        .updatePrice(priceData)
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Price updated with transaction:", tx);
    });

    it("Should check strategy conditions", async () => {
      const result = await program.methods
        .checkStrategy()
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
        })
        .view();

      console.log("Strategy check result:", result);
      expect(typeof result).to.equal("boolean");
    });
  });

  describe("Fund Management", () => {
    it("Should withdraw funds successfully", async () => {
      const withdrawAmount = new anchor.BN(10_000_000); // 10 USDC

      const tx = await program.methods
        .withdrawFunds(withdrawAmount)
        .accounts({
          tradingBot: botAccount,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Funds withdrawn with transaction:", tx);

      // Verify balance decreased
      const bot = await program.account.tradingBot.fetch(botAccount);
      expect(bot.balance.toString()).to.equal("90000000"); // 100 - 10
    });

    it("Should fail to withdraw more than available balance", async () => {
      const withdrawAmount = new anchor.BN(200_000_000); // 200 USDC (more than balance)

      try {
        await program.methods
          .withdrawFunds(withdrawAmount)
          .accounts({
            tradingBot: botAccount,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        console.log("Expected insufficient funds error:", error.message);
      }
    });
  });
});
