#!/usr/bin/env node

import { Telegraf, Context } from 'telegraf';
import { JupiterTradingBot, TradingStrategy } from './src/jupiter-trading-bot';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

/**
 * Mainnet Jupiter Trading Bot via Telegram
 * Connects to your specific mainnet wallet: BxmSEddwE1jBFVSXnsvDsujgjBh2GK2jhrzpZLJJidrG
 */
export class MainnetTelegramBot {
  private bot: Telegraf;
  private jupiterBot: JupiterTradingBot;
  private connection: Connection;
  private targetWallet: PublicKey;
  private allowedUsers: Set<string>;
  private isTrading: boolean = false;

  constructor() {
    console.log('🚀 Initializing Mainnet Jupiter Telegram Bot...');
    
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    this.targetWallet = new PublicKey('BxmSEddwE1jBFVSXnsvDsujgjBh2GK2jhrzpZLJJidrG');
    this.allowedUsers = new Set(process.env.TELEGRAM_ALLOWED_USERS?.split(',') || []);

    // Mainnet SOL/USDC strategy - Conservative for real money
    const strategy: TradingStrategy = {
      tokenA: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
      tokenB: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
      buyThreshold: 1650000,  // Buy when SOL < $165.00 (conservative)
      sellThreshold: 1750000, // Sell when SOL > $175.00 (conservative)  
      tradeAmount: 5000000,   // 0.005 SOL (~$0.85) - small but meaningful
      maxSlippage: 100,       // 1.0% slippage (higher for better fills)
    };

    this.jupiterBot = new JupiterTradingBot(strategy);
    
    this.setupMiddleware();
    this.setupCommands();
    
    console.log(`✅ Bot configured for mainnet wallet: ${this.targetWallet.toString()}`);
  }

  private setupMiddleware() {
    this.bot.use((ctx, next) => {
      const userId = ctx.from?.id.toString();
      if (this.allowedUsers.size === 0 || (userId && this.allowedUsers.has(userId))) {
        return next();
      }
      ctx.reply('❌ Unauthorized access');
    });
  }

