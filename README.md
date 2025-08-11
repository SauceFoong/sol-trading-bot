# 🚀 Solana Jupiter Trading Bot

> **⚠️ REAL MONEY TRADING BOT** - This bot executes live trades on Solana mainnet using your actual funds. Use responsibly.

A sophisticated Solana trading bot with Jupiter DEX integration, smart trading strategies, and Telegram control interface.

## ✨ Key Features

- 🎯 **Jupiter DEX Integration** - Best swap rates across all Solana DEXs
- 🤖 **Intelligent Trading Strategies** - Mean reversion, grid trading, DCA
- 📱 **Telegram Bot Control** - Trade remotely via Telegram commands
- 🛡️ **Built-in Risk Management** - Stop loss, take profit, position sizing
- ⚡ **Real-time Price Feeds** - Live market data analysis
- 🔧 **No Smart Contract Deployment** - Direct Jupiter API integration
- 🌐 **Mainnet Ready** - Production-tested on Solana mainnet

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
# Launch Telegram bot interface
npm run mainnet-telegram

# Or use interactive CLI
npm run mainnet-bot
```

## 📱 Telegram Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Initialize bot | Shows welcome message |
| `/status` | Check bot & wallet status | Balance, network info |
| `/balance` | View detailed balances | SOL, USDC amounts |
| `/test` | Execute small test trade | ~$0.50 trade |
| `/start_trading` | Begin automated trading | Runs continuously |
| `/stop_trading` | Stop all trading | Halts automation |
| `/manual_buy` | Manual buy order | Immediate SOL purchase |
| `/manual_sell` | Manual sell order | Immediate SOL sale |
| `/strategy` | View current strategy | Shows trading rules |

## 🎯 Trading Strategies

### 1. Smart Test Trading (Default)
```javascript
// Automatically detects what you have and trades accordingly
if (hasUSDC && lowSOL) {
    // Buy SOL with half your USDC (~$0.50)
    action: "BUY SOL"
} else if (hasSOL) {
    // Sell small amount of SOL (0.005 SOL)
    action: "SELL SOL"
}
```

### 2. Mean Reversion Scalping
```javascript
buyTrigger:  "SOL < $165"    // Conservative entry
sellTrigger: "SOL > $175"    // $10 spread for profits
tradeSize:   "0.005 SOL"     // ~$0.85 per trade
timeframe:   "60 seconds"    // Quick scalping
```

### 3. Conservative Parameters
- **Trade Size**: 0.005 SOL (~$0.85)
- **Max Slippage**: 1.0% (better fills)
- **Check Interval**: 60 seconds
- **Spread**: $10 (165-175 range)

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

## 💰 Example Trade Flow

```
📊 Before Trade:
├─ SOL: 0.019 (~$3.28)
└─ USDC: 1.059988

🤖 Bot Analysis:
├─ Detection: "Has USDC but low SOL"
├─ Decision: "BUY SOL with ~$0.53 USDC"
└─ Safety: "Use only half of USDC"

🔄 Jupiter Execution:
├─ Quote: 0.529994 USDC → 2,901,834 lamports
├─ Rate: ~$172.50 per SOL
├─ Transaction: Signed & submitted
└─ Confirmation: ✅ Success

📊 After Trade:
├─ SOL: 0.022 (~$3.78) ↗️ +0.003 SOL  
└─ USDC: 0.530 ↘️ -0.53 USDC

🎯 Result: Successful $0.53 test trade!
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

### Console Output
```bash
🚀 JUPITER: Executing BUY swap
💰 Amount: 529994
📊 Quote API Response: 200 OK
📊 Quote: 529994 → 2901834 (547.52% rate)
✅ BUY COMPLETED!
🔗 https://solscan.io/tx/abc123...
```

### Telegram Notifications
```
✅ TEST TRADE COMPLETED!

🟢 Bought: SOL with $0.53 USDC
📝 TX: abc123...
🔗 https://solscan.io/tx/abc123...

💡 Jupiter integration working perfectly!
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

**🎯 Ready to start? Run `npm run mainnet-telegram` and send `/test` to your Telegram bot!**

**💡 Remember: Start small, monitor closely, trade responsibly!**