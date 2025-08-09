# Solana Trading Bot

A comprehensive automated trading bot for Solana built with Anchor framework, featuring multiple trading strategies, risk management, and safety features.

## Features

- **Multiple Trading Strategies**
  - Grid Trading
  - Dollar Cost Averaging (DCA)
  - Arbitrage
  - Mean Reversion

- **Risk Management**
  - Position size limits
  - Daily loss limits
  - Stop-loss and take-profit
  - Slippage protection
  - Emergency circuit breakers

- **Price Monitoring**
  - Multiple price feed sources (Pyth, CoinGecko, Jupiter)
  - Real-time price alerts
  - Comprehensive price data aggregation

- **Safety Features**
  - On-chain authority controls
  - Pause/resume functionality
  - Comprehensive error handling
  - Circuit breaker patterns

## Architecture

### Smart Contract (Rust/Anchor)
- `TradingBot` account for storing bot state
- Multiple instruction handlers for different operations
- Integration with Jupiter and Raydium for token swaps
- Price monitoring and strategy execution logic

### Client (TypeScript)
- `TradingBotClient` for interacting with on-chain program
- `PriceFeedManager` for aggregating price data
- `RiskManager` for enforcing trading limits
- `ConfigurationManager` for managing bot settings

## Quick Start

### Prerequisites
- Node.js v16+
- Rust 1.60+
- Solana CLI 1.14+
- Anchor CLI 0.28+

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd solana-trading-bot
```

2. Install dependencies
```bash
npm install
```

3. Build the program
```bash
anchor build
```

4. Deploy to devnet (for testing)
```bash
anchor deploy --provider.cluster devnet
```

### Configuration

Create a configuration file based on your needs:

```typescript
import { BotConfiguration } from "./app/src/config";

const config: BotConfiguration = {
  network: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  commitment: "confirmed",
  strategy: {
    type: "grid",
    parameters: {
      gridLevels: 10,
      priceRange: 0.20,
      gridSpacing: 0.02,
    },
  },
  riskParameters: {
    maxPositionSize: 5, // 5% of portfolio per trade
    maxDailyLoss: 100,  // $100 daily loss limit
    maxSlippage: 100,   // 1% max slippage
    cooldownPeriod: 300, // 5 minutes between trades
  },
  // ... other configuration options
};
```

### Usage

```typescript
import { TradingBotClient } from "./app/src/trading-bot-client";

const client = new TradingBotClient(config);

// Initialize the bot
await client.initializeBot(config.strategy, config.initialBalance);

// Start automated trading
await client.startBot();

// Monitor bot status
const botInfo = await client.getBotInfo();
console.log(botInfo);

// Stop the bot
await client.stopBot();
```

## Testing

Run the test suite:

```bash
anchor test
```

The tests cover:
- Bot initialization and configuration
- Strategy management
- Trading operations
- Price monitoring
- Risk management
- Error handling

## Trading Strategies

### Grid Trading
Places buy and sell orders at regular price intervals around the current price.

```typescript
const gridStrategy = {
  type: "grid",
  parameters: {
    gridLevels: 10,        // Number of price levels
    priceRange: 0.20,      // 20% price range
    gridSpacing: 0.02,     // 2% spacing between levels
  }
};
```

### Dollar Cost Averaging (DCA)
Automatically buys a fixed amount at regular intervals.

```typescript
const dcaStrategy = {
  type: "dca",
  parameters: {
    interval: 3600000,     // 1 hour intervals
    amount: 10,            // $10 per purchase
    priceDropThreshold: 0.05, // Only buy on 5%+ drops
  }
};
```

### Arbitrage
Exploits price differences between different exchanges/pools.

```typescript
const arbitrageStrategy = {
  type: "arbitrage",
  parameters: {
    minProfitBps: 10,      // Minimum 0.1% profit
    exchanges: ["raydium", "orca"],
    maxExecutionTime: 30000,
  }
};
```

### Mean Reversion
Trades based on statistical analysis of price movements.

```typescript
const meanReversionStrategy = {
  type: "meanReversion",
  parameters: {
    lookbackPeriod: 24,    // 24 hour lookback
    stdDevThreshold: 2,    // 2 standard deviations
    meanCalculationMethod: "sma",
  }
};
```

## Risk Management

The bot includes comprehensive risk management features:

- **Position Limits**: Maximum percentage of portfolio per trade
- **Daily Limits**: Maximum daily loss in USD
- **Stop-Loss**: Automatic position closure at predetermined loss levels
- **Take-Profit**: Automatic position closure at predetermined profit levels
- **Slippage Protection**: Maximum allowed slippage per trade
- **Circuit Breakers**: Automatic trading suspension on consecutive failures

## Price Feeds

Multiple price feed sources ensure accurate pricing:

- **Jupiter API**: Real-time DEX prices
- **Pyth Network**: On-chain price feeds
- **CoinGecko**: Centralized exchange prices

Price feeds are aggregated with confidence scoring to ensure reliability.

## Security Considerations

- All critical operations require on-chain authority verification
- Private keys should be stored securely (use hardware wallets in production)
- Test thoroughly on devnet before mainnet deployment
- Monitor bot activity regularly
- Set appropriate risk limits for your capital

## Monitoring and Alerts

The bot supports various monitoring options:

- **Console Logging**: Detailed operation logs
- **Telegram Bot**: Real-time alerts and bot management
- **Webhook Integration**: Custom alert endpoints
- **Metrics Export**: Prometheus-compatible metrics

### Telegram Bot Integration

The bot includes a Telegram bot for real-time monitoring and control:

```bash
# Set up your Telegram bot token
export TELEGRAM_BOT_TOKEN=your_bot_token_here
export TELEGRAM_CHAT_ID=your_chat_id_here

# Run the telegram bot
npm run telegram-bot
```

Features:
- Real-time trade notifications
- Bot status monitoring
- Performance metrics
- Emergency controls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This software is for educational purposes only. Cryptocurrency trading involves substantial risk and may result in significant losses. Always conduct thorough testing and start with small amounts. The authors are not responsible for any financial losses incurred through the use of this software.

## Support

For questions and support:
- Open an issue on GitHub
- Join our Discord community
- Check the documentation wiki

## Roadmap

- [ ] Support for additional DEXs (Orca, Serum)
- [ ] Advanced strategy backtesting
- [ ] Web-based dashboard
- [ ] Mobile app notifications
- [ ] Advanced portfolio rebalancing
- [ ] Multi-token strategies