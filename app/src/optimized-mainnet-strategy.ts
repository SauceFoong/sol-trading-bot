import { Connection, Keypair, PublicKey, VersionedTransaction, Commitment } from '@solana/web3.js';
import { PriceFeedManager, PriceData } from './price-feeds';
import { MicroMeanReversionStrategy, MeanReversionSignal } from './mean-reversion-strategy';
import { RiskManager, RiskParameters, TradeRecord } from './risk-management';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

export interface OptimizedStrategy {
  // Dynamic thresholds based on volatility
  baseSpread: number;          // Base spread in dollars
  volatilityMultiplier: number; // Multiply spread by volatility
  minSpread: number;           // Minimum spread (e.g., $0.30)
  maxSpread: number;           // Maximum spread (e.g., $3.00)
  
  // Position sizing
  baseTradeAmount: number;     // Base trade amount in SOL
  maxPositionSize: number;     // Max position as % of balance
  volatilityAdjustment: boolean; // Reduce size in high volatility
  
  // Advanced timing
  momentumThreshold: number;   // Momentum filter
  volumeThreshold: number;     // Minimum volume requirement
  quickScalpMode: boolean;     // Enable 15-second scalping
}

export interface MarketConditions {
  volatility: number;          // Current volatility (%)
  momentum: number;           // Price momentum
  volume: number;             // Recent volume
  trend: 'up' | 'down' | 'sideways';
  confidence: number;
}

export class OptimizedMainnetTradingBot {
  private connection: Connection;
  private authority: Keypair;
  private priceFeed: PriceFeedManager;
  private meanRevStrategy: MicroMeanReversionStrategy;
  private riskManager: RiskManager;
  private strategy: OptimizedStrategy;
  private isRunning: boolean = false;
  private priceHistory: PriceData[] = [];
  
  // Fixed threshold tracking - SOLUTION TO MOVING THRESHOLD BUG
  private currentThresholds: { buyThreshold: number, sellThreshold: number, referencePrice: number, lastUpdated: number } | null = null;
  private thresholdUpdateInterval: number = 900000; // Update thresholds every 15 minutes, not every analysis
  
  // Performance tracking
  private trades: TradeRecord[] = [];
  private totalProfit: number = 0;
  private winRate: number = 0;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Load private key
    const privateKeyPath = process.env.PRIVATE_KEY_PATH || './id.json';
    const privateKeyData = JSON.parse(fs.readFileSync(privateKeyPath, 'utf8'));
    this.authority = Keypair.fromSecretKey(new Uint8Array(privateKeyData));
    
    this.priceFeed = new PriceFeedManager(this.connection);
    this.meanRevStrategy = new MicroMeanReversionStrategy(this.priceFeed, {
      dropThreshold: 0.12,        // Tighter: 0.12% instead of 0.15%
      bounceThreshold: 0.12,      // Tighter: 0.12% instead of 0.15%
      monitorWindowMs: 90000,     // Shorter: 1.5min instead of 2min
      maxPositionTimeMs: 240000,  // Shorter: 4min instead of 5min
      tradeAmountUsdc: 15,        // Larger: $15 instead of $10
      maxSlippageBps: 30,         // Tighter: 0.3% instead of 0.5%
      stopLossPercent: 0.8,       // Tighter: 0.8% instead of 1.0%
      takeProfitPercent: 0.4,     // Tighter: 0.4% instead of 0.5%
    });
    
    // Optimized strategy parameters
    this.strategy = {
      baseSpread: 0.50,           // $0.50 base spread
      volatilityMultiplier: 2.0,   // 2x volatility adjustment
      minSpread: 0.30,            // Min $0.30 spread
      maxSpread: 2.00,            // Max $2.00 spread
      baseTradeAmount: 0.08,      // 0.08 SOL (~$15)
      maxPositionSize: 15,        // 15% max position
      volatilityAdjustment: true,
      momentumThreshold: 0.05,    // 0.05% momentum filter
      volumeThreshold: 1000,      // Min volume
      quickScalpMode: true,       // Enable quick scalping
    };
    
    // Conservative but profitable risk parameters
    const riskParams: RiskParameters = {
      maxPositionSize: 15,         // 15% of balance max
      maxDailyLoss: 50,           // $50 max daily loss
      maxSlippage: 50,            // 0.5% max slippage
      cooldownPeriod: 15,         // 15 seconds between trades
      emergencyStopLoss: 5,       // 5% emergency stop
      maxDrawdown: 8,             // 8% max drawdown
      maxTradesPerDay: 200,       // Up to 200 trades/day
      minLiquidity: 1000,         // $1000 min liquidity
    };
    
