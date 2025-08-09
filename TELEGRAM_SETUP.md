# Telegram Bot Setup Guide

This guide will help you set up the Telegram bot to control your Solana Trading Bot.

## Prerequisites

1. A Telegram account
2. Deployed Solana Trading Bot smart contract
3. Node.js and npm installed

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a conversation with BotFather by clicking "Start"
3. Send `/newbot` command
4. Choose a name for your bot (e.g., "My Trading Bot")
5. Choose a username for your bot (must end with 'bot', e.g., "mytradingbot")
6. Copy the HTTP API token provided by BotFather

## Step 2: Get Your Telegram User ID

1. Search for `@userinfobot` on Telegram
2. Start a conversation and click "Start"
3. The bot will send you your User ID (a number)
4. Copy this number - you'll need it for authorization

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your configuration:
   ```env
   # Your bot token from BotFather
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz

   # Your Telegram user ID (comma-separated for multiple users)
   TELEGRAM_ALLOWED_USERS=123456789,987654321

   # Solana configuration
   SOLANA_RPC_URL=https://api.devnet.solana.com
   PRIVATE_KEY_PATH=./id.json
   ```

## Step 4: Prepare Your Solana Wallet

1. Make sure you have a Solana keypair file (usually `id.json`)
2. Update `PRIVATE_KEY_PATH` in `.env` if your keypair is in a different location
3. Ensure your wallet has some SOL for transaction fees

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Start the Telegram Bot

```bash
npm run telegram-bot
```

You should see:
```
🚀 Initializing Telegram Trading Bot...
✅ Bot is running! Send /start to interact with it.
```

## Step 7: Test the Bot

1. Open Telegram and search for your bot using the username you created
2. Start a conversation and send `/start`
3. You should receive a welcome message with available commands

## Available Commands

- `/start` - Welcome message and command list
- `/help` - Detailed help for all commands
- `/status` - Get current bot status and statistics
- `/balance` - Check bot balance
- `/start_trading` - Begin automated trading
- `/stop_trading` - Stop automated trading
- `/pause` - Pause the bot
- `/resume` - Resume a paused bot
- `/strategy` - View or update trading strategy
- `/withdraw <amount>` - Withdraw funds from bot
- `/trades` - Show recent trading activity

## Security Notes

1. **Never share your bot token** - Anyone with the token can control your bot
2. **Limit allowed users** - Only add trusted Telegram user IDs to `TELEGRAM_ALLOWED_USERS`
3. **Use devnet first** - Test thoroughly on devnet before using mainnet
4. **Secure your private key** - Store your Solana keypair securely
5. **Start small** - Begin with small amounts when testing on mainnet

## Troubleshooting

### Bot doesn't respond
- Check that your bot token is correct
- Verify the bot is running without errors
- Make sure your user ID is in the allowed users list

### "Unauthorized access" message
- Verify your Telegram user ID is correct
- Check that it's added to `TELEGRAM_ALLOWED_USERS` in `.env`

### Trading commands fail
- Ensure your Solana wallet has sufficient balance
- Check that the trading bot smart contract is deployed
- Verify RPC URL is accessible

### Bot crashes on startup
- Check that all environment variables are set correctly
- Verify the private key file exists and is readable
- Ensure network connectivity to Solana RPC

## Production Deployment

For production deployment:

1. Use a secure server (VPS, cloud instance)
2. Use process managers like PM2:
   ```bash
   npm install -g pm2
   pm2 start "npm run telegram-bot" --name "trading-bot"
   ```
3. Set up monitoring and logging
4. Use mainnet RPC URLs
5. Implement additional security measures
6. Regular backups of configuration and keys

## Example Usage

1. Send `/status` to check bot status
2. Send `/start_trading` to begin automated trading
3. Monitor with `/balance` and `/status` commands
4. Use `/pause` if you need to temporarily stop trading
5. Send `/withdraw 5.5` to withdraw 5.5 USDC

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your configuration matches this guide
3. Test on devnet first
4. Refer to the main project documentation