  private setupCommands() {
    this.bot.start((ctx) => {
      ctx.reply(
        '🚀 MAINNET JUPITER TRADING BOT\n' +
        '💰 Real Money Trading on Solana!\n\n' +
        '🎯 Your Wallet: BxmSE...idrG\n' + 
        '🌐 Network: Mainnet Beta\n' +
        '💱 Pair: SOL/USDC via Jupiter\n\n' +
        '📋 Commands:\n' +
        '/status - Check wallet & bot status\n' +
        '/balance - View SOL balance\n' +
        '/prices - Current SOL/USDC prices\n' +
        '/strategy - View trading strategy\n' +
        '/test - Execute tiny test trade\n' +
        '/start_trading - Start automated trading\n' +
        '/stop_trading - Stop trading\n' +
        '/manual_buy - Manual buy order\n' +
        '/manual_sell - Manual sell order\n\n' +
        '⚠️ MAINNET - REAL MONEY!'
      );
    });

    this.bot.command('status', async (ctx) => {
      try {
        const balance = await this.getWalletBalance();
        const currentWallet = await this.getCurrentWalletAddress();
        
        ctx.reply(
          `📊 MAINNET BOT STATUS\n\n` +
          `🎯 Target Wallet: ${this.targetWallet.toString()}\n` +
          `🔑 Current Wallet: ${currentWallet}\n` +
          `💰 Balance: ${balance.toFixed(6)} SOL\n` +
          `💵 USD Value: ~$${(balance * 170).toFixed(2)}\n` +
          `🌐 Network: Mainnet Beta\n` +
          `🤖 Trading: ${this.isTrading ? '🟢 ACTIVE' : '🔴 STOPPED'}\n` +
          `🎯 Strategy: Conservative SOL/USDC\n` +
          `📊 Buy: SOL < $165.00\n` +
          `📊 Sell: SOL > $175.00\n` +
          `💱 Size: 0.005 SOL per trade\n\n` +
          `${balance < 0.01 ? '⚠️ Low balance - Add SOL!' : '✅ Ready to trade!'}`
        );
      } catch (error) {
        ctx.reply(`❌ Status error: ${error}`);
      }
    });

    this.bot.command('balance', async (ctx) => {
      try {
        const balance = await this.getWalletBalance();
        const lamports = await this.connection.getBalance(this.targetWallet);
        
        ctx.reply(
          `💰 WALLET BALANCE\n\n` +
          `🎯 Address: ${this.targetWallet.toString()}\n` +
          `💎 Balance: ${balance.toFixed(6)} SOL\n` +
          `⚡ Lamports: ${lamports.toLocaleString()}\n` +
          `💵 USD Value: ~$${(balance * 170).toFixed(2)}\n` +
          `🔥 Available for trading: ${Math.max(0, balance - 0.01).toFixed(6)} SOL\n\n` +
          `${balance > 0.01 ? '✅ Sufficient for trading' : '⚠️ Need more SOL'}`
        );
      } catch (error) {
        ctx.reply(`❌ Balance check failed: ${error}`);
      }
    });

    this.bot.command('prices', async (ctx) => {
      try {
        ctx.reply('📊 Fetching live SOL/USDC prices...');
        
        // Trigger price analysis
        await this.jupiterBot.analyzeAndTrade();
        
        ctx.reply(
          '📈 Price analysis complete!\n' +
          'Check console for detailed price info.\n\n' +
          '💡 Tip: Use /status to see if trading conditions are met'
        );
      } catch (error) {
        ctx.reply(`❌ Price fetch failed: ${error}`);
      }
    });

    this.bot.command('strategy', (ctx) => {
      ctx.reply(
        '🎯 MAINNET TRADING STRATEGY\n\n' +
        '📊 Type: Conservative SOL/USDC Scalping\n' +
        '🟢 Buy Signal: SOL price < $165.00\n' +
        '🔴 Sell Signal: SOL price > $175.00\n' +
        '💰 Trade Size: 0.005 SOL (~$0.85)\n' +
        '📈 Profit Target: $10 spread\n' +
        '⚡ Max Slippage: 1.0%\n' +
        '🔄 Check Interval: 60 seconds\n' +
        '🏪 DEX: Jupiter Aggregator\n' +
        '🌐 Network: Solana Mainnet\n\n' +
        '💡 Conservative approach for steady gains!'
      );
    });

    this.bot.command('test', async (ctx) => {
      try {
        const balance = await this.getWalletBalance();
        
        // Get token balances to decide what to trade
        const tokenBalances = await this.getTokenBalances();
        const usdcBalance = tokenBalances.get('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') || 0;
        
        console.log(`💰 SOL: ${balance.toFixed(6)}, USDC: ${usdcBalance.toFixed(6)}`);
        
        // Decide what to trade based on balances
        let isBuy = false; // Default: sell SOL
        let tradeAmount = 5000000; // 0.005 SOL
        let tradeDescription = '';
        
        if (usdcBalance > 0.5 && balance < 0.02) {
          // Has USDC but low SOL - buy SOL with USDC
          isBuy = true;
          tradeAmount = Math.floor(usdcBalance * 1000000 / 2); // Use half of USDC (in micro-USDC)
          tradeDescription = `🟢 BUYING: ${(tradeAmount / 1000000).toFixed(3)} USDC worth of SOL`;
        } else if (balance > 0.01) {
          // Has SOL - sell for USDC  
          isBuy = false;
          tradeAmount = 5000000; // 0.005 SOL
          tradeDescription = `🔴 SELLING: 0.005 SOL → USDC`;
        } else {
          ctx.reply(
            `❌ INSUFFICIENT BALANCE\n\n` +
            `💳 SOL: ${balance.toFixed(6)}\n` +
            `💳 USDC: ${usdcBalance.toFixed(6)}\n` +
            `📋 Need: 0.01 SOL OR 0.5 USDC minimum\n`
          );
          return;
        }

        ctx.reply(
          '🧪 EXECUTING SMART TEST TRADE\n\n' +
          `${tradeDescription}\n` +
          `💰 Value: ~$0.85 (safe amount!)\n` +
          '⚡ Via: Jupiter API\n' +
          '🌐 Network: MAINNET\n\n' +
          '⏳ Processing...'
        );

        // Execute the smart test trade
        const txid = await this.jupiterBot.testTrade(tradeAmount, isBuy);
        
        ctx.reply(
          '✅ TEST TRADE COMPLETED!\n\n' +
          '🔴 Sold: 0.01 SOL → USDC\n' +
          `📝 Transaction: ${txid}\n\n` +
          '🔗 View on Solscan:\n' +
          `https://solscan.io/tx/${txid}\n\n` +
          '🎉 Jupiter integration working perfectly!\n' +
          '💡 Ready for automated trading!'
        );

      } catch (error: any) {
        ctx.reply(
          '❌ TEST TRADE FAILED\n\n' +
          `🚨 Error: ${error.message}\n\n` +
          '💡 Try again or check wallet balance'
        );
      }
    });

    this.bot.command('start_trading', async (ctx) => {
      if (this.isTrading) {
        ctx.reply('⚠️ Trading is already active!\nUse /stop_trading to stop.');
        return;
      }

      try {
        const balance = await this.getWalletBalance();
        
        if (balance < 0.01) {
          ctx.reply(
            `❌ INSUFFICIENT BALANCE\n\n` +
            `💳 Current: ${balance.toFixed(6)} SOL\n` +
            `📋 Need: 0.01 SOL minimum\n` +
            `💰 Add more SOL to start trading`
          );
          return;
        }

        this.isTrading = true;
        
        ctx.reply(
          '🚀 STARTING MAINNET TRADING!\n\n' +
          '⚡ Jupiter API Integration Active\n' +
          '📊 SOL/USDC Conservative Strategy\n' +
          '🎯 $165 - $175 trading range\n' +
          '💰 0.005 SOL per trade\n' +
          '🔄 Monitoring every 60 seconds\n\n' +
          '🚨 REAL MONEY TRADING ACTIVE!\n' +
          '📱 Monitor this chat for updates'
        );

        // Start trading in background
        this.startTradingLoop(ctx);

      } catch (error) {
        ctx.reply(`❌ Failed to start trading: ${error}`);
      }
    });

    this.bot.command('stop_trading', (ctx) => {
      if (!this.isTrading) {
        ctx.reply('ℹ️ Trading is not currently active.');
        return;
      }

      this.isTrading = false;
      this.jupiterBot.stopTrading();
      
      ctx.reply(
        '🛑 TRADING STOPPED\n\n' +
        '✅ All automated trading halted\n' +
        '📊 Bot status: Inactive\n' +
        '💰 Funds remain in wallet\n\n' +
        'Use /start_trading to resume'
      );
    });

    this.bot.command('manual_buy', async (ctx) => {
      try {
        const balance = await this.getWalletBalance();
        
        ctx.reply(
          '🟢 MANUAL BUY ORDER\n\n' +
          '💰 Will buy: 0.005 SOL worth of SOL\n' +
          '💵 Using: USDC from previous sales\n' +
          '⚡ Via: Jupiter API\n\n' +
          '⚠️ REAL MAINNET TRANSACTION!'
        );

        const txid = await this.jupiterBot.testTrade(5000000, true); // 0.005 SOL buy
        
        ctx.reply(
          '✅ MANUAL BUY COMPLETED!\n\n' +
          '🟢 Bought: SOL with USDC\n' +
          `📝 TX: ${txid}\n` +
          `🔗 https://solscan.io/tx/${txid}`
        );

      } catch (error: any) {
        ctx.reply(`❌ Manual buy failed: ${error.message}`);
      }
    });

    this.bot.command('manual_sell', async (ctx) => {
      try {
        const balance = await this.getWalletBalance();
        
        if (balance < 0.006) {
          ctx.reply(`❌ Insufficient SOL: ${balance.toFixed(6)} SOL`);
          return;
        }

        ctx.reply(
          '🔴 MANUAL SELL ORDER\n\n' +
          '💰 Will sell: 0.005 SOL → USDC\n' +
          '⚡ Via: Jupiter API\n\n' +
          '⚠️ REAL MAINNET TRANSACTION!'
        );

        const txid = await this.jupiterBot.testTrade(5000000, false); // 0.005 SOL sell
        
        ctx.reply(
          '✅ MANUAL SELL COMPLETED!\n\n' +
          '🔴 Sold: 0.005 SOL → USDC\n' +
          `📝 TX: ${txid}\n` +
          `🔗 https://solscan.io/tx/${txid}`
        );

      } catch (error: any) {
        ctx.reply(`❌ Manual sell failed: ${error.message}`);
      }
    });
  }

