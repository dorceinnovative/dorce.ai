import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Users, DollarSign, Shield, Zap, Globe, Brain, Heart, 
  TrendingUp, Activity, BarChart3, PieChart, Network, Wifi, 
  Camera, Mic, Settings, X, Maximize2, Minimize2, RefreshCw,
  ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX
} from 'lucide-react'

interface OSModule {
  id: string
  name: string
  category: 'government' | 'finance' | 'utilities' | 'communication' | 'ai' | 'security'
  icon: React.ReactNode
  color: string
  description: string
  features: string[]
  status: 'active' | 'maintenance' | 'offline'
  metrics: {
    efficiency: number
    users: number
    uptime: number
    satisfaction: number
  }
  immersiveMode: '3d' | 'holographic' | 'neural' | 'quantum'
}

interface ImmersiveState {
  currentModule: OSModule | null
  isFullscreen: boolean
  ambientMode: boolean
  interactionMode: 'gesture' | 'voice' | 'touch' | 'eye-tracking'
  visualIntensity: number
  audioEnabled: boolean
  hapticFeedback: boolean
  neuralSync: boolean
}

const OS_MODULES: OSModule[] = [
  {
    id: 'government-central',
    name: 'Government Central',
    category: 'government',
    icon: <Building2 className="w-8 h-8" />,
    color: 'from-blue-600 to-cyan-400',
    description: 'Unified government operations and citizen services platform',
    features: ['Digital Identity', 'E-Governance', 'Public Services', 'Policy Management'],
    status: 'active',
    metrics: { efficiency: 94, users: 1250000, uptime: 99.9, satisfaction: 87 },
    immersiveMode: 'holographic'
  },
  {
    id: 'financial-nexus',
    name: 'Financial Nexus',
    category: 'finance',
    icon: <DollarSign className="w-8 h-8" />,
    color: 'from-green-600 to-emerald-400',
    description: 'Advanced financial ecosystem with quantum-secure transactions',
    features: ['Quantum Banking', 'Real-time Trading', 'Digital Currency', 'Risk Analysis'],
    status: 'active',
    metrics: { efficiency: 97, users: 850000, uptime: 100, satisfaction: 92 },
    immersiveMode: 'quantum'
  },
  {
    id: 'energy-grid',
    name: 'Smart Energy Grid',
    category: 'utilities',
    icon: <Zap className="w-8 h-8" />,
    color: 'from-yellow-600 to-orange-400',
    description: 'AI-powered energy distribution and optimization system',
    features: ['Smart Grid', 'Renewable Integration', 'Demand Forecasting', 'Energy Trading'],
    status: 'active',
    metrics: { efficiency: 89, users: 2100000, uptime: 99.7, satisfaction: 84 },
    immersiveMode: 'neural'
  },
  {
    id: 'communication-hub',
    name: 'Communication Hub',
    category: 'communication',
    icon: <Globe className="w-8 h-8" />,
    color: 'from-purple-600 to-pink-400',
    description: 'Next-generation communication infrastructure',
    features: ['Quantum Networks', 'Holographic Calls', 'AI Translation', 'Secure Messaging'],
    status: 'active',
    metrics: { efficiency: 91, users: 3200000, uptime: 99.8, satisfaction: 89 },
    immersiveMode: '3d'
  },
  {
    id: 'ai-cortex',
    name: 'AI Cortex',
    category: 'ai',
    icon: <Brain className="w-8 h-8" />,
    color: 'from-indigo-600 to-violet-400',
    description: 'Central artificial intelligence and machine learning platform',
    features: ['Neural Networks', 'Predictive Analytics', 'Autonomous Systems', 'Learning Algorithms'],
    status: 'active',
    metrics: { efficiency: 96, users: 450000, uptime: 99.5, satisfaction: 94 },
    immersiveMode: 'neural'
  },
  {
    id: 'security-shield',
    name: 'Security Shield',
    category: 'security',
    icon: <Shield className="w-8 h-8" />,
    color: 'from-red-600 to-rose-400',
    description: 'Advanced cybersecurity and threat protection system',
    features: ['Quantum Encryption', 'Threat Detection', 'Access Control', 'Incident Response'],
    status: 'active',
    metrics: { efficiency: 98, users: 1800000, uptime: 100, satisfaction: 91 },
    immersiveMode: 'quantum'
  }
]

