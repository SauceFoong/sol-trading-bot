'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  Bot, 
  Settings, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3, gradient: 'from-blue-400 to-cyan-400' },
  { name: 'Bots', href: '/bots', icon: Bot, gradient: 'from-purple-400 to-pink-400' },
  { name: 'Trading', href: '/trading', icon: TrendingUp, gradient: 'from-emerald-400 to-teal-400' },
  { name: 'Portfolio', href: '/portfolio', icon: Wallet, gradient: 'from-amber-400 to-orange-400' },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle, gradient: 'from-red-400 to-rose-400' },
  { name: 'Monitoring', href: '/monitoring', icon: Activity, gradient: 'from-indigo-400 to-blue-400' },
  { name: 'Settings', href: '/settings', icon: Settings, gradient: 'from-slate-400 to-gray-400' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-purple-600/5 to-transparent"></div>
      
      {/* Header */}
      <div className="relative flex items-center px-6 py-6 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <div className="ml-4">
          <h1 className="text-xl font-bold gradient-text">
            Solana Trading Bot
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Advanced DeFi Trading</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 relative">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                nav-item relative z-10
                ${isActive ? 'active' : ''}
              `}
            >
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-xl mr-3 transition-all duration-300
                ${isActive 
                  ? `bg-gradient-to-r ${item.gradient} shadow-lg` 
                  : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                }
              `}>
                <item.icon
                  className={`
                    h-5 w-5 transition-all duration-300
                    ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}
                  `}
                />
              </div>
              <span className="font-medium relative z-10">{item.name}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-l-full"></div>
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* Connection Status */}
      <div className="px-6 py-4 border-t border-slate-700/50 relative">
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Connected</p>
              <p className="text-xs text-slate-400">Localnet</p>
            </div>
          </div>
          <Zap className="h-4 w-4 text-emerald-400" />
        </div>
        
        {/* Performance indicator */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">Latency</span>
          <span className="text-emerald-400 font-medium">12ms</span>
        </div>
      </div>
      
      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
    </div>
  )
}