    this.riskManager = new RiskManager(riskParams);
    
    console.log(`🚀 Optimized Mainnet Trading Bot Initialized`);
    console.log(`📊 Wallet: ${this.authority.publicKey.toString()}`);
    console.log(`🌐 Network: ${this.connection.rpcEndpoint}`);
    console.log(`🎯 Strategy: Dynamic Mean Reversion + Scalping`);
  }

  // Calculate FIXED thresholds based on reference price (FIXED VERSION)
  private calculateFixedThresholds(referencePrice: number, conditions: MarketConditions): { buyThreshold: number, sellThreshold: number } {
    let spread = this.strategy.baseSpread;
    
    // Adjust spread based on volatility
    spread *= (1 + conditions.volatility * this.strategy.volatilityMultiplier);
    
    // Clamp to min/max
    spread = Math.max(this.strategy.minSpread, Math.min(this.strategy.maxSpread, spread));
    
    // Reduce spread in sideways markets for more frequent trades
    if (conditions.trend === 'sideways' && conditions.volatility < 0.02) {
      spread *= 0.7; // 30% tighter spreads
    }
    
    // FIXED: Use reference price, not current moving price
    const buyThreshold = (referencePrice - spread / 2) * 10000; // Convert to format expected
    const sellThreshold = (referencePrice + spread / 2) * 10000;
    
    console.log(`🔧 FIXED THRESHOLDS: Ref Price $${referencePrice.toFixed(2)}, Spread $${spread.toFixed(2)}`);
    console.log(`🎯 Buy: $${(referencePrice - spread / 2).toFixed(2)} | Sell: $${(referencePrice + spread / 2).toFixed(2)}`);
    
    return { buyThreshold, sellThreshold };
  }

  // Get or update fixed thresholds (only updates every 5 minutes or when needed)
  private getFixedThresholds(currentPrice: number, conditions: MarketConditions): { buyThreshold: number, sellThreshold: number } {
    const now = Date.now();
    
    // Initialize thresholds on first run
    if (!this.currentThresholds) {
      console.log(`🚀 INITIALIZING FIXED THRESHOLDS with reference price $${currentPrice.toFixed(2)}`);
      const thresholds = this.calculateFixedThresholds(currentPrice, conditions);
      this.currentThresholds = {
        buyThreshold: thresholds.buyThreshold,
        sellThreshold: thresholds.sellThreshold,
        referencePrice: currentPrice,
        lastUpdated: now
      };
      return thresholds;
    }
    
    // Check if we need to update thresholds (every 5 minutes OR significant market change)
    const timeSinceUpdate = now - this.currentThresholds.lastUpdated;
    const priceChangePercent = Math.abs(currentPrice - this.currentThresholds.referencePrice) / this.currentThresholds.referencePrice;
    
    if (timeSinceUpdate > this.thresholdUpdateInterval || priceChangePercent > 0.05) {
      console.log(`🔄 UPDATING FIXED THRESHOLDS: Time=${(timeSinceUpdate/60000).toFixed(1)}min, PriceChange=${(priceChangePercent*100).toFixed(2)}%`);
      console.log(`📊 Old Ref: $${this.currentThresholds.referencePrice.toFixed(2)} → New Ref: $${currentPrice.toFixed(2)}`);
      
      const thresholds = this.calculateFixedThresholds(currentPrice, conditions);
      this.currentThresholds = {
        buyThreshold: thresholds.buyThreshold,
        sellThreshold: thresholds.sellThreshold,
        referencePrice: currentPrice,
        lastUpdated: now
      };
      return thresholds;
    }
    
    // Return existing fixed thresholds (most common case)
    return {
      buyThreshold: this.currentThresholds.buyThreshold,
      sellThreshold: this.currentThresholds.sellThreshold
    };
  }

  // Analyze current market conditions
  private analyzeMarketConditions(priceData: PriceData): MarketConditions {
    if (this.priceHistory.length < 10) {
      return {
        volatility: 0.015,
        momentum: 0,
        volume: 1000,
        trend: 'sideways',
        confidence: 50
      };
    }
    
    const prices = this.priceHistory.slice(-10).map(p => p.tokenAPrice);
    const currentPrice = priceData.tokenAPrice;
    
    // Calculate volatility (standard deviation of returns)
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    
    // Calculate momentum (price change over last 5 minutes)
    const fiveMinAgo = this.priceHistory[Math.max(0, this.priceHistory.length - 5)];
    const momentum = fiveMinAgo ? (currentPrice - fiveMinAgo.tokenAPrice) / fiveMinAgo.tokenAPrice : 0;
    
    // Determine trend
    let trend: 'up' | 'down' | 'sideways' = 'sideways';
    if (momentum > 0.002) trend = 'up';        // > 0.2% up
    else if (momentum < -0.002) trend = 'down'; // > 0.2% down
    
    return {
      volatility: volatility * 100, // Convert to percentage
      momentum: momentum * 100,
      volume: 1000, // Placeholder - would need DEX volume data
      trend,
      confidence: Math.min(95, 50 + this.priceHistory.length * 2)
    };
  }

  // Calculate optimal position size based on conditions
  private calculatePositionSize(conditions: MarketConditions, walletBalance: number): number {
    let size = this.strategy.baseTradeAmount;
    
    // Reduce size in high volatility
    if (this.strategy.volatilityAdjustment && conditions.volatility > 3) {
      size *= (1 - Math.min(0.5, conditions.volatility / 10)); // Reduce up to 50%
    }
    
    // Ensure we don't exceed position size limits
    const maxSize = (walletBalance * this.strategy.maxPositionSize / 100);
    size = Math.min(size, maxSize);
    
    return size;
  }

  // Execute optimized Jupiter swap with better routing
  private async executeOptimizedSwap(amount: number, isBuy: boolean, slippageBps: number = 100): Promise<string> {
    try {
      const inputMint = isBuy 
        ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC
        : 'So11111111111111111111111111111111111111112';  // SOL
      const outputMint = isBuy
        ? 'So11111111111111111111111111111111111111112'  // SOL
        : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

      console.log(`🚀 OPTIMIZED SWAP: ${isBuy ? 'BUY' : 'SELL'} ${amount} lamports`);

      // Get Jupiter quote with optimized parameters
      const quoteParams = new URLSearchParams({
        inputMint: inputMint,
        outputMint: outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
        swapMode: 'ExactIn',
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false',
        maxAccounts: '20',          // Fewer accounts for more stable execution
        restrictIntermediateTokens: 'true'  // Use only well-known tokens for routing
      });

      const quoteUrl = `https://quote-api.jup.ag/v6/quote?${quoteParams}`;
      const quoteResponse = await fetch(quoteUrl);

      if (!quoteResponse.ok) {
        throw new Error(`Quote API error: ${quoteResponse.status}`);
      }

      const quote = await quoteResponse.json() as any;
      console.log(`💎 Quote: ${amount} → ${quote.outAmount} (${((quote.outAmount / amount) * 100).toFixed(2)}% rate)`);

      // Get swap transaction with priority fee (FIXED: only one fee parameter)
      const swapRequestBody = {
        userPublicKey: this.authority.publicKey.toString(),
        quoteResponse: quote,
        wrapUnwrapSOL: true,
        createAta: true,
        computeUnitPriceMicroLamports: 1000000, // Priority fee: 0.001 SOL (FIXED: removed duplicate)
        asLegacyTransaction: false,
        dynamicComputeUnitLimit: true,
        skipUserAccountsRpcCalls: false,
      };

      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapRequestBody)
      });

      if (!swapResponse.ok) {
        const errorText = await swapResponse.text();
        throw new Error(`Swap API error: ${swapResponse.status} - ${errorText}`);
      }

      const swapData = await swapResponse.json() as any;
      const transaction = VersionedTransaction.deserialize(Buffer.from(swapData.swapTransaction, 'base64'));

      // Sign and send with optimized settings
      transaction.sign([this.authority]);

      const sendOptions = {
        skipPreflight: true,            // Skip preflight to avoid simulation errors
        preflightCommitment: 'processed' as Commitment,
        maxRetries: 3                   // Fewer retries but faster
      };

      const signature = await this.connection.sendTransaction(transaction, sendOptions);
      
      // Confirm transaction
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log(`✅ ${isBuy ? 'BUY' : 'SELL'} COMPLETED: ${signature}`);
      return signature;

    } catch (error: any) {
      console.error(`❌ Optimized swap failed:`, error);
      throw error;
    }
  }

  // Main trading analysis with multiple strategies
  async analyzeAndExecute(): Promise<void> {
    try {
      console.log(`\n📊 === OPTIMIZED ANALYSIS ${new Date().toLocaleTimeString()} ===`);
      
      // Get fresh price data
      const priceData = await this.priceFeed.getComprehensivePriceData(
        new PublicKey('So11111111111111111111111111111111111111112'), // SOL
        new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')  // USDC
      );

      if (!priceData || priceData.tokenAPrice === 0) {
        console.log('⚠️ Unable to get price data');
        return;
      }

      // Update price history
      this.priceHistory.push(priceData);
      if (this.priceHistory.length > 50) {
        this.priceHistory = this.priceHistory.slice(-50);
      }

      // Analyze market conditions
      const conditions = this.analyzeMarketConditions(priceData);
      console.log(`🌊 Volatility: ${conditions.volatility.toFixed(2)}%`);
      console.log(`⚡ Momentum: ${conditions.momentum.toFixed(2)}%`);
      console.log(`📈 Trend: ${conditions.trend.toUpperCase()}`);

      // Get wallet balance
      const walletBalance = await this.getWalletBalance();
      console.log(`💳 Balance: ${walletBalance.toFixed(4)} SOL`);

      // Strategy 1: Mean Reversion Micro-Scalping
      const meanRevSignal = this.meanRevStrategy.analyzeSignal(priceData);
      console.log(`🎯 Mean Reversion: ${meanRevSignal.type.toUpperCase()} - ${meanRevSignal.reason}`);

      // Strategy 2: FIXED Threshold Trading (BUG FIXED)
      const thresholds = this.getFixedThresholds(priceData.tokenAPrice, conditions);
      const priceRatio = (priceData.tokenAPrice * 10000) / priceData.tokenBPrice;
      console.log(`⚖️ Price Ratio: ${priceRatio.toFixed(2)} | FIXED Buy: ${thresholds.buyThreshold.toFixed(0)} | FIXED Sell: ${thresholds.sellThreshold.toFixed(0)}`);

      // Calculate position size
      const positionSize = this.calculatePositionSize(conditions, walletBalance);
      const positionLamports = Math.floor(positionSize * 1e9);

      // Emergency stop check
      if (this.riskManager.shouldEmergencyStop()) {
        console.log('🚨 EMERGENCY STOP TRIGGERED - No trading');
        return;
      }

      // Execute trades based on signals
      let executeAction: 'buy' | 'sell' | 'none' = 'none';
      let reason = '';

      // Priority 1: Mean reversion signals (highest priority)
      if (meanRevSignal.type !== 'none' && meanRevSignal.confidence > 70) {
        executeAction = meanRevSignal.type;
        reason = `Mean Reversion (${meanRevSignal.confidence}%): ${meanRevSignal.reason}`;
      }
      // Priority 2: Dynamic threshold signals
      else if (priceRatio <= thresholds.buyThreshold && conditions.trend !== 'down') {
        executeAction = 'buy';
        reason = `Dynamic Threshold BUY: Ratio ${priceRatio.toFixed(2)} <= ${thresholds.buyThreshold.toFixed(2)}`;
      }
      else if (priceRatio >= thresholds.sellThreshold && conditions.trend !== 'up') {
        executeAction = 'sell';
        reason = `Dynamic Threshold SELL: Ratio ${priceRatio.toFixed(2)} >= ${thresholds.sellThreshold.toFixed(2)}`;
      }

      // Risk assessment
      if (executeAction !== 'none') {
        const targetPrice = executeAction === 'buy' ? priceData.tokenAPrice * 0.999 : priceData.tokenAPrice * 1.001;
        const riskAssessment = this.riskManager.assessTradeRisk(
          positionSize * priceData.tokenAPrice, // Trade amount in USD
          priceData.tokenAPrice,
          targetPrice,
          walletBalance * priceData.tokenAPrice, // Portfolio value in USD  
          100 // slippage bps (updated)
        );

        console.log(`🎲 Risk Score: ${riskAssessment.riskScore}/100 - ${riskAssessment.approved ? 'APPROVED' : 'REJECTED'}`);
        
        if (riskAssessment.approved && walletBalance > 0.01) {
          console.log(`\n🎯 ${executeAction.toUpperCase()} SIGNAL: ${reason}`);
          console.log(`💰 Position: ${positionSize.toFixed(4)} SOL (~$${(positionSize * priceData.tokenAPrice).toFixed(2)})`);
          
          try {
            const txid = await this.executeOptimizedSwap(
              positionLamports, 
              executeAction === 'buy',
              100 // 1.0% slippage for better execution reliability
            );
            
            // Record successful trade in performance tracking
            const tradeRecord = {
              timestamp: Date.now(),
              tradeType: executeAction as 'buy' | 'sell',
              amount: positionSize,
              price: priceData.tokenAPrice,
              slippage: 100, // 1.0% slippage used
              pnl: 0, // Will be calculated later when position closes
              portfolioValue: walletBalance * priceData.tokenAPrice,
              gasUsed: 0.001 // Estimated gas fee in SOL
            };
            
            // Add to trade history
            this.trades.push(tradeRecord);
            console.log(`📈 TRADE RECORDED: #${this.trades.length} ${executeAction.toUpperCase()}`);
            
            // Also record in mean reversion strategy
            if (executeAction === 'buy') {
              this.meanRevStrategy.executeBuy(priceData.tokenAPrice);
            } else {
              const result = this.meanRevStrategy.executeSell(priceData.tokenAPrice, reason);
              console.log(`📊 Trade P&L: ${result.profit >= 0 ? '+' : ''}${result.profit.toFixed(2)}% | Hold: ${(result.holdTime/1000).toFixed(0)}s`);
              
              // Update the trade record with actual P&L
              if (this.trades.length > 0) {
                this.trades[this.trades.length - 1].pnl = result.profit;
                this.totalProfit += (result.profit / 100) * (positionSize * priceData.tokenAPrice); // Convert % to USD
              }
            }
            
            // Also record with risk manager
            this.riskManager.recordTrade(tradeRecord);
            
            console.log(`✅ ${executeAction.toUpperCase()} COMPLETED: ${txid}`);
            console.log(`🔗 https://solscan.io/tx/${txid}`);
            
          } catch (error) {
            console.error(`❌ ${executeAction.toUpperCase()} FAILED:`, error);
          }
        } else {
          console.log(`\n❌ Trade BLOCKED: ${riskAssessment.reasoning.join(', ')}`);
        }
      } else {
        console.log(`\n⏸️ No trading signals - Market conditions: ${conditions.trend}, Vol: ${conditions.volatility.toFixed(2)}%`);
      }

    } catch (error) {
      console.error('❌ Analysis error:', error);
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.authority.publicKey);
      return balance / 1e9;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return 0;
    }
  }

  // Start optimized trading
  async startOptimizedTrading(): Promise<void> {
    if (this.isRunning) {
      console.log('Bot is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Optimized Mainnet Trading Bot...');
    console.log('⚡ Analysis interval: 30 seconds for quick scalping');
    console.log('🎯 Multiple strategies: Mean Reversion + Dynamic Thresholds');

    while (this.isRunning) {
      try {
        await this.analyzeAndExecute();
        
        if (this.isRunning) {
          const waitTime = this.strategy.quickScalpMode ? 15000 : 30000; // 15s or 30s
          console.log(`⏳ Waiting ${waitTime/1000}s...\n`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (error) {
        console.error('❌ Trading loop error:', error);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    console.log('🛑 Optimized trading bot stopped');
  }

  // Stop trading
  stopTrading(): void {
    this.isRunning = false;
    console.log('🛑 Stopping optimized trading bot...');
  }

  // Get performance metrics
  getPerformanceMetrics(): {
    totalTrades: number;
    totalProfit: number;
    winRate: number;
    avgTradeTime: number;
    dailyStats: any;
  } {
    const riskReport = this.riskManager.getRiskReport();
    
    // Calculate win rate from completed trades
    let winningTrades = 0;
    let avgTradeTime = 0;
    
    if (this.trades.length > 0) {
      winningTrades = this.trades.filter(trade => trade.pnl > 0).length;
      this.winRate = winningTrades / this.trades.length;
      
      // Calculate average trade time (simplified)
      avgTradeTime = this.trades.length > 1 ? 240 : 0; // 4 minutes average hold time
    }
    
    return {
      totalTrades: this.trades.length,
      totalProfit: this.totalProfit,
      winRate: this.winRate,
      avgTradeTime,
      dailyStats: riskReport.dailyStats
    };
  }
}