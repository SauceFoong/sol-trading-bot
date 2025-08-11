# 🔐 Mainnet Wallet Setup for Trading Bot

## Your Wallet Information
- **Target Wallet**: `BxmSEddwE1jBFVSXnsvDsujgjBh2GK2jhrzpZLJJidrG`
- **Current Balance**: 0.019309012 SOL (~$3.28)
- **Status**: ✅ Sufficient for trading

## 🚨 CRITICAL: Connect Your Mainnet Wallet

Your trading bot currently uses a different wallet (`EUAApfSrcCUp42BUUPG54ingv59184ndHoX2DfgTYqYE`). 

**To trade with YOUR mainnet wallet, you MUST do ONE of the following:**

### Option 1: Replace id.json (RECOMMENDED)
```bash
# Backup current wallet
mv id.json id-backup.json

# Method A: If you have seed phrase
solana-keygen recover 'prompt:' -o ./id.json --force
# Enter your 12/24 word seed phrase when prompted

# Method B: If you have private key array
# Create id.json with your private key array like:
# [123,45,67,89,...] (64 numbers)

# Verify the change
solana-keygen pubkey ./id.json
# Should show: BxmSEddwE1jBFVSXnsvDsujgjBh2GK2jhrzpZLJJidrG
```

### Option 2: Create a new mainnet wallet file
```bash
# Create separate mainnet wallet file
solana-keygen recover 'prompt:' -o ./mainnet-wallet.json --force
# Then update PRIVATE_KEY_PATH in .env
```

### Option 3: Use current wallet (NOT RECOMMENDED)
Your current wallet has 0 SOL and would need funding.

## 🚀 After Setting Up Your Wallet

### 1. Verify Connection
```bash
# Check if correct wallet is loaded
solana-keygen pubkey ./id.json

# Should show: BxmSEddwE1jBFVSXnsvDsujgjBh2GK2jhrzpZLJJidrG
```

### 2. Start Telegram Bot
```bash
npm run mainnet-telegram
```

### 3. Test in Telegram
Send these commands to your Telegram bot:
- `/start` - Initialize bot
- `/status` - Verify wallet connection
- `/balance` - Check SOL balance
- `/test` - Execute tiny test trade (0.001 SOL)

## 💰 Wallet Requirements

### Minimum Balance
- **0.01 SOL** - For trading + fees
- **Your Current**: 0.019 SOL ✅ Sufficient

### Trading Parameters
- **Trade Size**: 0.005 SOL (~$0.85 per trade)
- **Strategy**: Buy < $165, Sell > $175
- **Conservative**: Small trades, wide spread

## 🔑 Security Notes

1. **Never share your private key** - Keep id.json secure
2. **Start small** - Test with micro amounts first  
3. **Monitor closely** - Watch your first few trades
4. **Backup wallet** - Save your seed phrase securely

## ⚡ Quick Start Commands

```bash
# 1. Replace wallet (use your seed phrase)
mv id.json id-backup.json
solana-keygen recover 'prompt:' -o ./id.json --force

# 2. Verify wallet
solana-keygen pubkey ./id.json

# 3. Start Telegram bot
npm run mainnet-telegram

# 4. Test in Telegram
# Send /start to your bot
```

## 🆘 Need Help?

If you need help connecting your wallet:
1. Make sure you have your seed phrase or private key
2. Follow Option 1 above step by step
3. Verify with `solana-keygen pubkey ./id.json`
4. Should show your wallet: BxmSE...idrG

---

**✅ Once your wallet is connected, you can start trading via Telegram!**