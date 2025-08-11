import { Connection, Keypair, VersionedTransaction, PublicKey, Commitment } from '@solana/web3.js';
import { PriceFeedManager, PriceData } from './price-feeds';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

export interface TradingStrategy {
  tokenA: PublicKey; // e.g., SOL
  tokenB: PublicKey; // e.g., USDC  
  buyThreshold: number; // Price ratio threshold for buying
  sellThreshold: number; // Price ratio threshold for selling
  tradeAmount: number; // Amount to trade in lamports
  maxSlippage: number; // Max slippage in basis points (50 = 0.5%)
}

export class JupiterTradingBot {
  private connection: Connection;
  private authority: Keypair;
  private priceFeed: PriceFeedManager;
  private strategy: TradingStrategy;
  private isRunning: boolean = false;
  
  constructor(strategy: TradingStrategy) {
    this.connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
    
    // Load private key
    const privateKeyPath = process.env.PRIVATE_KEY_PATH!;
    const privateKeyData = JSON.parse(fs.readFileSync(privateKeyPath, 'utf8'));
    this.authority = Keypair.fromSecretKey(new Uint8Array(privateKeyData));
    
    this.priceFeed = new PriceFeedManager(this.connection);
    this.strategy = strategy;
    
    console.log(`🚀 Jupiter Trading Bot Initialized`);
    console.log(`📊 Wallet: ${this.authority.publicKey.toString()}`);
    console.log(`🌐 Network: ${this.connection.rpcEndpoint}`);
  }

