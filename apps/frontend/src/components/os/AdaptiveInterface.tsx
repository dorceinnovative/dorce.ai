import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, TrendingUp, Clock, Star, 
  Zap, Target, Sparkles, Activity,
  User, Settings, BarChart3, Eye, MousePointer
} from 'lucide-react'

interface UserBehavior {
  clicks: number
  hoverTime: number
  usageFrequency: number
  preferredTime: string[]
  interactionPattern: 'clicker' | 'hoverer' | 'scanner'
  colorPreference: 'dark' | 'light' | 'auto'
  animationPreference: 'minimal' | 'balanced' | 'rich'
  layoutDensity: 'compact' | 'comfortable' | 'spacious'
}

interface AdaptiveElement {
  id: string
  type: 'widget' | 'button' | 'card' | 'menu'
  priority: number
  usage: number
  lastUsed: number
  predictedNextUse: number
  confidence: number
}

interface Prediction {
  action: string
  confidence: number
  reasoning: string
  timestamp: number
}

export default function AdaptiveInterface() {
  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    clicks: 0,
    hoverTime: 0,
    usageFrequency: 0,
    preferredTime: [],
    interactionPattern: 'scanner',
    colorPreference: 'auto',
    animationPreference: 'balanced',
    layoutDensity: 'comfortable'
  })

  const [adaptiveElements, setAdaptiveElements] = useState<AdaptiveElement[]>([
    { id: 'wallet', type: 'widget', priority: 1, usage: 85, lastUsed: Date.now() - 300000, predictedNextUse: Date.now() + 600000, confidence: 0.9 },
    { id: 'notifications', type: 'menu', priority: 2, usage: 72, lastUsed: Date.now() - 600000, predictedNextUse: Date.now() + 900000, confidence: 0.8 },
    { id: 'government-services', type: 'card', priority: 3, usage: 68, lastUsed: Date.now() - 1200000, predictedNextUse: Date.now() + 1800000, confidence: 0.7 },
    { id: 'ai-assistant', type: 'widget', priority: 4, usage: 91, lastUsed: Date.now() - 180000, predictedNextUse: Date.now() + 300000, confidence: 0.95 },
    { id: 'security-settings', type: 'button', priority: 5, usage: 45, lastUsed: Date.now() - 3600000, predictedNextUse: Date.now() + 7200000, confidence: 0.6 },
    { id: 'analytics', type: 'widget', priority: 6, usage: 78, lastUsed: Date.now() - 900000, predictedNextUse: Date.now() + 1200000, confidence: 0.85 }
  ])

  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [eyeTracking, setEyeTracking] = useState({ x: 0, y: 0, focused: false })
  const [mouseHeatmap, setMouseHeatmap] = useState<number[][]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [aiLearning, setAiLearning] = useState(true)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const trackingRef = useRef({ clicks: 0, hoverTime: 0, startTime: Date.now() })

  // Initialize mouse heatmap
  useEffect(() => {
    const heatmap: number[][] = []
    for (let x = 0; x < 20; x++) {
      heatmap[x] = []
      for (let y = 0; y < 15; y++) {
        heatmap[x][y] = Math.random() * 0.3
      }
    }
    setMouseHeatmap(heatmap)
  }, [])

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulate AI predictions
  useEffect(() => {
    const generatePredictions = () => {
      const newPredictions: Prediction[] = [
        {
          action: 'Open Digital Wallet',
          confidence: 0.92,
          reasoning: 'Based on your daily pattern and current time',
          timestamp: Date.now()
        },
        {
          action: 'Check Government Services',
          confidence: 0.78,
          reasoning: 'Recent activity suggests upcoming interaction',
          timestamp: Date.now()
        },
        {
          action: 'Review Security Settings',
          confidence: 0.65,
          reasoning: 'Security update recommended after 7 days',
          timestamp: Date.now()
        }
      ]
      setPredictions(newPredictions)
    }

    generatePredictions()
    const interval = setInterval(generatePredictions, 30000)
    return () => clearInterval(interval)
  }, [])

  // Simulate eye tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setEyeTracking(prev => ({
        x: Math.sin(Date.now() * 0.001) * 100 + 200,
        y: Math.cos(Date.now() * 0.0015) * 50 + 150,
        focused: Math.random() > 0.7
      }))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Update mouse heatmap
  useEffect(() => {
    const interval = setInterval(() => {
      setMouseHeatmap(prev => 
        prev.map(row => 
          row.map(cell => {
            const decay = 0.95
            const random = Math.random() * 0.1
            return cell * decay + random
          })
        )
      )
    }, 200)
    return () => clearInterval(interval)
  }, [])

  // Track user interactions
  const trackInteraction = useCallback((type: 'click' | 'hover' | 'focus', elementId?: string) => {
    setUserBehavior(prev => {
      const updated = { ...prev }
      
      if (type === 'click') {
        updated.clicks += 1
        updated.interactionPattern = prev.clicks > 50 ? 'clicker' : prev.hoverTime > 30000 ? 'hoverer' : 'scanner'
      } else if (type === 'hover') {
        updated.hoverTime += 100
      }
      
      updated.usageFrequency = Math.min(100, (updated.clicks * 2 + updated.hoverTime / 1000) / 10)
      
      return updated
    })

    if (elementId) {
      setAdaptiveElements(prev => 
        prev.map(el => 
          el.id === elementId 
            ? { ...el, lastUsed: Date.now(), usage: Math.min(100, el.usage + 1) }
            : el
        )
      )
    }
  }, [])

  const getAdaptiveStyle = (element: AdaptiveElement) => {
    const baseSize = element.type === 'widget' ? 'w-64 h-32' : 
                    element.type === 'card' ? 'w-48 h-24' :
                    element.type === 'button' ? 'w-32 h-12' :
                    'w-40 h-16'
    
    const priorityMultiplier = element.priority * 0.1
    const usageMultiplier = element.usage / 100
    const confidenceMultiplier = element.confidence
    
    return {
      size: `${baseSize}`,
      opacity: 0.7 + (usageMultiplier * 0.3),
      scale: 1 + (priorityMultiplier * 0.1),
      glow: confidenceMultiplier > 0.8 ? 'shadow-lg shadow-purple-500/50' : ''
    }
  }

  const getPredictionColor = (confidence: number) => {
    if (confidence > 0.9) return 'from-green-400 to-emerald-400'
    if (confidence > 0.7) return 'from-blue-400 to-cyan-400'
    if (confidence > 0.5) return 'from-yellow-400 to-orange-400'
    return 'from-red-400 to-rose-400'
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 relative overflow-hidden"
      onClick={() => trackInteraction('click')}
    >
      {/* Eye Tracking Visualization */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <motion.div
          className="absolute w-4 h-4 bg-red-500 rounded-full opacity-50"
          style={{
            left: eyeTracking.x,
            top: eyeTracking.y,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: eyeTracking.focused ? 1.5 : 1,
            opacity: eyeTracking.focused ? 0.8 : 0.3
          }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Mouse Heatmap */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {mouseHeatmap.map((row, x) => 
          row.map((intensity, y) => (
            <div
              key={`${x}-${y}`}
              className="absolute w-8 h-8 rounded-full"
              style={{
                left: x * 40,
                top: y * 40,
                background: `radial-gradient(circle, rgba(147, 51, 234, ${intensity}) 0%, transparent 70%)`,
                filter: 'blur(4px)'
              }}
            />
          ))
        )}
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-20 mb-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Adaptive AI Interface
            </h1>
            <p className="text-purple-300">Learning your behavior patterns in real-time</p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.div 
              className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-white text-sm font-medium">
                  AI Learning: {aiLearning ? 'Active' : 'Paused'}
                </span>
              </div>
            </motion.div>
            <motion.button
              onClick={() => setAiLearning(!aiLearning)}
              className={`p-3 rounded-lg transition-all ${
                aiLearning 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* User Behavior Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <MousePointer className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">Total Clicks</span>
            </div>
            <div className="text-2xl font-bold text-white">{userBehavior.clicks}</div>
          </motion.div>
          
          <motion.div 
            className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">Hover Time</span>
            </div>
            <div className="text-2xl font-bold text-white">{Math.round(userBehavior.hoverTime / 1000)}s</div>
          </motion.div>
          
          <motion.div 
            className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">Usage Score</span>
            </div>
            <div className="text-2xl font-bold text-white">{Math.round(userBehavior.usageFrequency)}%</div>
          </motion.div>
          
          <motion.div 
            className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">Pattern</span>
            </div>
            <div className="text-lg font-bold text-white capitalize">{userBehavior.interactionPattern}</div>
          </motion.div>
        </div>
      </motion.div>

      {/* AI Predictions Panel */}
      <motion.div 
        className="relative z-20 mb-8"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="bg-black bg-opacity-30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500 border-opacity-30">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">AI Predictions</h2>
            <span className="text-purple-400 text-sm">Next likely actions</span>
          </div>
          
          <div className="space-y-3">
            {predictions.map((prediction, index) => (
              <motion.div
                key={index}
                className={`bg-gradient-to-r ${getPredictionColor(prediction.confidence)} bg-opacity-20 rounded-lg p-4 border border-opacity-30 cursor-pointer`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(147, 51, 234, 0.2)' }}
                onClick={() => trackInteraction('click', `prediction-${index}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-white font-medium">{prediction.action}</div>
                    <div className="text-xs text-purple-300">{prediction.reasoning}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{Math.round(prediction.confidence * 100)}%</div>
                    <div className="text-xs text-purple-400">Confidence</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Adaptive Elements Grid */}
      <motion.div 
        className="relative z-20 mb-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="flex items-center space-x-2 mb-6">
          <Target className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Adaptive Interface Elements</h2>
          <span className="text-purple-400 text-sm">Prioritized based on your usage</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {adaptiveElements.map((element, index) => {
            const style = getAdaptiveStyle(element)
            const timeUntilUse = Math.max(0, element.predictedNextUse - Date.now())
            
            return (
              <motion.div
                key={element.id}
                className={`${style.size} bg-black bg-opacity-30 backdrop-blur-xl rounded-xl border border-purple-500 border-opacity-30 cursor-pointer relative overflow-hidden`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: style.opacity, 
                  scale: style.scale,
                  boxShadow: style.glow
                }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ 
                  scale: style.scale * 1.1,
                  boxShadow: '0 0 30px rgba(147, 51, 234, 0.5)'
                }}
                onMouseEnter={() => trackInteraction('hover', element.id)}
                onClick={() => trackInteraction('click', element.id)}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div className="text-white font-medium text-center text-sm mb-2 capitalize">
                    {element.id.replace('-', ' ')}
                  </div>
                  <div className="text-purple-400 text-xs mb-1">
                    Usage: {element.usage}%
                  </div>
                  <div className="text-purple-300 text-xs">
                    Next: {Math.round(timeUntilUse / 60000)}min
                  </div>
                  <div className="text-green-400 text-xs font-bold">
                    {Math.round(element.confidence * 100)}% confident
                  </div>
                </div>
                
                {/* Confidence indicator */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-cyan-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${element.confidence * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Learning Visualization */}
      <motion.div 
        className="relative z-20"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
      >
        <div className="bg-black bg-opacity-30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500 border-opacity-30">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Learning Visualization</h2>
            <span className="text-purple-400 text-sm">Real-time adaptation metrics</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Interaction Pattern */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 bg-opacity-20 rounded-lg p-4 border border-purple-500 border-opacity-30">
              <div className="flex items-center space-x-2 mb-3">
                <Eye className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">Interaction Pattern</h3>
              </div>
              <div className="text-2xl font-bold text-white mb-2 capitalize">
                {userBehavior.interactionPattern}
              </div>
              <div className="text-purple-300 text-sm">
                Based on {userBehavior.clicks} clicks and {Math.round(userBehavior.hoverTime / 1000)}s hover time
              </div>
            </div>
            
            {/* Learning Rate */}
            <div className="bg-gradient-to-br from-green-600 to-teal-600 bg-opacity-20 rounded-lg p-4 border border-green-500 border-opacity-30">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-medium">Learning Rate</h3>
              </div>
              <motion.div 
                className="text-2xl font-bold text-white mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {Math.round(userBehavior.usageFrequency)}%
              </motion.div>
              <div className="text-green-300 text-sm">
                AI confidence in predicting your actions
              </div>
            </div>
            
            {/* Adaptation Score */}
            <div className="bg-gradient-to-br from-orange-600 to-red-600 bg-opacity-20 rounded-lg p-4 border border-orange-500 border-opacity-30">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-medium">Adaptation Score</h3>
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {Math.round(adaptiveElements.reduce((acc, el) => acc + el.confidence, 0) / adaptiveElements.length * 100)}%
              </div>
              <div className="text-orange-300 text-sm">
                Interface optimization effectiveness
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating AI Assistant */}
      <motion.div
        className="fixed bottom-8 right-8 z-30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <motion.button
          className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl backdrop-blur-xl"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: [
              '0 0 30px rgba(147, 51, 234, 0.6)',
              '0 0 50px rgba(6, 182, 212, 0.6)',
              '0 0 30px rgba(147, 51, 234, 0.6)'
            ]
          }}
          transition={{
            boxShadow: {
              duration: 3,
              repeat: Infinity
            }
          }}
        >
          <Brain className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </div>
  )
}
