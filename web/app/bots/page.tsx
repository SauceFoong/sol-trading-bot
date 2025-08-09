'use client'

import React, { useState } from 'react'
import { useWebSocket } from '../../lib/WebSocketContext'
import BotCard from '../../components/BotCard'
import { Bot, Plus, Search } from 'lucide-react'

export default function BotsPage() {
  const { bots } = useWebSocket()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStrategy, setFilterStrategy] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Filter bots based on search and filters
  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.botAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.strategy.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStrategy = filterStrategy === 'all' || 
                           bot.strategy.toLowerCase() === filterStrategy.toLowerCase()
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && bot.isActive) ||
                         (filterStatus === 'paused' && !bot.isActive)

    return matchesSearch && matchesStrategy && matchesStatus
  })

  const strategies = Array.from(new Set(bots.map(bot => bot.strategy)))

  const handlePauseBot = async (botAccount: string) => {
    console.log('Pausing bot:', botAccount)
    // TODO: Implement pause bot functionality
  }

  const handleResumeBot = async (botAccount: string) => {
    console.log('Resuming bot:', botAccount)
    // TODO: Implement resume bot functionality
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trading Bots</h1>
            <p className="text-gray-600">
              Manage and monitor all your automated trading bots
            </p>
          </div>
          
          <button className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Bot
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bots by account or strategy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Strategy Filter */}
          <div>
            <select
              value={filterStrategy}
              onChange={(e) => setFilterStrategy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Strategies</option>
              {strategies.map(strategy => (
                <option key={strategy} value={strategy}>{strategy}</option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bot Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{bots.length}</div>
          <div className="text-sm text-gray-500">Total Bots</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {bots.filter(bot => bot.isActive).length}
          </div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {bots.filter(bot => !bot.isActive).length}
          </div>
          <div className="text-sm text-gray-500">Paused</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {strategies.length}
          </div>
          <div className="text-sm text-gray-500">Strategies</div>
        </div>
      </div>

      {/* Bots List */}
      {filteredBots.length === 0 ? (
        <div className="card text-center py-16">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {bots.length === 0 ? 'No Bots Found' : 'No Matching Bots'}
          </h3>
          <p className="text-gray-600 mb-6">
            {bots.length === 0 
              ? 'Get started by creating your first automated trading bot'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {bots.length === 0 && (
            <button className="btn-primary">
              Create Your First Bot
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBots.map((bot) => (
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
  )
}