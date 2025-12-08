'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Wallet, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Globe,
  Mic,
  Hand,
  Eye,
  Cpu
} from 'lucide-react'
import { useOSKernel } from '@/lib/os-kernel-context'

interface AppIcon {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  quantumState: 'stable' | 'excited' | 'superposed'
  position: { x: number; y: number }
  size: number
  rotation: number
  pulsePhase: number
}

interface QuantumParticle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'electron' | 'photon' | 'quark' | 'boson'
}

interface GesturePoint {
  x: number
  y: number
  timestamp: number
  pressure: number
}

export default function RevolutionaryOSDashboard() {
  const [apps, setApps] = useState<AppIcon[]>([])
  const [particles, setParticles] = useState<QuantumParticle[]>([])
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isGestureMode, setIsGestureMode] = useState(false)
  const [hologramIntensity, setHologramIntensity] = useState(0.7)
  const [neuralActivity, setNeuralActivity] = useState<number[]>([])
  const [quantumField, setQuantumField] = useState<number[][]>([])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gestureCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const os = useOSKernel()

  // Initialize quantum field
  useEffect(() => {
    const field: number[][] = []
    for (let i = 0; i < 50; i++) {
      field[i] = []
      for (let j = 0; j < 50; j++) {
        field[i][j] = Math.random() * 2 - 1
      }
    }
    setQuantumField(field)
  }, [])

  // Initialize apps with quantum properties
  useEffect(() => {
    const initialApps: AppIcon[] = [
      {
        id: 'wallet',
        name: 'Quantum Wallet',
        icon: <Wallet className="w-8 h-8" />,
        color: 'from-emerald-400 via-teal-500 to-cyan-600',
        quantumState: 'stable',
        position: { x: 20, y: 20 },
        size: 1,
        rotation: 0,
        pulsePhase: 0
      },
      {
        id: 'marketplace',
        name: 'Holographic Marketplace',
        icon: <Globe className="w-8 h-8" />,
        color: 'from-purple-400 via-violet-500 to-indigo-600',
        quantumState: 'superposed',
        position: { x: 35, y: 15 },
        size: 1.2,
        rotation: 45,
        pulsePhase: Math.PI / 4
      },
      {
        id: 'investment',
        name: 'Neural Investment AI',
        icon: <TrendingUp className="w-8 h-8" />,
        color: 'from-orange-400 via-red-500 to-pink-600',
        quantumState: 'excited',
        position: { x: 50, y: 25 },
        size: 0.9,
        rotation: -30,
        pulsePhase: Math.PI / 2
      },
      {
        id: 'chat',
        name: 'Consciousness Stream',
        icon: <MessageSquare className="w-8 h-8" />,
        color: 'from-blue-400 via-sky-500 to-blue-600',
        quantumState: 'stable',
        position: { x: 15, y: 45 },
        size: 1.1,
        rotation: 15,
        pulsePhase: Math.PI
      },
      {
        id: 'identity',
        name: 'Quantum Identity',
        icon: <Shield className="w-8 h-8" />,
        color: 'from-green-400 via-emerald-500 to-teal-600',
        quantumState: 'superposed',
        position: { x: 70, y: 30 },
        size: 1,
        rotation: -45,
        pulsePhase: 3 * Math.PI / 4
      },
      {
        id: 'neural',
        name: 'Neural Core',
        icon: <Brain className="w-8 h-8" />,
        color: 'from-yellow-400 via-amber-500 to-orange-600',
        quantumState: 'excited',
        position: { x: 40, y: 60 },
        size: 1.3,
        rotation: 60,
        pulsePhase: Math.PI / 6
      }
    ]
    setApps(initialApps)
  }, [])

  // Quantum particle system
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prevParticles => {
        const canvas = canvasRef.current
        if (!canvas) return prevParticles

        const newParticles = prevParticles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 1,
            vx: particle.vx + (Math.random() - 0.5) * 0.1,
            vy: particle.vy + (Math.random() - 0.5) * 0.1
          }))
          .filter(particle => particle.life > 0)

        // Add new particles
        if (newParticles.length < 100) {
          for (let i = 0; i < 3; i++) {
            newParticles.push({
              id: `particle-${Date.now()}-${i}`,
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: Math.random() * 100 + 50,
              maxLife: 150,
              color: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0000'][Math.floor(Math.random() * 5)],
              size: Math.random() * 3 + 1,
              type: ['electron', 'photon', 'quark', 'boson'][Math.floor(Math.random() * 4)] as any
            })
          }
        }

        return newParticles
      })
    }

    const interval = setInterval(animateParticles, 50)
    return () => clearInterval(interval)
  }, [])

  // Neural activity simulation
  useEffect(() => {
    const updateNeuralActivity = () => {
      setNeuralActivity(prev => {
        const newActivity = [...prev]
        if (newActivity.length > 50) newActivity.shift()
        newActivity.push(Math.random() * 100)
        return newActivity
      })
    }

    const interval = setInterval(updateNeuralActivity, 100)
    return () => clearInterval(interval)
  }, [])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw quantum field
      if (quantumField.length > 0) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
        ctx.lineWidth = 1
        
        for (let i = 0; i < quantumField.length - 1; i++) {
          for (let j = 0; j < quantumField[i].length - 1; j++) {
            const x = (i / quantumField.length) * canvas.width
            const y = (j / quantumField[i].length) * canvas.height
            const intensity = Math.abs(quantumField[i][j])
            
            ctx.beginPath()
            ctx.arc(x, y, intensity * 5, 0, Math.PI * 2)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife
        ctx.fillStyle = particle.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw particle trail
        ctx.strokeStyle = particle.color.replace('rgb', 'rgba').replace(')', `, ${alpha * 0.3})`)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(particle.x - particle.vx * 10, particle.y - particle.vy * 10)
        ctx.stroke()
      })

      requestAnimationFrame(render)
    }

    render()
  }, [particles, quantumField])

  // Voice control handler
  const handleVoiceCommand = (command: string) => {
    setIsVoiceActive(true)
    // Process voice commands
    setTimeout(() => setIsVoiceActive(false), 2000)
  }

  // Gesture recognition
  const handleGesture = (gesturePoints: GesturePoint[]) => {
    if (gesturePoints.length < 3) return

    // Simple gesture recognition
    const firstPoint = gesturePoints[0]
    const lastPoint = gesturePoints[gesturePoints.length - 1]
    
    const deltaX = lastPoint.x - firstPoint.x
    const deltaY = lastPoint.y - firstPoint.y
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 50) {
        // Swipe right - open next app
        console.log('Gesture: Swipe Right')
      } else if (deltaX < -50) {
        // Swipe left - open previous app
        console.log('Gesture: Swipe Left')
      }
    } else {
      if (deltaY > 50) {
        // Swipe down - minimize
        console.log('Gesture: Swipe Down')
      } else if (deltaY < -50) {
        // Swipe up - maximize
        console.log('Gesture: Swipe Up')
      }
    }
  }

  // App interaction handlers
  const handleAppHover = (appId: string) => {
    setApps(prev => prev.map(app => 
      app.id === appId 
        ? { ...app, quantumState: 'excited', size: app.size * 1.2 }
        : { ...app, quantumState: 'stable', size: Math.max(app.size * 0.98, 0.8) }
    ))
  }

  const handleAppClick = (appId: string) => {
    // Create particle explosion
    const app = apps.find(a => a.id === appId)
    if (app) {
      const newParticles: QuantumParticle[] = []
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: `explosion-${Date.now()}-${i}`,
          x: app.position.x * 10,
          y: app.position.y * 10,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 50,
          maxLife: 50,
          color: '#ffffff',
          size: Math.random() * 5 + 2,
          type: 'photon'
        })
      }
      setParticles(prev => [...prev, ...newParticles])
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)'
      }}
    >
      {/* Quantum Field Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        width={1920}
        height={1080}
      />

      {/* Holographic Background Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-blue-500/5 to-transparent animate-spin" style={{ animationDuration: '20s' }} />
      </div>

      {/* Neural Activity Visualization */}
      <div className="absolute top-4 left-4 w-64 h-32">
        <svg width="256" height="128" className="opacity-60">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ff00ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffff00" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <polyline
            points={neuralActivity.map((value, index) => `${index * 5},${128 - value}`).join(' ')}
            fill="none"
            stroke="url(#neuralGradient)"
            strokeWidth="2"
            className="drop-shadow-lg"
          />
        </svg>
        <div className="text-cyan-400 text-xs mt-1 font-mono">Neural Activity: {neuralActivity[neuralActivity.length - 1]?.toFixed(1) || 0}%</div>
      </div>

      {/* Quantum App Grid */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-16 p-16">
          {apps.map((app) => (
            <motion.div
              key={app.id}
              className="relative group cursor-pointer"
              onHoverStart={() => handleAppHover(app.id)}
              onHoverEnd={() => handleAppHover('')}
              onClick={() => handleAppClick(app.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Quantum Orb */}
              <div className={`
                relative w-32 h-32 rounded-full bg-gradient-to-br ${app.color}
                shadow-2xl transition-all duration-500
                ${app.quantumState === 'excited' ? 'animate-pulse shadow-cyan-500/50' : ''}
                ${app.quantumState === 'superposed' ? 'animate-bounce' : ''}
              `}>
                {/* Inner Quantum Core */}
                <div className="absolute inset-4 rounded-full bg-black/20 backdrop-blur-sm">
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
                </div>

                {/* App Icon */}
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  {app.icon}
                </div>

                {/* Quantum Particles */}
                <div className="absolute inset-0 rounded-full">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateX(${60 * app.size}px)`
                      }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* App Name */}
              <motion.div 
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-cyan-300 text-sm font-medium tracking-wide">
                  {app.name}
                </div>
                <div className="text-xs text-purple-400 opacity-70 mt-1">
                  {app.quantumState.toUpperCase()}
                </div>
              </motion.div>

              {/* Holographic Info Panel */}
              <AnimatePresence>
                {app.quantumState === 'excited' && (
                  <motion.div
                    className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-lg p-3 border border-cyan-500/30"
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="text-cyan-300 text-xs font-mono">
                      Quantum State: {app.quantumState}
                    </div>
                    <div className="text-purple-300 text-xs font-mono">
                      Entropy: {(Math.random() * 100).toFixed(2)}%
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <motion.div 
          className="flex items-center space-x-6 bg-black/60 backdrop-blur-xl rounded-full p-4 border border-purple-500/30"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {/* Voice Control */}
          <motion.button
            className={`p-3 rounded-full transition-all ${
              isVoiceActive 
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50' 
                : 'bg-gray-800 text-cyan-400 hover:bg-gray-700'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVoiceCommand('toggle')}
          >
            <Mic className="w-5 h-5" />
          </motion.button>

          {/* Gesture Control */}
          <motion.button
            className={`p-3 rounded-full transition-all ${
              isGestureMode 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50' 
                : 'bg-gray-800 text-purple-400 hover:bg-gray-700'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsGestureMode(!isGestureMode)}
          >
            <Hand className="w-5 h-5" />
          </motion.button>

          {/* Hologram Intensity */}
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-purple-400" />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={hologramIntensity}
              onChange={(e) => setHologramIntensity(parseFloat(e.target.value))}
              className="w-20 accent-purple-500"
            />
          </div>

          {/* Quantum Core Status */}
          <motion.div
            className="flex items-center space-x-2"
            animate={{ 
              color: ['#00ffff', '#ff00ff', '#ffff00', '#00ffff']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Cpu className="w-5 h-5" />
            <span className="text-xs font-mono">Core: Active</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Gesture Canvas */}
      {isGestureMode && (
        <canvas
          ref={gestureCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          width={1920}
          height={1080}
        />
      )}
    </div>
  )
}
