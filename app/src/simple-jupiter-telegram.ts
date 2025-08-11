import { Telegraf, Context } from 'telegraf';
import { JupiterTradingBot, TradingStrategy } from './jupiter-trading-bot';
import { PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

export class SimpleJupiterTelegramBot {
  private bot: Telegraf;
  private jupiterBot: JupiterTradingBot;
  private allowedUsers: Set<string>;

  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    this.allowedUsers = new Set(process.env.TELEGRAM_ALLOWED_USERS?.split(',') || []);

    // Default strategy: SOL/USDC micro scalping
    const strategy: TradingStrategy = {
      tokenA: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
      tokenB: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
      buyThreshold: 1750000,  // Buy when SOL < $175.00
      sellThreshold: 1800000, // Sell when SOL > $180.00
      tradeAmount: 1000000,   // 0.001 SOL (1M lamports) for safety
      maxSlippage: 50,        // 0.5% max slippage
    };

    this.jupiterBot = new JupiterTradingBot(strategy);
    
    this.setupCommands();
    this.setupMiddleware();
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
        '🚀 Jupiter Trading Bot - MAINNET LIVE!\n\n' +
        '📋 Commands:\n' +
        '/status - Check bot status and balance\n' +
        '/testtrade - Execute tiny test trade (0.001 SOL)\n' +
        '/start_trading - Start automated trading\n' +
        '/stop_trading - Stop automated trading\n' +
        '/strategy - View current strategy\n\n' +
        '⚠️ MAINNET - REAL MONEY!'
      );
    });

    this.bot.command('status', async (ctx) => {
      try {
        const balance = await this.jupiterBot.getWalletBalance();
        
        ctx.reply(
          `📊 Jupiter Trading Bot Status\n\n` +
          `🌐 Network: Mainnet (LIVE)\n` +
          `💰 Balance: ${balance.toFixed(4)} SOL\n` +
          `🎯 Strategy: SOL/USDC Scalping\n` +
          `📊 Buy: SOL < $175.00\n` +
          `📊 Sell: SOL > $180.00\n` +
          `💱 Trade Size: 0.001 SOL\n` +
          `⚡ Slippage: 0.5%\n\n` +
          `✅ Ready for Jupiter trading!`
        );
      } catch (error) {
        ctx.reply(`❌ Status error: ${error}`);
      }
    });

    this.bot.command('testtrade', async (ctx) => {
      try {
        ctx.reply(
          '🧪 EXECUTING TINY TEST TRADE!\n\n' +
          '🔴 MAINNET: Selling 0.001 SOL → USDC\n' +
          '💰 Amount: ~$0.20 (tiny but real!)\n' +
          '⚡ Via Jupiter API\n\n' +
          '⏳ Executing real trade...'
        );

        const balance = await this.jupiterBot.getWalletBalance();
        
        if (balance < 0.002) {
          ctx.reply(
            `❌ Insufficient balance!\n` +
            `💳 Current: ${balance.toFixed(4)} SOL\n` +
            `📋 Need: 0.002 SOL minimum`
          );
          return;
        }

        console.log('\n🧪 === TEST TRADE EXECUTION ===');
        
        // Execute tiny test trade
        const txid = await this.jupiterBot.testTrade(1000000, false); // 0.001 SOL sell
        
        ctx.reply(
          '✅ TEST TRADE COMPLETED!\n\n' +
          '🔴 Sold: 0.001 SOL → USDC\n' +
          `📝 TX: ${txid}\n\n` +
          '🔗 View on Solscan:\n' +
          `https://solscan.io/tx/${txid}\n\n` +
          '💡 Jupiter integration working perfectly!'
        );

      } catch (error: any) {
        console.error('Test trade error:', error);
        ctx.reply(
          '❌ Test Trade Failed!\n\n' +
          `🚨 Error: ${error.message}\n\n` +
          'Check console for details'
        );
      }
    });

    this.bot.command('start_trading', async (ctx) => {
      try {
        ctx.reply(
          '🚀 STARTING AUTOMATED TRADING!\n\n' +
          '⚡ Jupiter API Integration\n' +
          '📊 SOL/USDC Scalping Strategy\n' +
          '🎯 $175.00 - $180.00 range\n' +
          '💰 0.001 SOL per trade\n\n' +
          '🔄 Analyzing market every 60 seconds\n' +
          '⚠️ REAL MONEY - Monitor closely!'
        );

        // Start trading in background
        this.jupiterBot.startTrading().catch(console.error);

        setTimeout(() => {
          ctx.reply(
            '✅ Automated trading is now ACTIVE!\n\n' +
            '📊 Bot will trade automatically when:\n' +
            '🟢 SOL drops below $175.00 (BUY)\n' +
            '🔴 SOL rises above $180.00 (SELL)\n\n' +
            'Use /stop_trading to stop'
          );
        }, 5000);

      } catch (error) {
        ctx.reply(`❌ Start error: ${error}`);
      }
    });

    this.bot.command('stop_trading', (ctx) => {
      this.jupiterBot.stopTrading();
      ctx.reply(
        '🛑 AUTOMATED TRADING STOPPED\n\n' +
        '✅ All trading has been halted\n' +
        '📊 Bot status: Inactive\n\n' +
        'Use /start_trading to resume'
      );
    });

    this.bot.command('strategy', (ctx) => {
      ctx.reply(
        '🎯 Current Trading Strategy\n\n' +
        '📊 Type: SOL/USDC Micro Scalping\n' +
        '🟢 Buy Trigger: SOL < $175.00\n' +
        '🔴 Sell Trigger: SOL > $180.00\n' +
        '💰 Trade Size: 0.001 SOL (~$0.20)\n' +
        '📈 Spread: $5.00 (wider range)\n' +
        '⚡ Slippage: 0.5% max\n' +
        '🔄 Check Interval: 60 seconds\n\n' +
        '🎲 Perfect for micro scalping!'
      );
    });
  }

  async launch(): Promise<void> {
    console.log('🚀 Starting Simple Jupiter Telegram Bot...');
    await this.bot.launch();

    // Graceful shutdown
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

    console.log('✅ Jupiter Telegram bot is running!');
  }

  stop(): void {
    this.jupiterBot.stopTrading();
    this.bot.stop();
  }
}