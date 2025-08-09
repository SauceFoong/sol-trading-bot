'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { BotMetrics, Alert, PriceData } from '../types'

interface WebSocketContextType {
  socket: Socket | null
  bots: BotMetrics[]
  alerts: Alert[]
  prices: PriceData[]
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  bots: [],
  alerts: [],
  prices: [],
  isConnected: false
})

export const useWebSocket = () => useContext(WebSocketContext)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [bots, setBots] = useState<BotMetrics[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [prices, setPrices] = useState<PriceData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to monitoring server')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from monitoring server')
    })

    newSocket.on('botUpdate', (botMetrics: BotMetrics) => {
      setBots(prevBots => {
        const index = prevBots.findIndex(bot => bot.botAccount === botMetrics.botAccount)
        if (index >= 0) {
          const newBots = [...prevBots]
          newBots[index] = botMetrics
          return newBots
        } else {
          return [...prevBots, botMetrics]
        }
      })
    })

    newSocket.on('alert', (alert: Alert) => {
      setAlerts(prevAlerts => [alert, ...prevAlerts.slice(0, 49)]) // Keep last 50 alerts
    })

    newSocket.on('priceUpdate', (priceData: PriceData) => {
      setPrices(prevPrices => {
        const index = prevPrices.findIndex(p => p.symbol === priceData.symbol)
        if (index >= 0) {
          const newPrices = [...prevPrices]
          newPrices[index] = priceData
          return newPrices
        } else {
          return [...prevPrices, priceData]
        }
      })
    })

    return () => {
      newSocket.close()
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ socket, bots, alerts, prices, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  )
}