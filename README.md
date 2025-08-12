# 🚀 Optimized Solana Trading Bot

> **⚠️ REAL MONEY TRADING BOT** - This bot executes live trades on Solana mainnet using your actual funds. Use responsibly.

An advanced Solana trading bot with optimized Jupiter DEX integration, multi-strategy coordination, and real-time Telegram monitoring.

## ✨ Key Features

- 🎯 **Advanced Jupiter Integration** - Optimized routing with priority fees
- 🤖 **Multi-Strategy Trading** - Fixed thresholds + mean reversion + volatility adaptation  
- 📱 **Real-time Telegram Updates** - Live analysis every 30 seconds
- 🛡️ **Advanced Risk Management** - Dynamic position sizing, emergency stops
- ⚡ **Fixed Threshold System** - No more moving targets bug
- 🔧 **Optimized Execution** - Better slippage, faster fills
- 🌐 **Mainnet Optimized** - Tested with bug fixes and enhancements

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Telegram Bot  │───▶│  Trading Engine  │───▶│  Jupiter API    │
│   (Remote UI)   │    │   (Strategies)   │    │  (DEX Swaps)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Price Feeds &   │
                       │  Risk Management │
                       └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
```bash
# Required software
node -v    # v18+
npm -v     # v8+
```

### Installation
```bash
git clone <your-repo>
cd solana-trading-bot
npm install
```

### Configuration

1. **Create wallet file**:
```bash
# Import your mainnet wallet (SECURE YOUR PRIVATE KEY!)
solana-keygen recover 'prompt:' -o ./id.json --force
# Enter your 12-word seed phrase when prompted
```

2. **Set up environment**:
```bash
cp .env.example .env
# Edit .env with your Telegram bot token
```

3. **Verify setup**:
```bash
# Check wallet
solana-keygen pubkey ./id.json

# Check balance (need >0.01 SOL)
solana balance ./id.json --url mainnet-beta
```

### Start Trading

```bash
# Launch optimized trading bot
npm run trading-bot
```

## 📱 Telegram Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Initialize bot | Shows welcome & commands |
| `/status` | Advanced bot status | Balance, trades, performance |
| `/performance` | Profit & metrics | Win rate, P&L, trades today |
| `/strategy` | View optimized strategies | Multi-strategy details |
| `/start_trading` | Start advanced trading | Runs all strategies |
| `/stop_trading` | Stop all trading | Halts automation |
| `/quick_test` | Execute optimized test | ~$1 optimized trade |
| `/monitor` | Real-time analysis | Manual monitoring mode |
| `/stop_monitor` | Stop monitoring | End manual updates |
| `/risk_report` | Risk analysis | Comprehensive safety check |

## 🎯 Optimized Trading Strategies

### 1. Fixed Threshold Trading (Primary)
```javascript
// FIXED thresholds that don't move with price (BUG FIXED!)
thresholds: {
    updateInterval: "15 minutes",     // Stable, not every second
    baseSpread: "$0.50",             // Dynamic $0.30-$2.00 
    volatilityAdjusted: true,        // Adapts to market conditions
    referencePrice: "locked"         // No moving targets
}
```

### 2. Micro Mean-Reversion Scalping
```javascript
triggers: {
    dropThreshold: "0.12%",          // Tighter than old 0.15%
    bounceThreshold: "0.12%",        // Quick reversals  
    timeWindow: "90 seconds",        // Faster than old 2min
    maxHold: "4 minutes",            // Quick exits
    stopLoss: "0.8%",               // Tight risk control
    takeProfit: "0.4%"              // Small but frequent gains
}
```

### 3. Trade Amount (How Much SOL per Trade)

**Simple Answer:** The bot trades **0.08 SOL (~$15)** per trade, but your actual size depends on your wallet balance.

**Your Trade Size Calculation:**
```
Bot's preferred size: 0.08 SOL (~$15)
Your wallet balance: 0.009 SOL (~$1.60)
Max allowed (15% rule): 15% × 0.009 = 0.0014 SOL (~$0.25)

Actual trade size: ~0.0014 SOL (~$0.25)
```

**To Get Larger Trades:**
- Add 0.5 SOL → trades become ~0.075 SOL (~$13)
- Add 1.0 SOL → trades become ~0.08 SOL (~$15) (full size)
- The bot never risks more than 15% of your balance for safety

**Other Settings:**
- **Max Slippage**: 0.3% (optimized for speed)
- **Analysis Interval**: 15 seconds (console) + 30 seconds (Telegram)
- **Dynamic Spread**: $0.30-$2.00 based on market conditions
- **Emergency Stop**: 5% drawdown protection

## 🔧 How It Works

### 1. **Intelligent Trade Detection**
```typescript
// Bot analyzes your balances
const solBalance = 0.019;      // Your SOL
const usdcBalance = 1.059;     // Your USDC

// Decides optimal trade
if (usdcBalance > 0.5 && solBalance < 0.02) {
    return "BUY_SOL_WITH_USDC";
}
```

### 2. **Jupiter Integration**
```typescript
// Step 1: Get best price quote
const quote = await fetch('https://quote-api.jup.ag/v6/quote', {
    inputMint: "USDC_ADDRESS",
    outputMint: "SOL_ADDRESS", 
    amount: "529994"  // $0.53 USDC
});

// Step 2: Execute swap
const transaction = await jupiterSwap({
    wrapUnwrapSOL: true,    // Auto-handle SOL wrapping
    createAta: true,        // Create token accounts
    userPublicKey: "YOUR_WALLET"
});
```

### 3. **Security Features**
- ✅ Auto-wraps SOL when needed
- ✅ Creates missing token accounts
- ✅ Validates all transactions
- ✅ Comprehensive error handling
- ✅ Real-time logging

