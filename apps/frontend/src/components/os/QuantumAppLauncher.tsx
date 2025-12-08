import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { Search, Mic, Settings, User, Globe, Shield, DollarSign, Home, Car, Briefcase, Heart, Zap, Brain, Satellite, Atom, Orbit, Sparkles } from 'lucide-react'

interface AppOrb {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  size: number
  category: 'government' | 'finance' | 'utilities' | 'communication' | 'ai' | 'security'
  quantumState: number
}

interface QuantumField {
  x: number
  y: number
  intensity: number
  phase: number
}

export default function QuantumAppLauncher() {
  const [orbs, setOrbs] = useState<AppOrb[]>([])
  const [quantumField, setQuantumField] = useState<QuantumField[][]>([])
  const [selectedOrb, setSelectedOrb] = useState<string | null>(null)
  const [hoveredOrb, setHoveredOrb] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [gestureMode, setGestureMode] = useState(false)
  const [quantumEntanglement, setQuantumEntanglement] = useState<number[][]>([])
  
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  const voiceRef = useRef<any | null>(null)

  const springX = useSpring(0, { stiffness: 100, damping: 30 })
  const springY = useSpring(0, { stiffness: 100, damping: 30 })
  const rotateX = useTransform(springY, [-300, 300], [15, -15])
  const rotateY = useTransform(springX, [-300, 300], [-15, 15])

  const apps = [
    { id: 'gov-services', name: 'Government Services', icon: <Shield className="w-8 h-8" />, color: 'from-blue-500 to-cyan-400', category: 'government' as const },
    { id: 'digital-wallet', name: 'Digital Wallet', icon: <DollarSign className="w-8 h-8" />, color: 'from-green-500 to-emerald-400', category: 'finance' as const },
    { id: 'identity-vault', name: 'Identity Vault', icon: <User className="w-8 h-8" />, color: 'from-purple-500 to-violet-400', category: 'security' as const },
    { id: 'smart-home', name: 'Smart Home', icon: <Home className="w-8 h-8" />, color: 'from-orange-500 to-amber-400', category: 'utilities' as const },
    { id: 'transport', name: 'Transport Hub', icon: <Car className="w-8 h-8" />, color: 'from-red-500 to-rose-400', category: 'utilities' as const },
    { id: 'business-portal', name: 'Business Portal', icon: <Briefcase className="w-8 h-8" />, color: 'from-indigo-500 to-blue-400', category: 'government' as const },
    { id: 'health-ai', name: 'Health AI', icon: <Heart className="w-8 h-8" />, color: 'from-pink-500 to-rose-400', category: 'ai' as const },
    { id: 'energy-grid', name: 'Energy Grid', icon: <Zap className="w-8 h-8" />, color: 'from-yellow-500 to-orange-400', category: 'utilities' as const },
    { id: 'neural-core', name: 'Neural Core', icon: <Brain className="w-8 h-8" />, color: 'from-teal-500 to-cyan-400', category: 'ai' as const },
    { id: 'satellite-comms', name: 'Satellite Comms', icon: <Satellite className="w-8 h-8" />, color: 'from-slate-500 to-gray-400', category: 'communication' as const },
    { id: 'quantum-vault', name: 'Quantum Vault', icon: <Atom className="w-8 h-8" />, color: 'from-cyan-500 to-blue-400', category: 'security' as const },
    { id: 'global-network', name: 'Global Network', icon: <Globe className="w-8 h-8" />, color: 'from-emerald-500 to-green-400', category: 'communication' as const },
  ]

  const initializeOrbs = useCallback(() => {
    const newOrbs: AppOrb[] = apps.map((app, index) => ({
      ...app,
      position: {
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600,
        z: (Math.random() - 0.5) * 400
      },
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2
      },
      size: 60 + Math.random() * 40,
      quantumState: Math.random() * Math.PI * 2
    }))
    setOrbs(newOrbs)
  }, [])

  const initializeQuantumField = useCallback(() => {
    const field: QuantumField[][] = []
    for (let x = 0; x < 20; x++) {
      field[x] = []
      for (let y = 0; y < 15; y++) {
        field[x][y] = {
          x: x * 40,
          y: y * 40,
          intensity: Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2
        }
      }
    }
    setQuantumField(field)
  }, [])

  const calculateQuantumEntanglement = useCallback(() => {
    const entanglement: number[][] = []
    for (let i = 0; i < orbs.length; i++) {
      entanglement[i] = []
      for (let j = 0; j < orbs.length; j++) {
        if (i !== j) {
          const distance = Math.sqrt(
            Math.pow(orbs[i].position.x - orbs[j].position.x, 2) +
            Math.pow(orbs[i].position.y - orbs[j].position.y, 2) +
            Math.pow(orbs[i].position.z - orbs[j].position.z, 2)
          )
          entanglement[i][j] = Math.exp(-distance / 200) * Math.sin(Date.now() * 0.001 + i + j)
        } else {
          entanglement[i][j] = 0
        }
      }
    }
    setQuantumEntanglement(entanglement)
  }, [orbs])

  const updatePhysics = useCallback(() => {
    setOrbs(prevOrbs => {
      return prevOrbs.map((orb, index) => {
        let { x, y, z } = orb.position
        let { x: vx, y: vy, z: vz } = orb.velocity

        // Mouse attraction
        const mouseX = (mouseRef.current.x - 400) * 2
        const mouseY = (mouseRef.current.y - 300) * 2
        const attractionForce = 0.0005
        
        vx += (mouseX - x) * attractionForce
        vy += (mouseY - y) * attractionForce

        // Quantum uncertainty
        const quantumForce = 0.3
        vx += (Math.random() - 0.5) * quantumForce
        vy += (Math.random() - 0.5) * quantumForce
        vz += (Math.random() - 0.5) * quantumForce * 0.5

        // Orbital motion
        const centerForce = 0.001
        const distance = Math.sqrt(x * x + y * y + z * z)
        if (distance > 0) {
          vx -= (x / distance) * centerForce
          vy -= (y / distance) * centerForce
          vz -= (z / distance) * centerForce * 0.5
        }

        // Damping
        vx *= 0.98
        vy *= 0.98
        vz *= 0.98

        // Update position
        x += vx
        y += vy
        z += vz

        // Boundary constraints
        const boundary = 500
        if (Math.abs(x) > boundary) vx *= -0.8
        if (Math.abs(y) > boundary) vy *= -0.8
        if (Math.abs(z) > 250) vz *= -0.8

        return {
          ...orb,
          position: { x, y, z },
          velocity: { x: vx, y: vy, z: vz },
          quantumState: orb.quantumState + 0.02
        }
      })
    })

    // Update quantum field
    setQuantumField(prevField => 
      prevField.map(row => 
        row.map(field => ({
          ...field,
          intensity: 0.3 + Math.sin(Date.now() * 0.003 + field.phase) * 0.2,
          phase: field.phase + 0.05
        }))
      )
    )

    calculateQuantumEntanglement()
  }, [calculateQuantumEntanglement])

  const animate = useCallback(() => {
    updatePhysics()
    animationRef.current = requestAnimationFrame(animate)
  }, [updatePhysics])

  useEffect(() => {
    initializeOrbs()
    initializeQuantumField()
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
        springX.set(e.clientX - rect.left - rect.width / 2)
        springY.set(e.clientY - rect.top - rect.height / 2)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [springX, springY])

  const filteredOrbs = orbs.filter(orb => 
    orb.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const launchApp = (appId: string) => {
    setSelectedOrb(appId)
    // Add quantum teleportation effect
    setTimeout(() => {
      console.log(`Launching app: ${appId}`)
      // Implement actual app launch logic here
    }, 800)
  }

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode)
    const WSR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!isVoiceMode && WSR) {
      const recognition = new WSR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-NG'
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from((event as any).results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
        
        setSearchQuery(transcript.toLowerCase())
      }
      
      recognition.start()
      voiceRef.current = recognition
    } else if (voiceRef.current) {
      voiceRef.current.stop()
      voiceRef.current = null
    }
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden"
      style={{ perspective: '2000px' }}
    >
      {/* Quantum Field Background */}
      <div className="absolute inset-0">
        {quantumField.map((row, x) => 
          row.map((field, y) => (
            <motion.div
              key={`${x}-${y}`}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: field.x,
                top: field.y,
                background: `radial-gradient(circle, rgba(147, 51, 234, ${field.intensity}) 0%, transparent 70%)`,
                filter: 'blur(1px)'
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [field.intensity, field.intensity * 1.5, field.intensity]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: (x + y) * 0.1
              }}
            />
          ))
        )}
      </div>

      {/* Quantum Entanglement Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {quantumEntanglement.map((row, i) => 
          row.map((strength, j) => {
            if (i >= j || strength < 0.1) return null
            const orb1 = orbs[i]
            const orb2 = orbs[j]
            if (!orb1 || !orb2) return null
            
            return (
              <motion.line
                key={`${i}-${j}`}
                x1={orb1.position.x + orb1.size / 2}
                y1={orb1.position.y + orb1.size / 2}
                x2={orb2.position.x + orb2.size / 2}
                y2={orb2.position.y + orb2.size / 2}
                stroke="rgba(147, 51, 234, 0.3)"
                strokeWidth={strength * 3}
                filter="url(#glow)"
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                  strokeWidth: [strength * 2, strength * 4, strength * 2]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            )
          })
        )}
      </svg>

      {/* App Orbs */}
      <motion.div
        className="absolute inset-0"
        style={{ 
          rotateX, 
          rotateY,
          transformStyle: 'preserve-3d'
        }}
      >
        <AnimatePresence>
          {filteredOrbs.map((orb, index) => (
            <motion.div
              key={orb.id}
              className={`absolute cursor-pointer rounded-full bg-gradient-to-br ${orb.color} shadow-2xl`}
              style={{
                width: orb.size,
                height: orb.size,
                left: `calc(50% + ${orb.position.x}px - ${orb.size / 2}px)`,
                top: `calc(50% + ${orb.position.y}px - ${orb.size / 2}px)`,
                transform: `translateZ(${orb.position.z}px)`,
                boxShadow: `
                  0 0 ${orb.size / 4}px rgba(147, 51, 234, 0.5),
                  inset 0 0 ${orb.size / 8}px rgba(255, 255, 255, 0.2)
                `
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: hoveredOrb === orb.id ? 1.3 : 1,
                opacity: 1,
                rotate: orb.quantumState * 180 / Math.PI
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                delay: index * 0.05
              }}
              onMouseEnter={() => setHoveredOrb(orb.id)}
              onMouseLeave={() => setHoveredOrb(null)}
              onClick={() => launchApp(orb.id)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white">
                {orb.icon}
              </div>
              
              {/* Quantum Aura */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, transparent 30%, rgba(147, 51, 234, 0.3) 70%, transparent 100%)`,
                  filter: 'blur(8px)'
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* App Name */}
              <AnimatePresence>
                {hoveredOrb === orb.id && (
                  <motion.div
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {orb.name}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Search and Controls */}
      <motion.div 
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-xl rounded-2xl p-4 border border-purple-500 border-opacity-30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quantum apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-purple-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>
          
          <motion.button
            onClick={toggleVoiceMode}
            className={`p-3 rounded-lg transition-all ${
              isVoiceMode 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Mic className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={() => setGestureMode(!gestureMode)}
            className={`p-3 rounded-lg transition-all ${
              gestureMode 
                ? 'bg-green-500 text-white' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Status Indicators */}
      <motion.div 
        className="absolute bottom-8 left-8 text-white text-sm"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="bg-black bg-opacity-50 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Quantum Field Active</span>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isVoiceMode ? 'bg-red-400 animate-pulse' : 'bg-gray-400'}`} />
            <span>Voice Recognition {isVoiceMode ? 'Active' : 'Offline'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${gestureMode ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span>Gesture Control {gestureMode ? 'Active' : 'Offline'}</span>
          </div>
        </div>
      </motion.div>

      {/* App Categories */}
      <motion.div 
        className="absolute bottom-8 right-8"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="bg-black bg-opacity-50 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30">
          <div className="grid grid-cols-2 gap-2 text-xs text-white">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span>Government</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span>Finance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full" />
              <span>Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full" />
              <span>Utilities</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-teal-400 rounded-full" />
              <span>AI Services</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-slate-400 rounded-full" />
              <span>Communication</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
