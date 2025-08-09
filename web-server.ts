import * as http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js"
import { SolanaTradingBot } from "./target/types/solana_trading_bot"
import fs from "fs"

const PROGRAM_ID = new PublicKey("EroGopwwQVYXgbMZigR1UvQ9xZh7fviL4897ZUvYtt2F")

interface BotMetrics {
  botAccount: string
  authority: string
  isActive: boolean
  strategy: string
  balance: number
  totalTrades: number
  successfulTrades: number
  winRate: number
  lastTradeTimestamp: Date | null
  createdAt: Date
  performance: {
    totalVolume: number
    avgTradeSize: number
    profitLoss: number
    dailyTrades: number
  }
}

class WebSocketMonitor {
  private io: SocketIOServer
  private connection: Connection
  private program: Program<SolanaTradingBot>
  private monitoredBots: Map<string, BotMetrics> = new Map()
  private updateInterval: NodeJS.Timeout | null = null

  constructor(server: http.Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    // Use localnet for testing, fallback to devnet
    const rpcUrl = process.env.SOLANA_RPC_URL || "http://localhost:8899"
    this.connection = new Connection(rpcUrl, "confirmed")
    
    // Setup provider
    const keypairPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"))
    const wallet = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keypairData))
    
    const provider = new anchor.AnchorProvider(
      this.connection,
      new anchor.Wallet(wallet),
      { commitment: "confirmed" }
    )
    anchor.setProvider(provider)

    // Load program
    const idl = require("./target/idl/solana_trading_bot.json")
    this.program = new Program(idl, PROGRAM_ID, provider) as Program<SolanaTradingBot>

    this.setupSocketHandlers()
    this.startMonitoring()
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)
      
      // Send current bot data to new client
      Array.from(this.monitoredBots.values()).forEach(bot => {
        socket.emit('botUpdate', bot)
      })

      socket.on('addBot', async (botAccount: string) => {
        try {
          await this.addBotToMonitoring(botAccount)
          console.log(`Added bot ${botAccount} to monitoring`)
        } catch (error) {
          socket.emit('error', { message: `Failed to add bot: ${error.message}` })
        }
      })

      socket.on('pauseBot', async (botAccount: string) => {
        try {
          // TODO: Implement pause bot functionality
          socket.emit('botPaused', { botAccount })
        } catch (error) {
          socket.emit('error', { message: `Failed to pause bot: ${error.message}` })
        }
      })

      socket.on('resumeBot', async (botAccount: string) => {
        try {
          // TODO: Implement resume bot functionality  
          socket.emit('botResumed', { botAccount })
        } catch (error) {
          socket.emit('error', { message: `Failed to resume bot: ${error.message}` })
        }
      })

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
      })
    })
  }

  private async addBotToMonitoring(botAccountPubkey: string): Promise<void> {
    try {
      const botAccount = new PublicKey(botAccountPubkey)
      const botData = await this.program.account.tradingBot.fetch(botAccount)
      
      const strategyType = Object.keys(botData.strategy.strategyType)[0]
      const winRate = botData.totalTrades.toNumber() > 0 
        ? (botData.successfulTrades.toNumber() / botData.totalTrades.toNumber()) * 100 
        : 0

      const metrics: BotMetrics = {
        botAccount: botAccountPubkey,
        authority: botData.authority.toString(),
        isActive: botData.isActive,
        strategy: strategyType,
        balance: botData.balance.toNumber() / 1_000_000, // Convert to USDC
        totalTrades: botData.totalTrades.toNumber(),
        successfulTrades: botData.successfulTrades.toNumber(),
        winRate: winRate,
        lastTradeTimestamp: botData.lastTradeTimestamp.toNumber() > 0 
          ? new Date(botData.lastTradeTimestamp.toNumber() * 1000) 
          : null,
        createdAt: new Date(botData.createdAt.toNumber() * 1000),
        performance: {
          totalVolume: botData.totalTrades.toNumber() * (botData.strategy.tradeAmount.toNumber() / 1_000_000),
          avgTradeSize: botData.strategy.tradeAmount.toNumber() / 1_000_000,
          profitLoss: 0, // Will be calculated based on trade history
          dailyTrades: 0, // Will be calculated
        }
      }

      this.monitoredBots.set(botAccountPubkey, metrics)
      this.io.emit('botUpdate', metrics)

      // Send alert for new bot
      this.io.emit('alert', {
        id: Date.now().toString(),
        type: 'info',
        message: `Bot ${botAccountPubkey.slice(0, 8)}... added to monitoring`,
        timestamp: new Date()
      })

    } catch (error) {
      console.error(`Failed to add bot ${botAccountPubkey} to monitoring:`, error.message)
      throw error
    }
  }

  private async updateBotMetrics(botAccountPubkey: string): Promise<void> {
    try {
      const botAccount = new PublicKey(botAccountPubkey)
      const botData = await this.program.account.tradingBot.fetch(botAccount)
      
      const existing = this.monitoredBots.get(botAccountPubkey)
      if (!existing) return

      const winRate = botData.totalTrades.toNumber() > 0 
        ? (botData.successfulTrades.toNumber() / botData.totalTrades.toNumber()) * 100 
        : 0

      const newTrades = botData.totalTrades.toNumber() - existing.totalTrades
      const balanceChange = (botData.balance.toNumber() / 1_000_000) - existing.balance

      // Update metrics
      const updatedMetrics: BotMetrics = {
        ...existing,
        isActive: botData.isActive,
        balance: botData.balance.toNumber() / 1_000_000,
        totalTrades: botData.totalTrades.toNumber(),
        successfulTrades: botData.successfulTrades.toNumber(),
        winRate: winRate,
        lastTradeTimestamp: botData.lastTradeTimestamp.toNumber() > 0 
          ? new Date(botData.lastTradeTimestamp.toNumber() * 1000) 
          : existing.lastTradeTimestamp,
        performance: {
          ...existing.performance,
          totalVolume: botData.totalTrades.toNumber() * (botData.strategy.tradeAmount.toNumber() / 1_000_000),
          profitLoss: existing.performance.profitLoss + balanceChange,
        }
      }

      // Calculate daily trade rate
      const daysSinceCreation = (Date.now() - existing.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      updatedMetrics.performance.dailyTrades = daysSinceCreation > 0 ? updatedMetrics.totalTrades / daysSinceCreation : 0

      this.monitoredBots.set(botAccountPubkey, updatedMetrics)
      this.io.emit('botUpdate', updatedMetrics)

      // Send alerts for significant events
      if (newTrades > 0) {
        this.io.emit('alert', {
          id: Date.now().toString(),
          type: 'info',
          message: `Bot ${botAccountPubkey.slice(0, 8)}... executed ${newTrades} new trade${newTrades > 1 ? 's' : ''}`,
          timestamp: new Date(),
          botAccount: botAccountPubkey
        })
      }

      // Check for alerts
      this.checkAndSendAlerts(updatedMetrics)

    } catch (error) {
      console.error(`Failed to update bot ${botAccountPubkey}:`, error.message)
    }
  }

  private checkAndSendAlerts(bot: BotMetrics): void {
    const alerts = []

    // Low balance alert
    if (bot.balance < 1) {
      alerts.push({
        id: Date.now().toString(),
        type: 'warning' as const,
        message: `LOW BALANCE: Bot ${bot.botAccount.slice(0, 8)}... has $${bot.balance.toFixed(2)} remaining`,
        timestamp: new Date(),
        botAccount: bot.botAccount
      })
    }

    // Poor performance alert
    if (bot.totalTrades > 10 && bot.winRate < 30) {
      alerts.push({
        id: (Date.now() + 1).toString(),
        type: 'error' as const,
        message: `POOR PERFORMANCE: Bot ${bot.botAccount.slice(0, 8)}... has ${bot.winRate.toFixed(1)}% win rate`,
        timestamp: new Date(),
        botAccount: bot.botAccount
      })
    }

    // Inactive bot alert
    if (bot.isActive && bot.lastTradeTimestamp && Date.now() - bot.lastTradeTimestamp.getTime() > 24 * 60 * 60 * 1000) {
      alerts.push({
        id: (Date.now() + 2).toString(),
        type: 'warning' as const,
        message: `INACTIVE: Bot ${bot.botAccount.slice(0, 8)}... hasn't traded in 24+ hours`,
        timestamp: new Date(),
        botAccount: bot.botAccount
      })
    }

    // Send all alerts
    alerts.forEach(alert => {
      this.io.emit('alert', alert)
    })
  }

  private startMonitoring(): void {
    console.log('🚀 Starting WebSocket monitoring server...')
    
    // Add some default bots for demo (you can modify this)
    const demoBot = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" // Example bot account
    
    // Start monitoring loop
    this.updateInterval = setInterval(async () => {
      for (const botAccount of this.monitoredBots.keys()) {
        await this.updateBotMetrics(botAccount)
      }
      
      // Send price updates (mock data for now)
      this.io.emit('priceUpdate', {
        symbol: 'SOL/USDC',
        price: 45 + Math.random() * 10, // Mock price between $45-55
        change24h: (Math.random() - 0.5) * 10, // Random change ±5%
        timestamp: new Date()
      })
      
    }, 15000) // Update every 15 seconds

    console.log('📊 Monitoring active, updating every 15 seconds')
  }

  public async addBot(botAccount: string): Promise<void> {
    await this.addBotToMonitoring(botAccount)
  }

  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    this.io.close()
  }
}

// Create HTTP server and WebSocket monitor
const server = http.createServer()

const monitor = new WebSocketMonitor(server)

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🌐 WebSocket server running on port ${PORT}`)
  console.log(`📱 Connect your web UI to: http://localhost:${PORT}`)
})

// Add demo bots if provided via command line
const args = process.argv.slice(2)
if (args.length > 0) {
  console.log(`📋 Adding ${args.length} bot(s) to monitoring:`)
  args.forEach(async (botAccount, i) => {
    try {
      new PublicKey(botAccount) // Validate
      await monitor.addBot(botAccount)
      console.log(`   ${i + 1}. ${botAccount} ✅`)
    } catch (error) {
      console.log(`   ${i + 1}. ${botAccount} ❌ Invalid`)
    }
  })
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down WebSocket server...')
  monitor.stop()
  process.exit(0)
})