  // Get wallet balance
  async getWalletBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.authority.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return 0;
    }
  }

  // Execute Jupiter swap according to official API documentation
  async executeJupiterSwap(amount: number, isBuy: boolean): Promise<string> {
    try {
      const inputMint = isBuy 
        ? this.strategy.tokenB.toString() // USDC when buying SOL
        : this.strategy.tokenA.toString(); // SOL when selling SOL
      const outputMint = isBuy
        ? this.strategy.tokenA.toString() // SOL when buying SOL  
        : this.strategy.tokenB.toString(); // USDC when selling SOL

      console.log(`🚀 JUPITER: Executing ${isBuy ? 'BUY' : 'SELL'} swap`);
      console.log(`💰 Amount: ${amount}`);
      console.log(`🔄 ${inputMint.substring(0,8)}... → ${outputMint.substring(0,8)}...`);

      // Step 1: Get Jupiter quote (official format)
      console.log(`🔍 Getting Jupiter quote...`);
      const quoteParams = new URLSearchParams({
        inputMint: inputMint,
        outputMint: outputMint,
        amount: amount.toString(),
        slippageBps: this.strategy.maxSlippage.toString(),
        swapMode: 'ExactIn',
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false'
      });

      const quoteUrl = `https://quote-api.jup.ag/v6/quote?${quoteParams}`;
      console.log(`📊 Quote API URL: ${quoteUrl}`);

      const quoteResponse = await fetch(quoteUrl);

      console.log(`📊 Quote API Response: ${quoteResponse.status} ${quoteResponse.statusText}`);
      console.log(`📊 Quote API Headers: ${JSON.stringify(Object.fromEntries(quoteResponse.headers))}`);

      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        console.error(`Quote API error: ${quoteResponse.status} - ${errorText}`);
        throw new Error(`Jupiter quote API error: ${quoteResponse.status}`);
      }

      const quote = await quoteResponse.json() as any;
      console.log(`📊 Quote received: ${JSON.stringify(quote, null, 2).substring(0, 200)}...`);

      if (!quote || !quote.outAmount) {
        throw new Error("Invalid quote response - missing outAmount");
      }

      console.log(`📊 Quote: ${amount} → ${quote.outAmount} (${((quote.outAmount / amount) * 100).toFixed(2)}% rate)`);

      // Step 2: Get swap transaction (official format)
      console.log(`🔍 Getting swap transaction...`);
      const swapRequestBody = {
        userPublicKey: this.authority.publicKey.toString(),
        quoteResponse: quote,
        wrapUnwrapSOL: true,           // Auto-wrap/unwrap SOL ✅
        createAta: true,               // Auto-create token accounts ✅  
        computeUnitPriceMicroLamports: 1000000, // 0.001 SOL priority fee
        asLegacyTransaction: false,
        dynamicComputeUnitLimit: true, // Better gas estimation
        skipUserAccountsRpcCalls: false // Ensure account validation
      };

      console.log(`📊 Swap request: ${JSON.stringify(swapRequestBody, null, 2).substring(0, 300)}...`);

      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapRequestBody)
      });

      console.log(`📊 Swap API Response: ${swapResponse.status} ${swapResponse.statusText}`);
      console.log(`📊 Swap API Headers: ${JSON.stringify(Object.fromEntries(swapResponse.headers))}`);

      if (!swapResponse.ok) {
        const errorText = await swapResponse.text();
        console.error(`Swap API error: ${swapResponse.status} - ${errorText}`);
        console.error(`Swap API full response: Status=${swapResponse.status}, StatusText=${swapResponse.statusText}`);
        throw new Error(`Jupiter swap API error: ${swapResponse.status} - ${errorText}`);
      }

      const swapData = await swapResponse.json() as any;
      console.log(`📊 Swap response keys: ${Object.keys(swapData).join(', ')}`);
      
      const { swapTransaction } = swapData;

      if (!swapTransaction) {
        console.error(`Missing swapTransaction in response: ${JSON.stringify(swapData)}`);
        throw new Error("Failed to get swap transaction from Jupiter API");
      }

      // Step 3: Deserialize and execute transaction
      console.log(`🔍 Deserializing transaction...`);
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      console.log(`📊 Transaction accounts: ${transaction.message.staticAccountKeys.length}`);

      // Sign transaction
      console.log(`✍️ Signing transaction...`);
      transaction.sign([this.authority]);

      // Send transaction with immediate submission
      console.log(`📤 Sending transaction immediately...`);
      
      const sendOptions = {
        skipPreflight: true,        // Skip preflight for faster submission
        preflightCommitment: 'processed' as Commitment,
        maxRetries: 3
      };

      const signature = await this.connection.sendTransaction(transaction, sendOptions);
      console.log(`📝 Transaction sent: ${signature}`);

      // Wait for confirmation with proper blockhash
      console.log(`⏳ Waiting for confirmation...`);
      
      // Get the latest blockhash for confirmation
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        console.error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log(`✅ ${isBuy ? 'BUY' : 'SELL'} COMPLETED!`);
      console.log(`🔗 https://solscan.io/tx/${signature}`);
      return signature;

    } catch (error: any) {
      console.error(`❌ Jupiter swap failed:`, error);
      if (error.logs) {
        console.error(`📋 Transaction logs:`, error.logs);
      }
      throw error;
    }
  }

  // Analyze market conditions and make trading decision
  async analyzeAndTrade(): Promise<void> {
    try {
      console.log(`\n📊 === Market Analysis ${new Date().toLocaleTimeString()} ===`);
      
      // Get current prices
      const priceData = await this.priceFeed.getComprehensivePriceData(
        this.strategy.tokenA,
        this.strategy.tokenB
      );

      if (!priceData || priceData.tokenAPrice === 0) {
        console.log('⚠️ Unable to get price data, skipping...');
        return;
      }

      // Calculate price ratio
      const priceRatio = (priceData.tokenAPrice * 10000) / priceData.tokenBPrice;
      
      console.log(`💲 SOL: $${priceData.tokenAPrice.toFixed(4)}`);
      console.log(`💲 USDC: $${priceData.tokenBPrice.toFixed(6)}`);
      console.log(`⚖️ Price Ratio: ${priceRatio.toFixed(2)}`);
      console.log(`🎯 Buy Threshold: ${this.strategy.buyThreshold}`);
      console.log(`🎯 Sell Threshold: ${this.strategy.sellThreshold}`);

      // Check wallet balance
      const walletBalance = await this.getWalletBalance();
      console.log(`💳 Wallet Balance: ${walletBalance.toFixed(4)} SOL`);

      // Make trading decision
      const shouldBuy = priceRatio <= this.strategy.buyThreshold;
      const shouldSell = priceRatio >= this.strategy.sellThreshold;

      if (shouldBuy && walletBalance > 0.01) {
        console.log(`\n🟢 BUY SIGNAL TRIGGERED!`);
        try {
          const txid = await this.executeJupiterSwap(this.strategy.tradeAmount, true);
          console.log(`✅ Buy completed: ${txid}`);
        } catch (error) {
          console.error(`❌ Buy failed: ${error}`);
        }
      } else if (shouldSell && walletBalance > 0.01) {
        console.log(`\n🔴 SELL SIGNAL TRIGGERED!`);
        try {
          const txid = await this.executeJupiterSwap(this.strategy.tradeAmount, false);
          console.log(`✅ Sell completed: ${txid}`);
        } catch (error) {
          console.error(`❌ Sell failed: ${error}`);
        }
      } else {
        console.log(`\n⏸️ No trading signal - Waiting...`);
        if (walletBalance <= 0.01) {
          console.log(`⚠️ Low SOL balance: ${walletBalance.toFixed(4)} SOL`);
        }
      }

    } catch (error) {
      console.error('❌ Analysis error:', error);
    }
  }

  // Start automated trading
  async startTrading(): Promise<void> {
    if (this.isRunning) {
      console.log('Bot is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Jupiter Trading Bot...');
    console.log('🔄 Will analyze market every 60 seconds');

    while (this.isRunning) {
      try {
        await this.analyzeAndTrade();
        
        if (this.isRunning) {
          console.log('⏳ Waiting 60 seconds...\n');
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      } catch (error) {
        console.error('❌ Trading loop error:', error);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    console.log('🛑 Trading bot stopped');
  }

  // Stop trading
  stopTrading(): void {
    this.isRunning = false;
    console.log('🛑 Stopping trading bot...');
  }

  // Test single trade
  async testTrade(amount: number, isBuy: boolean): Promise<string> {
    console.log(`🧪 TEST TRADE: ${isBuy ? 'Buy' : 'Sell'} ${amount} lamports`);
    return await this.executeJupiterSwap(amount, isBuy);
  }
}