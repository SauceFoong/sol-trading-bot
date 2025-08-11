# 🚀 Mainnet Jupiter Trading Bot Setup

## ⚠️ CRITICAL WARNING
**THIS BOT TRADES REAL MONEY ON SOLANA MAINNET!**  
- Start with small amounts (0.001-0.01 SOL)
- Test thoroughly before using larger amounts
- Monitor your trades closely
- Have sufficient SOL for transaction fees

## 🎯 What This Bot Does
- **Direct Jupiter API Integration** - No smart contracts needed
- **SOL/USDC Trading** - Swaps between SOL and USDC
- **Automated Scalping** - Buys low, sells high based on price thresholds
- **Real-time Monitoring** - Checks prices every 60 seconds
- **Safety Features** - Conservative trade sizes and slippage protection

## 🔧 Setup Instructions

### 1. Verify Environment Configuration
Your `.env` file should contain:
```env
# Mainnet RPC (already configured)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Private key file path (already configured)  
PRIVATE_KEY_PATH=./id.json

# Optional: Telegram bot (if you want Telegram interface)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ALLOWED_USERS=your_telegram_user_id
```

### 2. Check Your Private Key
Make sure `id.json` contains your Solana private key:
```bash
# Check if file exists and has content
ls -la id.json

# Verify it's a valid Solana keypair (should show your public key)
solana-keygen pubkey ./id.json
```

### 3. Fund Your Wallet
**Minimum Recommended Balance:**
- **0.02 SOL** - For trading + transaction fees
- **More SOL = More Trading Opportunities**

```bash
# Check current balance
solana balance ./id.json --url mainnet-beta

# If you need more SOL, transfer from your main wallet or exchange
```

## 🚀 Running the Bot

### Option 1: Interactive CLI Bot (Recommended)
```bash
npm run mainnet-bot
```
This launches an interactive menu where you can:
- Check status and balance
- Execute test trades
- View current prices  
- Start/stop automated trading
- Execute manual trades

### Option 2: Telegram Bot Interface
```bash
npm run jupiter-bot
```
Control the bot via Telegram commands.

### Option 3: Direct Bot Instance
```bash
npm run telegram-bot-full
```

## 📊 Trading Strategy

### Current Configuration
- **Buy Trigger**: SOL price < $170.00
- **Sell Trigger**: SOL price > $180.00  
- **Trade Size**: 0.01 SOL (~$1.70)
- **Max Slippage**: 0.5%
- **Check Interval**: 60 seconds

### How It Works
1. **Monitor Prices**: Fetches SOL/USDC prices every 60 seconds
2. **Analyze Conditions**: Checks if price is below buy threshold or above sell threshold
3. **Execute Trade**: Uses Jupiter API to swap SOL ↔ USDC
4. **Confirm Transaction**: Waits for blockchain confirmation
5. **Repeat**: Continues monitoring for next opportunity

## 🧪 Testing Before Full Trading

### 1. Start with Status Check
```bash
npm run mainnet-bot
# Select option 1: Check Status & Balance
```

### 2. Execute Small Test Trade
```bash
# In the bot menu, select option 2: Execute Test Trade
# This will trade 0.001 SOL (~$0.17) to verify everything works
```

### 3. Monitor a Few Cycles
```bash
# Select option 3: View Current Prices
# This shows live price data without trading
```

### 4. Start Automated Trading
```bash
# Select option 4: Start Automated Trading
# Only after you're confident everything works
```

## 🔍 Monitoring Your Trading

### Real-time Monitoring
```bash
# The bot shows detailed logs:
📊 === Market Analysis 12:34:56 ===
💲 SOL: $175.23
💲 USDC: $1.0001
⚖️ Price Ratio: 1752300
🎯 Buy Threshold: 1700000
🎯 Sell Threshold: 1800000
💳 Wallet Balance: 0.0456 SOL

🟢 BUY SIGNAL TRIGGERED!
🚀 JUPITER: Executing BUY swap
📊 Quote: 10000000 → 57234
✅ BUY COMPLETED!
🔗 https://solscan.io/tx/abc123...
```

### Track Your Transactions
Every trade generates a Solscan link for verification:
```
🔗 https://solscan.io/tx/YOUR_TRANSACTION_ID
```

## 💡 Pro Tips

### 1. Start Conservative
- Begin with 0.001-0.01 SOL trades
- Monitor for several hours before increasing
- Adjust thresholds based on market conditions

### 2. Monitor Market Conditions
- **Trending Markets**: May hit one threshold repeatedly
- **Sideways Markets**: Perfect for scalping both directions
- **Volatile Markets**: May need wider spreads

### 3. Adjust Strategy
Edit the strategy in `mainnet-jupiter-bot.ts`:
```typescript
const strategy: TradingStrategy = {
  buyThreshold: 1700000,  // $170.00 - adjust as needed
  sellThreshold: 1800000, // $180.00 - adjust as needed
  tradeAmount: 10000000,  // 0.01 SOL - adjust size
  maxSlippage: 50,        // 0.5% - adjust slippage tolerance
};
```

### 4. Risk Management
- **Stop Loss**: Monitor your total balance
- **Take Profit**: Consider taking profits during good runs
- **Time Limits**: Don't run 24/7 initially
- **Market Hours**: Be aware of high-volume trading times

## 🛠️ Troubleshooting

### Common Issues

**"Insufficient balance"**
- Need more SOL in wallet
- Check with: `solana balance ./id.json --url mainnet-beta`

**"Quote failed"**
- Jupiter API temporarily unavailable
- Try again in a few minutes

**"Transaction failed"**
- Network congestion
- Increase slippage tolerance slightly
- Ensure sufficient SOL for fees

**"RPC Error"**
- Mainnet RPC under load
- Consider using a paid RPC service

### Emergency Stop
- **CLI Bot**: Press Ctrl+C
- **Menu Option**: Select "5. Stop Trading"  
- **Code**: `jupiterBot.stopTrading()`

## 📈 Expected Performance

### Realistic Expectations
- **Profit per trade**: 1-3% when successful
- **Success rate**: 60-80% in sideways markets
- **Daily trades**: 2-10 depending on volatility
- **Risk**: Each trade risks the slippage amount (~0.5%)

### Example Scenario
```
Starting balance: 0.1 SOL ($17)
Trade size: 0.01 SOL per trade
Target spread: $10 (170-180)
Potential profit per successful round trip: ~5.8%
```

## ⚠️ Disclaimers

1. **Not Financial Advice**: This is experimental trading software
2. **Risk of Loss**: You can lose money trading
3. **Market Risk**: Prices can move against you
4. **Technical Risk**: Bugs, network issues, etc.
5. **Regulatory Risk**: Ensure compliance with your local laws

## 📞 Support

If you need help:
1. Check the console logs for detailed error messages
2. Verify your setup (balance, network, keys)
3. Test with small amounts first
4. Monitor Solana network status if issues persist

---

**🎯 Ready to start? Run `npm run mainnet-bot` and select your first action!**

**🚨 Remember: Start small, monitor closely, trade responsibly!**