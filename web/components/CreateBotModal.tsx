'use client'

import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { X, Bot } from 'lucide-react'
import { BotConfiguration, StrategyConfig } from '../types'

interface CreateBotModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateBot: (config: BotConfiguration) => Promise<void>
}

export default function CreateBotModal({ isOpen, onClose, onCreateBot }: CreateBotModalProps) {
  const [botConfig, setBotConfig] = useState<BotConfiguration>({
    botName: '',
    strategy: {
      strategyType: 'GridTrading',
      tokenA: 'So11111111111111111111111111111111111111112', // SOL
      tokenB: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      buyThreshold: 40,
      sellThreshold: 60,
      maxSlippage: 0.5,
      tradeAmount: 1,
    },
    initialBalance: 100,
    riskParameters: {
      maxPositionSize: 5,
      maxDailyLoss: 50,
      maxSlippage: 1,
      cooldownPeriod: 300,
      emergencyStopLoss: 10,
      maxDrawdown: 15,
      maxTradesPerDay: 50,
      minLiquidity: 1000,
    }
  })

  const [isCreating, setIsCreating] = useState(false)

  const strategyOptions = [
    { value: 'GridTrading', label: 'Grid Trading' },
    { value: 'DCA', label: 'Dollar Cost Averaging' },
    { value: 'Arbitrage', label: 'Arbitrage' },
    { value: 'MeanReversion', label: 'Mean Reversion' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      await onCreateBot(botConfig)
      onClose()
      // Reset form
      setBotConfig({
        ...botConfig,
        botName: '',
        initialBalance: 100,
      })
    } catch (error) {
      console.error('Failed to create bot:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const updateStrategy = (field: keyof StrategyConfig, value: any) => {
    setBotConfig(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        [field]: value
      }
    }))
  }

  const updateRiskParameters = (field: string, value: number) => {
    setBotConfig(prev => ({
      ...prev,
      riskParameters: {
        ...prev.riskParameters,
        [field]: value
      }
    }))
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Bot className="h-6 w-6 text-primary-600" />
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Create Trading Bot
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={botConfig.botName}
                    onChange={(e) => setBotConfig({...botConfig, botName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="My Grid Trading Bot"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Balance (USDC)
                  </label>
                  <input
                    type="number"
                    value={botConfig.initialBalance}
                    onChange={(e) => setBotConfig({...botConfig, initialBalance: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Strategy Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Strategy Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strategy Type
                  </label>
                  <select
                    value={botConfig.strategy.strategyType}
                    onChange={(e) => updateStrategy('strategyType', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {strategyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={botConfig.strategy.tradeAmount}
                    onChange={(e) => updateStrategy('tradeAmount', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="0.1"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buy Threshold ($)
                  </label>
                  <input
                    type="number"
                    value={botConfig.strategy.buyThreshold}
                    onChange={(e) => updateStrategy('buyThreshold', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sell Threshold ($)
                  </label>
                  <input
                    type="number"
                    value={botConfig.strategy.sellThreshold}
                    onChange={(e) => updateStrategy('sellThreshold', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Slippage (%)
                  </label>
                  <input
                    type="number"
                    value={botConfig.strategy.maxSlippage}
                    onChange={(e) => updateStrategy('maxSlippage', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Risk Management */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Position Size (%)
                  </label>
                  <input
                    type="number"
                    value={botConfig.riskParameters.maxPositionSize}
                    onChange={(e) => updateRiskParameters('maxPositionSize', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Daily Loss ($)
                  </label>
                  <input
                    type="number"
                    value={botConfig.riskParameters.maxDailyLoss}
                    onChange={(e) => updateRiskParameters('maxDailyLoss', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cooldown Period (seconds)
                  </label>
                  <input
                    type="number"
                    value={botConfig.riskParameters.cooldownPeriod}
                    onChange={(e) => updateRiskParameters('cooldownPeriod', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="60"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Trades Per Day
                  </label>
                  <input
                    type="number"
                    value={botConfig.riskParameters.maxTradesPerDay}
                    onChange={(e) => updateRiskParameters('maxTradesPerDay', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Bot'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}