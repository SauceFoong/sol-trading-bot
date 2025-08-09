# 🌐 Solana Trading Bot Web UI

A modern web dashboard for monitoring and managing your Solana trading bots with real-time updates and comprehensive analytics.

![Trading Bot Dashboard](https://img.shields.io/badge/Status-Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.x-black)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-38B2AC)

## ✨ Features

### 📊 Real-time Dashboard
- Live portfolio metrics and performance tracking
- Active bot monitoring with status indicators
- Real-time alerts and notifications
- Price feed integration

### 🤖 Bot Management
- View all trading bots with detailed metrics
- Pause/Resume bot operations
- Filter bots by strategy and status
- Direct Solana Explorer integration

### 📈 Performance Analytics
- Profit/Loss tracking per bot
- Win rate and trade success metrics
- Volume and trade frequency analysis
- Historical performance data

### ⚡ Live Monitoring
- WebSocket-based real-time updates
- System status indicators
- Alert management system
- Network connectivity status

## 🚀 Quick Start

### 1. Start the Complete System
```bash
# Start both web UI and monitoring server
npm run dev

# This runs:
# - Next.js web app on http://localhost:3000
# - WebSocket server on http://localhost:3001
```

### 2. Individual Components
```bash
# Start web UI only
npm run web

# Start WebSocket monitoring server only
npm run web-server

# Start with specific bot accounts to monitor
npm run web-server -- <bot-account-1> <bot-account-2>
```

### 3. Production Build
```bash
# Build for production
npm run web-build

# Start production server
npm run web-start
```

## 🏗️ Architecture

```
┌─────────────────────┐    WebSocket    ┌─────────────────────┐
│                     │ ◄──────────────► │                     │
│   Next.js Web UI    │                 │   Monitoring Server │
│   (Port 3000)       │                 │   (Port 3001)       │
│                     │                 │                     │
└─────────────────────┘                 └─────────────────────┘
                                                    │
                                                    ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │  Solana Blockchain  │
                                        │   (Trading Bots)    │
                                        │                     │
                                        └─────────────────────┘
```

### Components Overview

- **Web UI (`/web/`)**: React-based dashboard built with Next.js
- **WebSocket Server (`web-server.ts`)**: Real-time monitoring and bot communication
- **Trading Bot Integration**: Direct connection to on-chain programs

## 📱 Web UI Structure

```
web/
├── app/                    # Next.js 13+ app directory
│   ├── page.tsx           # Main dashboard
│   ├── bots/              # Bot management pages
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── MetricCard.tsx     # Metric display component
│   ├── BotCard.tsx        # Bot status card
│   └── CreateBotModal.tsx # Bot creation modal
├── lib/                   # Utilities and context
│   └── WebSocketContext.tsx # WebSocket connection management
└── types/                 # TypeScript definitions
    └── index.ts           # Shared type definitions
```

## 🎨 UI Features

### Dashboard Overview
- **Portfolio Summary**: Total balance, active bots, P&L tracking
- **Bot Cards**: Individual bot status with key metrics
- **Real-time Alerts**: System notifications and warnings
- **Live Status**: Connection and network indicators

### Bot Management
- **Bot Creation**: Guided setup with strategy selection
- **Bot Control**: Pause/Resume operations
- **Performance Tracking**: Win rate, trade volume, profit analysis
- **Explorer Integration**: Direct links to Solana Explorer

### Monitoring Features
- **Live Updates**: Real-time data via WebSocket
- **Alert System**: Configurable notifications for events
- **Status Indicators**: Visual feedback for bot and network status
- **Search & Filter**: Advanced bot filtering capabilities

## 🔧 Configuration

### WebSocket Connection
The web UI automatically connects to the monitoring server:
- **Development**: `http://localhost:3001`
- **Production**: Configure via environment variables

### Environment Variables
```env
# WebSocket server port (default: 3001)
PORT=3001

# Solana network configuration
ANCHOR_WALLET=/path/to/wallet.json
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start complete system (web + server) |
| `npm run web` | Start web UI only |
| `npm run web-server` | Start monitoring server only |
| `npm run web-build` | Build for production |
| `npm run web-start` | Start production build |

## 🎯 Usage Examples

### Monitoring Existing Bots
```bash
# Start monitoring specific bot accounts
npm run web-server -- 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

# Start complete system with bots
npm run dev
```

### Adding New Bots
1. Open web UI at `http://localhost:3000`
2. Navigate to "Bots" page
3. Click "Create Bot" button
4. Configure strategy and risk parameters
5. Deploy and start monitoring

### Real-time Monitoring
- Dashboard updates every 15 seconds
- Live trade notifications
- Automatic alert generation
- Portfolio performance tracking

## 🔍 Troubleshooting

### Connection Issues
- Ensure WebSocket server is running on port 3001
- Check firewall settings for ports 3000 and 3001
- Verify Solana wallet configuration

### Bot Not Appearing
- Confirm bot account address is valid
- Check bot is deployed on correct network (devnet/mainnet)
- Verify monitoring server has wallet access

### Performance Issues
- Check WebSocket connection status
- Monitor browser console for errors
- Verify Solana RPC endpoint connectivity

## 🚀 Next Steps

1. **Start the System**: `npm run dev`
2. **Open Dashboard**: Visit `http://localhost:3000`
3. **Create Bots**: Use the bot creation interface
4. **Monitor Performance**: Watch real-time metrics
5. **Scale Operations**: Deploy additional bots as needed

## 🎉 Success!

Your Solana Trading Bot Web UI is ready! You now have:
- ✅ Modern React dashboard
- ✅ Real-time monitoring
- ✅ Bot management interface
- ✅ Performance analytics
- ✅ Alert system

Visit `http://localhost:3000` to start managing your trading bots!