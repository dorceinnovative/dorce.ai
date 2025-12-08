'use client'

import { useEffect, useState } from 'react'
import DorceAILogo from '@/components/DorceAILogo'

export default function BootSequence() {
  const steps = [
    'Power-On Self-Test',
    'Loading Kernel Modules',
    'Mounting File Systems',
    'Starting Core Services',
    'Establishing Secure Channels',
    'Boot Complete'
  ]
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i < steps.length ? i + 1 : i))
    }, 800)
    return () => clearInterval(timer)
  }, [])

  const progress = Math.min((index / steps.length) * 100, 100)

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 opacity-40" />
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#008751' : i % 3 === 1 ? '#FFD700' : 'rgba(255,255,255,0.7)',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: 0.6
            }}
          />
        ))}
      </div>
      <div className="relative z-10 w-full max-w-xl mx-auto px-6">
        <div className="flex items-center justify-center mb-6">
          <DorceAILogo size="large" />
        </div>
        <div className="text-center text-gray-300 mb-8">Starting Dorce OS...</div>
        <div className="space-y-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2 border border-gray-800">
              <span className="text-sm text-gray-300">{s}</span>
              <span className={`text-xs ${i < index ? 'text-green-400' : 'text-gray-600'}`}>{i < index ? 'OK' : '...'}</span>
            </div>
          ))}
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-gray-800">
          <div className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
