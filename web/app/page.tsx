'use client'

import React from 'react'
import { useWebSocket } from '../lib/WebSocketContext'
import MetricCard from '../components/MetricCard'
import BotCard from '../components/BotCard'
import { 
  Bot, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Activity,
  BarChart3,
  Plus,
  Sparkles,
  Zap
} from 'lucide-react'

export default function Dashboard() {
  const { bots, alerts, isConnected } = useWebSocket()

  // Calculate portfolio metrics
  const totalBots = bots.length
  const activeBots = bots.filter(bot => bot.isActive).length
  const totalBalance = bots.reduce((sum, bot) => sum + bot.balance, 0)
  const totalTrades = bots.reduce((sum, bot) => sum + bot.totalTrades, 0)
  const totalPnL = bots.reduce((sum, bot) => sum + bot.performance.profitLoss, 0)
  const avgWinRate = totalBots > 0 ? bots.reduce((sum, bot) => sum + bot.winRate, 0) / totalBots : 0
  const recentAlerts = alerts.slice(0, 5)

  const handlePauseBot = async (botAccount: string) => {
    console.log('Pausing bot:', botAccount)
    // TODO: Implement pause bot functionality
  }

  const handleResumeBot = async (botAccount: string) => {
    console.log('Resuming bot:', botAccount)
    // TODO: Implement resume bot functionality
  }

  return (
    <div className="min-h-screen p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="relative mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
              <h1 className="text-4xl font-bold gradient-text">
                Trading Dashboard
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Monitor your automated trading bots and portfolio performance
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                {isConnected && (
                  <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                )}
              </div>
              <span className="text-white font-medium">
                {isConnected ? 'Live Data' : 'Disconnected'}
              </span>
            </div>
            
            {/* Create Bot Button */}
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create Bot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
        <MetricCard
          title="Total Bots"
          value={totalBots}
          icon={Bot}
          gradient="from-blue-500 to-cyan-500"
        />
        
        <MetricCard
          title="Active Bots"
          value={activeBots}
          change={activeBots > 0 ? `${activeBots}/${totalBots}` : undefined}
          icon={Activity}
          gradient="from-emerald-500 to-teal-500"
          changeType="positive"
        />
        
        <MetricCard
          title="Portfolio Balance"
          value={`$${totalBalance.toFixed(2)}`}
          icon={DollarSign}
          gradient="from-indigo-500 to-purple-500"
        />
        
        <MetricCard
          title="Total Trades"
          value={totalTrades}
          icon={BarChart3}
          gradient="from-purple-500 to-pink-500"
        />
        
        <MetricCard
          title="P&L"
          value={`$${totalPnL.toFixed(2)}`}
          changeType={totalPnL >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          gradient={totalPnL >= 0 ? 'from-emerald-500 to-green-500' : 'from-red-500 to-rose-500'}
        />
        
        <MetricCard
          title="Avg Win Rate"
          value={`${avgWinRate.toFixed(1)}%`}
          icon={Zap}
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Bots Section */}
        <div className="xl:col-span-2">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                <Bot className="h-6 w-6 text-blue-400" />
                <span>Trading Bots</span>
                <span className="text-slate-400 text-lg">({bots.length})</span>
              </h2>
            </div>
            
            {bots.length === 0 ? (
              <div className="card-glass text-center py-16">
                <div className="relative">
                  <Bot className="h-20 w-20 text-slate-400 mx-auto mb-6 animate-float" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Bots Found</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Get started by creating and deploying your first automated trading bot to begin earning passive income.
                </p>
                <button className="btn-primary text-lg px-8 py-4">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Bot
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {bots.map((bot) => (
                  <BotCard
                    key={bot.botAccount}
                    bot={bot}
                    onPause={handlePauseBot}
                    onResume={handleResumeBot}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts Sidebar */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
              <span>Recent Alerts</span>
            </h2>
          </div>
          
          <div className="card-glass">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative">
                  <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full"></div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                <p className="text-slate-400">No recent alerts to display</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className={`
                      relative flex items-start space-x-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02]
                      ${alert.type === 'error' 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : alert.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                      }
                    `}
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInRight 0.5s ease-out forwards'
                    }}
                  >
                    <div className={`
                      p-2 rounded-xl
                      ${alert.type === 'error' 
                        ? 'bg-red-500/20' 
                        : alert.type === 'warning'
                        ? 'bg-amber-500/20'
                        : 'bg-blue-500/20'
                      }
                    `}>
                      <AlertTriangle className={`
                        h-5 w-5
                        ${alert.type === 'error' 
                          ? 'text-red-400' 
                          : alert.type === 'warning'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                        }
                      `} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium mb-1">
                        {alert.message}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}