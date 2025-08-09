'use client'

import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor?: string
  gradient?: string
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-slate-400',
  gradient = 'from-blue-500 to-purple-500'
}: MetricCardProps) {
  const changeColorClass = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-slate-400'
  }[changeType]

  const ChangeIcon = changeType === 'positive' ? TrendingUp : 
                    changeType === 'negative' ? TrendingDown : null

  return (
    <div className="group relative overflow-hidden">
      {/* Background with hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 transition-all duration-300 group-hover:border-slate-600/50"></div>
      
      {/* Animated gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-r ${gradient} rounded-2xl`}></div>
      
      {/* Content */}
      <div className="relative p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-r ${gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          
          {change && ChangeIcon && (
            <div className={`flex items-center space-x-1 ${changeColorClass}`}>
              <ChangeIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">{change}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -top-10 -bottom-10 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
      </div>
    </div>
  )
}