import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cpu, MemoryStick, HardDrive, Network, 
  Activity, Zap, Shield, Globe, Users, 
  DollarSign, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Settings, X
} from 'lucide-react'

interface HolographicData {
  id: string
  label: string
  value: number
  max: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  icon: React.ReactNode
  color: string
}

interface AuroraEffect {
  x: number
  y: number
  radius: number
  color: string
  intensity: number
  phase: number
}

export default function HolographicUI() {
  const [systemData, setSystemData] = useState<HolographicData[]>([
    {
      id: 'cpu',
      label: 'Neural Processing',
      value: 67,
      max: 100,
      unit: '%',
      status: 'normal',
      icon: <Cpu className="w-6 h-6" />,
      color: 'from-blue-400 to-cyan-300'
    },
    {
      id: 'memory',
      label: 'Quantum Memory',
      value: 82,
      max: 100,
      unit: '%',
      status: 'warning',
      icon: <MemoryStick className="w-6 h-6" />,
      color: 'from-purple-400 to-violet-300'
    },
    {
      id: 'storage',
      label: 'Data Storage',
      value: 45,
      max: 100,
      unit: '%',
      status: 'normal',
      icon: <HardDrive className="w-6 h-6" />,
      color: 'from-green-400 to-emerald-300'
    },
    {
      id: 'network',
      label: 'Network Activity',
      value: 91,
      max: 100,
      unit: '%',
      status: 'critical',
      icon: <Network className="w-6 h-6" />,
      color: 'from-orange-400 to-amber-300'
    },
    {
      id: 'security',
      label: 'Security Status',
      value: 98,
      max: 100,
      unit: '%',
      status: 'normal',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-red-400 to-rose-300'
    },
    {
      id: 'users',
      label: 'Active Citizens',
      value: 23456789,
      max: 25000000,
      unit: 'users',
      status: 'normal',
      icon: <Users className="w-6 h-6" />,
      color: 'from-teal-400 to-cyan-300'
    }
  ])

  const [auroraEffects, setAuroraEffects] = useState<AuroraEffect[]>([])
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [glassIntensity, setGlassIntensity] = useState(0.7)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize aurora effects
  useEffect(() => {
    const effects: AuroraEffect[] = []
    for (let i = 0; i < 8; i++) {
      effects.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        radius: 50 + Math.random() * 150,
        color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'][i],
        intensity: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      })
    }
    setAuroraEffects(effects)
  }, [])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemData(prev => prev.map(item => {
        const variation = (Math.random() - 0.5) * 5
        const newValue = Math.max(0, Math.min(item.max, item.value + variation))
        
        let status: 'normal' | 'warning' | 'critical' = 'normal'
        if (newValue > 90) status = 'critical'
        else if (newValue > 75) status = 'warning'

        return {
          ...item,
          value: newValue,
          status
        }
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Animate aurora effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAuroraEffects(prev => prev.map(effect => ({
        ...effect,
        x: effect.x + (Math.random() - 0.5) * 2,
        y: effect.y + (Math.random() - 0.5) * 2,
        intensity: 0.2 + Math.sin(Date.now() * 0.001 + effect.phase) * 0.3,
        phase: effect.phase + 0.02
      })))
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-400 border-red-400 bg-red-400 bg-opacity-10'
      case 'warning': return 'text-yellow-400 border-yellow-400 bg-yellow-400 bg-opacity-10'
      default: return 'text-green-400 border-green-400 bg-green-400 bg-opacity-10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 relative overflow-hidden"
    >
      {/* Aurora Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {auroraEffects.map((effect, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full filter blur-3xl"
            style={{
              left: `${effect.x}%`,
              top: `${effect.y}%`,
              width: effect.radius * 2,
              height: effect.radius * 2,
              background: `radial-gradient(circle, ${effect.color}${Math.floor(effect.intensity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [effect.intensity, effect.intensity * 1.5, effect.intensity]
            }}
            transition={{
              duration: 8 + index * 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Glassmorphism Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, ${glassIntensity * 0.1}) 0%, transparent 50%, rgba(0, 0, 0, ${glassIntensity * 0.3}) 100%)`,
          backdropFilter: `blur(${glassIntensity * 10}px)`
        }}
      />

      {/* Header */}
      <motion.div 
        className="relative z-10 mb-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Holographic OS Dashboard
            </h1>
            <p className="text-purple-300">Real-time system monitoring with quantum-enhanced visualization</p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.div 
              className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">System Online</span>
              </div>
            </motion.div>
            <motion.button
              className="bg-purple-600 bg-opacity-80 backdrop-blur-xl rounded-lg p-3 border border-purple-500 border-opacity-30 text-white hover:bg-purple-700 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {systemData.map((item, index) => (
          <motion.div
            key={item.id}
            className="bg-black bg-opacity-30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500 border-opacity-20 hover:border-opacity-40 transition-all duration-300"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(147, 51, 234, 0.3)'
            }}
            onClick={() => setShowDetails(showDetails === item.id ? null : item.id)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{item.label}</h3>
                  <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="capitalize">{item.status}</span>
                  </div>
                </div>
              </div>
              <motion.div
                className="text-right"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-2xl font-bold text-white">
                  {item.unit === 'users' ? (item.value / 1000000).toFixed(1) + 'M' : Math.round(item.value)}
                </div>
                <div className="text-purple-400 text-sm">{item.unit}</div>
              </motion.div>
            </div>

            {/* Progress Bar with Holographic Effect */}
            <div className="relative mb-4">
              <div className="w-full bg-gray-800 bg-opacity-50 rounded-full h-3 overflow-hidden">
                <motion.div 
                  className={`h-3 rounded-full bg-gradient-to-r ${item.color} relative overflow-hidden`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / item.max) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                >
                  {/* Animated shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </div>
              
              {/* Holographic glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${item.color.includes('blue') ? 'rgba(59, 130, 246, 0.3)' : item.color.includes('purple') ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'} 0%, transparent 70%)`,
                  filter: 'blur(8px)'
                }}
                animate={{
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity
                }}
              />
            </div>

            {/* Details Panel */}
            <AnimatePresence>
              {showDetails === item.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-purple-500 border-opacity-20 pt-4 mt-4"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-purple-300">
                      <span>Current Load:</span>
                      <span className="text-white">{Math.round(item.value)} {item.unit}</span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>Maximum Capacity:</span>
                      <span className="text-white">{item.max.toLocaleString()} {item.unit}</span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>Efficiency:</span>
                      <span className="text-white">{Math.round((item.value / item.max) * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>Status:</span>
                      <span className={`capitalize ${
                        item.status === 'critical' ? 'text-red-400' :
                        item.status === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Real-time Activity Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{
                    opacity: [1, 0.3, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity
                  }}
                />
                <span className="text-xs text-purple-400">Live</span>
              </div>
              <div className="text-xs text-purple-400">
                Updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Action Elements */}
      <motion.div
        className="fixed bottom-8 right-8 z-20"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.button
          className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl backdrop-blur-xl"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(147, 51, 234, 0.5)',
              '0 0 40px rgba(6, 182, 212, 0.5)',
              '0 0 20px rgba(147, 51, 234, 0.5)'
            ]
          }}
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Infinity
            }
          }}
        >
          <Activity className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Glass Intensity Control */}
      <motion.div
        className="fixed top-8 right-8 z-20"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30">
          <label className="text-white text-sm font-medium mb-2 block">Glass Effect</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={glassIntensity}
            onChange={(e) => setGlassIntensity(parseFloat(e.target.value))}
            className="w-32 accent-purple-500"
          />
          <div className="text-purple-400 text-xs mt-1">
            Intensity: {Math.round(glassIntensity * 100)}%
          </div>
        </div>
      </motion.div>
    </div>
  )
}