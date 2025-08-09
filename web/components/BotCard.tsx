'use client'

import React from 'react'
import { BotMetrics } from '../types'
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Pause, 
  Play,
  ExternalLink,
  Zap,
  Clock,
  Target,
  DollarSign
} from 'lucide-react'

interface BotCardProps {
  bot: BotMetrics
  onPause: (botAccount: string) => void
  onResume: (botAccount: string) => void
}

const strategyGradients = {
  'gridTrading': 'from-blue-500 to-cyan-500',
  'dca': 'from-purple-500 to-pink-500',
  'arbitrage': 'from-emerald-500 to-teal-500',
  'meanReversion': 'from-orange-500 to-amber-500'
}

const strategyNames = {
  'gridTrading': 'Grid Trading',
  'dca': 'DCA Strategy',
  'arbitrage': 'Arbitrage',
  'meanReversion': 'Mean Reversion'
}

export default function BotCard({ bot, onPause, onResume }: BotCardProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`
  const formatPercent = (value: number) => `${value.toFixed(1)}%`
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const profitLossColor = bot.performance.profitLoss >= 0 ? 'performance-positive' : 'performance-negative'
  const profitLossIcon = bot.performance.profitLoss >= 0 ? TrendingUp : TrendingDown
  const gradient = strategyGradients[bot.strategy as keyof typeof strategyGradients] || strategyGradients.gridTrading
  const strategyName = strategyNames[bot.strategy as keyof typeof strategyNames] || bot.strategy

  return (
    <div className="group relative overflow-hidden">
      {/* Main card background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 transition-all duration-500 group-hover:border-slate-600/50 group-hover:shadow-2xl group-hover:shadow-blue-500/10"></div>
      
      {/* Animated background gradient */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-r ${gradient} rounded-3xl`}></div>
      
      {/* Content */}
      <div className="relative p-8 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${gradient} shadow-lg`}>
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {strategyName}
              </h3>
              <div className="flex items-center space-x-2">
                <code className="text-sm text-slate-400 font-mono bg-slate-800/50 px-2 py-1 rounded-lg">
                  {bot.botAccount.slice(0, 8)}...{bot.botAccount.slice(-4)}
                </code>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={bot.isActive ? 'status-active' : 'status-paused'}>
              {bot.isActive ? (
                <>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2"></div>
                  Active
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                  Paused
                </>
              )}
            </span>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => bot.isActive ? onPause(bot.botAccount) : onResume(bot.botAccount)}
                className="p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/50 text-slate-200 hover:text-white transition-all duration-300 hover:scale-105"
                title={bot.isActive ? 'Pause Bot' : 'Resume Bot'}
              >
                {bot.isActive ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
              
              <a
                href={`https://explorer.solana.com/address/${bot.botAccount}?cluster=localnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/50 text-slate-200 hover:text-white transition-all duration-300 hover:scale-105"
                title="View on Explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
            <DollarSign className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(bot.balance)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Balance</div>
          </div>
          
          <div className="text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
            <Target className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">
              {bot.totalTrades}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Trades</div>
          </div>
          
          <div className="text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
            <Zap className="h-6 w-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">
              {formatPercent(bot.winRate)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Win Rate</div>
          </div>
          
          <div className="text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
            <div className={`flex items-center justify-center mb-2`}>
              {React.createElement(profitLossIcon, { className: `h-6 w-6 ${profitLossColor}` })}
            </div>
            <div className={`text-2xl font-bold mb-1 ${profitLossColor}`}>
              {formatCurrency(bot.performance.profitLoss)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">P&L</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-2xl bg-slate-800/20 border border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div>
              <span className="text-slate-400 text-sm">Volume</span>
              <div className="text-white font-semibold">{formatCurrency(bot.performance.totalVolume)}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <div>
              <span className="text-slate-400 text-sm">Avg Trade</span>
              <div className="text-white font-semibold">{formatCurrency(bot.performance.avgTradeSize)}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="h-4 w-4 text-slate-400" />
            <div>
              <span className="text-slate-400 text-sm">Last Trade</span>
              <div className="text-white font-semibold">{formatTimeAgo(bot.lastTradeTimestamp)}</div>
            </div>
          </div>
        </div>
        
        {/* Performance indicator line */}
        <div className="mt-6 h-1 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
            style={{ width: `${Math.min(100, Math.max(0, bot.winRate))}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}