  private async startTradingLoop(ctx: Context): Promise<void> {
    console.log('🚀 Starting mainnet trading loop...');
    
    let cycleCount = 0;
    
    while (this.isTrading) {
      try {
        cycleCount++;
        console.log(`\n🔄 Trading Cycle ${cycleCount} - ${new Date().toLocaleTimeString()}`);
        
        // Run analysis and potentially execute trades
        await this.jupiterBot.analyzeAndTrade();
        
        // Send periodic status updates to Telegram
        if (cycleCount % 10 === 0) { // Every 10 minutes
          const balance = await this.getWalletBalance();
          ctx.reply(
            `📊 Trading Update #${cycleCount}\n\n` +
            `💰 Balance: ${balance.toFixed(6)} SOL\n` +
            `🕐 Time: ${new Date().toLocaleTimeString()}\n` +
            `🤖 Status: Monitoring market...`
          );
        }
        
        // Wait 60 seconds before next check
        if (this.isTrading) {
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
        
      } catch (error) {
        console.error('❌ Trading loop error:', error);
        ctx.reply(`⚠️ Trading error: ${error}`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s on error
      }
    }
    
    console.log('🛑 Trading loop stopped');
  }

  private async getWalletBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.targetWallet);
      return balance / 1e9;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return 0;
    }
  }

  private async getTokenBalances(): Promise<Map<string, number>> {
    try {
      const { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
      const balances = new Map<string, number>();
      
      // Check USDC balance
      const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      try {
        const usdcTokenAccount = await getAssociatedTokenAddress(USDC_MINT, this.targetWallet);
        const usdcAccount = await getAccount(this.connection, usdcTokenAccount);
        balances.set(USDC_MINT.toString(), Number(usdcAccount.amount) / 1000000); // USDC has 6 decimals
      } catch (error) {
        balances.set(USDC_MINT.toString(), 0);
      }
      
      return balances;
    } catch (error) {
      console.error('Failed to get token balances:', error);
      return new Map();
    }
  }

  private async getCurrentWalletAddress(): Promise<string> {
    try {
      // Get the wallet address from the bot's keypair
      const privateKeyData = JSON.parse(fs.readFileSync('./id.json', 'utf8'));
      const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyData));
      return keypair.publicKey.toString();
    } catch (error) {
      return 'Unable to read current wallet';
    }
  }

  async launch(): Promise<void> {
    console.log('🚀 Starting Mainnet Jupiter Telegram Bot...');
    console.log(`🎯 Target Wallet: ${this.targetWallet.toString()}`);
    
    await this.bot.launch();

    // Graceful shutdown
    process.once('SIGINT', () => {
      this.isTrading = false;
      this.bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      this.isTrading = false;
      this.bot.stop('SIGTERM');
    });

    console.log('✅ Mainnet Telegram bot is running!');
  }

  stop(): void {
    this.isTrading = false;
    this.jupiterBot.stopTrading();
    this.bot.stop();
  }
}

// Start the bot if run directly
if (require.main === module) {
  async function main() {
    console.log('🎯 MAINNET JUPITER TELEGRAM BOT');
    console.log('⚠️ REAL MONEY TRADING ON SOLANA MAINNET');
    console.log('🔧 Connecting to wallet: BxmSEddwE1jBFVSXnsvDsujgjBh2GK2jhrzpZLJJidrG\n');
    
    const bot = new MainnetTelegramBot();
    
    try {
      await bot.launch();
    } catch (error) {
      console.error('❌ Failed to start mainnet bot:', error);
      process.exit(1);
    }
  }

  main().catch(console.error);
}