export default function ImmersiveOSModules() {
  const [state, setState] = useState<ImmersiveState>({
    currentModule: null,
    isFullscreen: false,
    ambientMode: false,
    interactionMode: 'gesture',
    visualIntensity: 0.8,
    audioEnabled: true,
    hapticFeedback: true,
    neuralSync: false
  })
  
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })
  const [pulseIntensity, setPulseIntensity] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Immersive ambient effects
  useEffect(() => {
    if (!state.ambientMode) return

    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x + 0.5,
        y: prev.y + 0.3,
        z: prev.z + 0.2
      }))
      setPulseIntensity(prev => (prev + 0.1) % (2 * Math.PI))
    }, 50)

    return () => clearInterval(interval)
  }, [state.ambientMode])

  // Neural synchronization simulation
  useEffect(() => {
    if (!state.neuralSync) return

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        visualIntensity: 0.6 + Math.sin(Date.now() * 0.001) * 0.3
      }))
    }, 100)

    return () => clearInterval(interval)
  }, [state.neuralSync])

  const enterModule = (module: OSModule) => {
    setState(prev => ({
      ...prev,
      currentModule: module,
      isFullscreen: true
    }))

    // Simulate haptic feedback
    if (state.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(100)
    }
  }

  const exitModule = () => {
    setState(prev => ({
      ...prev,
      currentModule: null,
      isFullscreen: false
    }))
  }

  const toggleInteractionMode = () => {
    const modes: ImmersiveState['interactionMode'][] = ['gesture', 'voice', 'touch', 'eye-tracking']
    const currentIndex = modes.indexOf(state.interactionMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    
    setState(prev => ({ ...prev, interactionMode: nextMode }))
  }

  const renderImmersiveBackground = (module: OSModule) => {
    const baseGradient = `bg-gradient-to-br ${module.color}`
    
    switch (module.immersiveMode) {
      case '3d':
        return (
          <div 
            className={`absolute inset-0 ${baseGradient} opacity-20`}
            style={{
              transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div 
              className="absolute inset-4 border-2 border-white/20 rounded-3xl"
              style={{ transform: 'translateZ(50px)' }}
            />
            <div 
              className="absolute inset-8 border border-white/10 rounded-2xl"
              style={{ transform: 'translateZ(100px)' }}
            />
          </div>
        )
      
      case 'holographic':
        return (
          <div className="absolute inset-0">
            <div className={`absolute inset-0 ${baseGradient} opacity-30`} />
            <div 
              className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent"
              style={{
                transform: `translateY(${Math.sin(pulseIntensity) * 20}px)`,
                filter: 'blur(1px)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse" />
            <div className="absolute inset-0 backdrop-blur-sm" />
          </div>
        )
      
      case 'neural':
        return (
          <div className="absolute inset-0">
            <div className={`absolute inset-0 ${baseGradient} opacity-25`} />
            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent"
                  style={{
                    left: `${(i / 19) * 100}%`,
                    transform: `translateX(${Math.sin(pulseIntensity + i * 0.5) * 10}px)`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
          </div>
        )
      
      case 'quantum':
        return (
          <div className="absolute inset-0">
            <div className={`absolute inset-0 ${baseGradient} opacity-20`} />
            <div className="absolute inset-0">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-white/10"
                  style={{
                    width: `${10 + i * 4}px`,
                    height: `${10 + i * 4}px`,
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) scale(${1 + Math.sin(pulseIntensity + i * 0.2) * 0.1})`,
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-spin" style={{ animationDuration: '20s' }} />
          </div>
        )
      
      default:
        return <div className={`absolute inset-0 ${baseGradient} opacity-20`} />
    }
  }

  const renderModuleContent = (module: OSModule) => {
    const { metrics } = module
    
    return (
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color}`}>
              {module.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{module.name}</h1>
              <p className="text-white/60">{module.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleInteractionMode}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={`Interaction: ${state.interactionMode}`}
            >
              {state.interactionMode === 'gesture' && <Users className="w-5 h-5 text-white" />}
              {state.interactionMode === 'voice' && <Mic className="w-5 h-5 text-white" />}
              {state.interactionMode === 'touch' && <Activity className="w-5 h-5 text-white" />}
              {state.interactionMode === 'eye-tracking' && <Camera className="w-5 h-5 text-white" />}
            </button>
            
            <button
              onClick={() => setState(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }))}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              {state.audioEnabled ? 
                <Volume2 className="w-5 h-5 text-white" /> : 
                <VolumeX className="w-5 h-5 text-white" />
              }
            </button>
            
            <button
              onClick={() => setState(prev => ({ ...prev, ambientMode: !prev.ambientMode }))}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            
            <button
              onClick={exitModule}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-xs text-white/60">Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.efficiency}%</div>
              <div className="text-xs text-green-400">+2.3% from last month</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-white/60">Active Users</span>
              </div>
              <div className="text-2xl font-bold text-white">{(metrics.users / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-blue-400">+5.7% from last month</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-white/60">Uptime</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.uptime}%</div>
              <div className="text-xs text-purple-400">Last downtime: 2 days ago</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-xs text-white/60">Satisfaction</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.satisfaction}%</div>
              <div className="text-xs text-red-400">+1.2% from last month</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Core Features</h3>
              <div className="space-y-3">
                {module.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-white to-white/50 rounded-full" />
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">System Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-sm capitalize">{module.status}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Response Time</span>
                  <span className="text-white text-sm">23ms</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Load Average</span>
                  <span className="text-white text-sm">12.3%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Memory Usage</span>
                  <span className="text-white text-sm">4.2GB / 32GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatePresence mode="wait">
        {!state.currentModule ? (
          <motion.div
            key="modules-grid"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="p-8"
          >
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">Immersive OS Modules</h1>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                Experience the future of operating systems with immersive, full-screen modules powered by quantum computing and AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {OS_MODULES.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="relative group cursor-pointer"
                  onClick={() => enterModule(module)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.color} rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
                  
                  <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-6 mx-auto`}>
                      {module.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white text-center mb-3">{module.name}</h3>
                    <p className="text-white/60 text-center mb-6">{module.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      {module.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-white to-white/50 rounded-full" />
                          <span className="text-white/80 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          module.status === 'active' ? 'bg-green-400 animate-pulse' :
                          module.status === 'maintenance' ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`} />
                        <span className="text-white/60 text-sm capitalize">{module.status}</span>
                      </div>
                      
                      <div className="text-white/40 text-sm">
                        {module.immersiveMode}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-sm">System Online</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <span className="text-white/60 text-sm">{OS_MODULES.length} Modules Available</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="immersive-module"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50"
          >
            {renderImmersiveBackground(state.currentModule)}
            {renderModuleContent(state.currentModule)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}