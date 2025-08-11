#!/usr/bin/env node

import { JupiterTradingBot, TradingStrategy } from './src/jupiter-trading-bot';
import { PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

/**
 * Standalone Jupiter Trading Bot for Mainnet
 * - Direct Jupiter API integration
 * - No smart contracts required
 * - SOL/USDC trading
 */
class MainnetJupiterBot {
  private jupiterBot: JupiterTradingBot;
  private rl: readline.Interface;

  constructor() {
    console.log('🚀 Initializing Mainnet Jupiter Trading Bot...');
    
    // Configure strategy for SOL/USDC on mainnet
    const strategy: TradingStrategy = {
      tokenA: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
      tokenB: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
      buyThreshold: 1700000,  // Buy when SOL < $170.00 (be conservative)
      sellThreshold: 1800000, // Sell when SOL > $180.00
      tradeAmount: 10000000,  // 0.01 SOL (10M lamports) - small but meaningful
      maxSlippage: 50,        // 0.5% max slippage
    };

    this.jupiterBot = new JupiterTradingBot(strategy);
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('✅ Bot initialized for mainnet trading!');
    this.showMenu();
  }

  private showMenu(): void {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 MAINNET JUPITER TRADING BOT');
    console.log('='.repeat(50));
    console.log('1. 📊 Check Status & Balance');
    console.log('2. 🧪 Execute Test Trade (0.001 SOL)');
    console.log('3. 📈 View Current Prices');
    console.log('4. 🚀 Start Automated Trading');
    console.log('5. 🛑 Stop Trading');
    console.log('6. 📋 View Strategy');
    console.log('7. 🔧 Manual Trade');
    console.log('0. 🚪 Exit');
    console.log('='.repeat(50));
    console.log('⚠️  MAINNET - REAL MONEY!');
    console.log('='.repeat(50) + '\n');
    
    this.rl.question('Select option (0-7): ', (answer) => {
      this.handleMenuChoice(answer.trim());
    });
  }

  private async handleMenuChoice(choice: string): Promise<void> {
    try {
      switch (choice) {
        case '1':
          await this.checkStatus();
          break;
        case '2':
          await this.executeTestTrade();
          break;
        case '3':
          await this.viewPrices();
          break;
        case '4':
          await this.startTrading();
          break;
        case '5':
          this.stopTrading();
          break;
        case '6':
          this.viewStrategy();
          break;
        case '7':
          await this.manualTrade();
          break;
        case '0':
          this.exit();
          return;
        default:
          console.log('❌ Invalid choice. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
    
    this.showMenu();
  }

  private async checkStatus(): Promise<void> {
    console.log('\n📊 CHECKING BOT STATUS...\n');
    
    try {
      const balance = await this.jupiterBot.getWalletBalance();
      const rpcUrl = process.env.SOLANA_RPC_URL || 'Not configured';
      
      console.log('🤖 Bot Status: ✅ Ready');
      console.log(`🌐 Network: ${rpcUrl.includes('mainnet') ? 'Mainnet (LIVE)' : 'Other'}`);
      console.log(`💰 SOL Balance: ${balance.toFixed(6)} SOL`);
      console.log(`💵 USD Value: ~$${(balance * 170).toFixed(2)} (estimated)`);
      console.log('🎯 Strategy: SOL/USDC Jupiter Trading');
      console.log('📊 Buy Trigger: SOL < $170.00');
      console.log('📊 Sell Trigger: SOL > $180.00');
      console.log('💱 Trade Size: 0.01 SOL');
      console.log('⚡ Max Slippage: 0.5%');
      
      if (balance < 0.02) {
        console.log('\n⚠️  WARNING: Low SOL balance!');
        console.log('   Minimum recommended: 0.02 SOL');
        console.log('   Current balance: ' + balance.toFixed(6) + ' SOL');
      } else {
        console.log('\n✅ Ready to trade!');
      }
      
    } catch (error) {
      console.error('❌ Failed to get status:', error);
    }
  }

  private async executeTestTrade(): Promise<void> {
    console.log('\n🧪 EXECUTING TEST TRADE...\n');
    console.log('🚨 WARNING: This will execute a REAL trade on MAINNET!');
    console.log('💰 Amount: 0.001 SOL (~$0.17)');
    console.log('🔄 Action: SELL 0.001 SOL → USDC');
    console.log('⚡ Via: Jupiter API');
    
    const confirm = await this.askQuestion('\n❓ Are you sure? Type "YES" to confirm: ');
    
    if (confirm !== 'YES') {
      console.log('❌ Test trade cancelled.');
      return;
    }

    try {
      const balance = await this.jupiterBot.getWalletBalance();
      
      if (balance < 0.002) {
        console.log(`❌ Insufficient balance: ${balance.toFixed(6)} SOL`);
        console.log('   Need at least 0.002 SOL for test trade');
        return;
      }

      console.log('\n🔥 EXECUTING REAL TEST TRADE...');
      const txid = await this.jupiterBot.testTrade(1000000, false); // 0.001 SOL sell
      
      console.log('\n✅ TEST TRADE COMPLETED!');
      console.log(`📝 Transaction: ${txid}`);
      console.log(`🔗 Solscan: https://solscan.io/tx/${txid}`);
      console.log('💡 Jupiter integration working perfectly!');
      
    } catch (error) {
      console.error('❌ Test trade failed:', error);
    }
  }

  private async viewPrices(): Promise<void> {
    console.log('\n📈 FETCHING CURRENT PRICES...\n');
    
    try {
      // Trigger price analysis
      await this.jupiterBot.analyzeAndTrade();
    } catch (error) {
      console.error('❌ Failed to get prices:', error);
    }
  }

  private async startTrading(): Promise<void> {
    console.log('\n🚀 STARTING AUTOMATED TRADING...\n');
    console.log('🚨 WARNING: This will start automated trading on MAINNET!');
    console.log('💰 Real money will be traded automatically!');
    console.log('📊 Bot will analyze market every 60 seconds');
    console.log('🎯 Trades will execute when price conditions are met');
    
    const confirm = await this.askQuestion('\n❓ Start automated trading? Type "START" to confirm: ');
    
    if (confirm !== 'START') {
      console.log('❌ Automated trading cancelled.');
      return;
    }

    console.log('\n🔥 STARTING AUTOMATED TRADING...');
    console.log('📊 Monitoring SOL/USDC market...');
    console.log('🔄 Press Ctrl+C to stop trading\n');
    
    // Start trading (this will run indefinitely)
    this.jupiterBot.startTrading().catch(console.error);
    
    console.log('✅ Automated trading started!');
    console.log('🛑 Use option 5 to stop trading gracefully');
  }

  private stopTrading(): void {
    console.log('\n🛑 STOPPING AUTOMATED TRADING...\n');
    this.jupiterBot.stopTrading();
    console.log('✅ Automated trading stopped');
    console.log('📊 Bot is now inactive');
  }

  private viewStrategy(): void {
    console.log('\n📋 CURRENT TRADING STRATEGY\n');
    console.log('🎯 Type: SOL/USDC Jupiter Scalping');
    console.log('📊 Market: Mainnet (LIVE)');
    console.log('🟢 Buy Trigger: SOL price < $170.00');
    console.log('🔴 Sell Trigger: SOL price > $180.00');
    console.log('💰 Trade Size: 0.01 SOL (~$1.70)');
    console.log('📈 Profit Range: $10 spread');
    console.log('⚡ Max Slippage: 0.5%');
    console.log('🔄 Check Interval: 60 seconds');
    console.log('🏪 DEX: Jupiter Aggregator');
    console.log('⛽ Network: Solana Mainnet');
    console.log('\n💡 Conservative strategy for steady profits!');
  }

  private async manualTrade(): Promise<void> {
    console.log('\n🔧 MANUAL TRADE EXECUTION\n');
    
    const tradeType = await this.askQuestion('Trade type? (buy/sell): ');
    
    if (tradeType !== 'buy' && tradeType !== 'sell') {
      console.log('❌ Invalid trade type. Use "buy" or "sell".');
      return;
    }

    const amountStr = await this.askQuestion('Amount in SOL (e.g., 0.001): ');
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount <= 0) {
      console.log('❌ Invalid amount.');
      return;
    }

    const amountLamports = Math.floor(amount * 1e9);
    const isBuy = tradeType === 'buy';
    
    console.log(`\n🚨 MANUAL TRADE CONFIRMATION:`);
    console.log(`🔄 Action: ${isBuy ? 'BUY' : 'SELL'}`);
    console.log(`💰 Amount: ${amount} SOL`);
    console.log(`📊 Lamports: ${amountLamports}`);
    console.log(`🌐 Network: MAINNET (REAL MONEY!)`);
    
    const confirm = await this.askQuestion('\nConfirm manual trade? Type "EXECUTE": ');
    
    if (confirm !== 'EXECUTE') {
      console.log('❌ Manual trade cancelled.');
      return;
    }

    try {
      console.log('\n🔥 EXECUTING MANUAL TRADE...');
      const txid = await this.jupiterBot.testTrade(amountLamports, isBuy);
      
      console.log('\n✅ MANUAL TRADE COMPLETED!');
      console.log(`📝 Transaction: ${txid}`);
      console.log(`🔗 Solscan: https://solscan.io/tx/${txid}`);
      
    } catch (error) {
      console.error('❌ Manual trade failed:', error);
    }
  }

  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private exit(): void {
    console.log('\n👋 Shutting down Jupiter Trading Bot...');
    this.jupiterBot.stopTrading();
    this.rl.close();
    console.log('✅ Bot stopped. Goodbye!');
    process.exit(0);
  }
}

// Start the bot
if (require.main === module) {
  console.log('🎯 MAINNET JUPITER TRADING BOT');
  console.log('⚠️  REAL MONEY TRADING ON SOLANA MAINNET');
  console.log('🔧 Make sure your .env is configured!\n');
  
  new MainnetJupiterBot();
}