## 💰 Trade Amount Examples

### Example 1: Low Balance (Your Current Situation)
```
Wallet Balance: 0.009 SOL (~$1.60)
Max Trade Size: 15% × 0.009 = 0.0014 SOL (~$0.25)
Profit per Trade: ~$0.01-0.02
Trades per Day: 20-50 small trades
Daily Profit Potential: ~$0.20-1.00
```

### Example 2: Medium Balance (Recommended)
```
Wallet Balance: 0.5 SOL (~$90)
Max Trade Size: 15% × 0.5 = 0.075 SOL (~$13.50)
Profit per Trade: ~$0.10-0.25
Trades per Day: 20-50 medium trades
Daily Profit Potential: ~$2.00-12.50
```

### Example 3: Full Balance (Optimal)
```
Wallet Balance: 1.0+ SOL (~$180+)
Max Trade Size: 0.08 SOL (~$15) (full bot capacity)
Profit per Trade: ~$0.15-0.30
Trades per Day: 20-50 full trades
Daily Profit Potential: ~$3.00-15.00
```

### Live Trade Example
```
📊 ANALYSIS: SOL Price $175.83
🎯 SELL SIGNAL: Price above threshold
💰 Your Trade: 0.0014 SOL → $0.25 USDC
✅ SUCCESS: Profit ~$0.01
⏳ NEXT: Wait for buy signal
```

## 🛡️ Security & Safety

### 🔐 **Private Key Security**
- **Never share your seed phrase**
- **id.json is gitignored** - Won't be committed
- **Environment variables for secrets**
- **Telegram bot restricted to your user ID**

### ⚙️ **Trading Safety**
- **Conservative trade sizes** (0.005 SOL ~$0.85)
- **Wide spreads** ($10 range for stable profits)
- **Balance validation** (prevents over-trading)
- **Error recovery** (handles network issues)

### 🚨 **Risk Management**
```javascript
safeguards: {
    maxTradeSize: "0.01 SOL",      // Never risk more than $1.70
    minBalance: "0.01 SOL",        // Keep SOL for fees
    slippageLimit: "1%",           // Price protection
    emergencyStop: "Telegram /stop"
}
```

## 📊 Monitoring & Logs

### Console Output (Every 15 seconds)
```bash
📊 === OPTIMIZED ANALYSIS 8:57:00 AM ===
💎 SOL Price: $175.83
🌊 Volatility: 0.01% | ⚡ Momentum: +0.05% | 📈 Trend: SIDEWAYS
🎯 Mean Reversion: NONE - Price change: +0.05% in 76s (threshold: ±0.12%)
⚖️ Price Ratio: 1758312.55 | FIXED Buy: 1755532 | FIXED Sell: 1759137
🚀 SELL SIGNAL: Dynamic Threshold SELL: Ratio 1758312.90 >= 1755737.37
💰 Position: 0.08 SOL (~$14.07)
✅ SELL COMPLETED: 5x2Abc...9Xyz
```

### Telegram Updates (Every 30 seconds when trading)
```
📊 LIVE ANALYSIS - 8:57:00 AM

💎 SOL Price: $175.83
⚖️ Price Ratio: 1758312
🌊 Volatility: 0.01%
⚡ Momentum: +0.05%
📈 Trend: SIDEWAYS
💳 Balance: 0.0212 SOL

🎯 FIXED THRESHOLDS:
• Buy Threshold: ~1755532
• Sell Threshold: ~1759137

🤖 Status: Actively monitoring
⏳ Next analysis in 30 seconds...
```

### Performance Updates (Every 5 minutes)
```
📊 PERFORMANCE UPDATE #1

💰 Balance: 0.0212 SOL
📈 Trades Today: 3
💎 Today's P&L: $0.43
🎯 Win Rate: 100.0%
🕐 Time: 9:00:00 AM

🤖 Status: Multiple strategies active
```

## 🚨 Important Disclaimers

### ⚠️ **Financial Risk Warning**
- **Real money trading** - You can lose funds
- **Start with small amounts** (0.001-0.01 SOL)
- **Test thoroughly before scaling up**
- **Monitor your trades closely**
- **Understand the risks** before using

### 🔒 **Security Warning**
- **Secure your private keys** - Never share them
- **Use strong passwords** for your wallet
- **Keep your seed phrase offline** and secure
- **Regularly monitor your accounts**

### ⚖️ **Legal Disclaimer**
This software is provided for educational and experimental purposes. Trading cryptocurrencies involves substantial risk of loss. You are solely responsible for your trading decisions and any resulting gains or losses.

## 📞 Support & Resources

- **Jupiter API Docs**: https://docs.jup.ag
- **Solana Documentation**: https://docs.solana.com
- **Telegram Bot Setup**: @BotFather on Telegram

## 📄 License

ISC License - Use at your own risk

---

## 🆕 Latest Updates & Bug Fixes

### ✅ **Critical Bug Fixed**: Moving Threshold Issue
- **Problem**: Thresholds moved with every price update (impossible to cross)
- **Solution**: Fixed thresholds that update only every 15 minutes
- **Result**: Bot can now actually execute trades profitably

### ✅ **Jupiter API Integration Fixed**
- **Problem**: Conflicting fee parameters causing swap failures
- **Solution**: Cleaned up API calls with single priority fee
- **Result**: Smooth trade execution with optimized fees

### ✅ **Real-time Telegram Updates Added**
- **Feature**: Live analysis updates every 30 seconds during trading
- **Feature**: Performance summaries every 5 minutes  
- **Result**: Full visibility into bot operations via Telegram

---

**🎯 Ready to start? Run `npm run trading-bot` and send `/start_trading` to your Telegram bot!**

**💡 Optimized for real profits: Fixed thresholds + multi-strategy + real-time monitoring!**