import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Zap, Mic, Touchpad, Eye, Activity, Target, RadioTower, Play, Pause, Square } from 'lucide-react'

interface NeuralState {
  syncLevel: number
  attention: number
  relaxation: number
  focus: number
  cognitiveLoad: number
  emotionalState: 'calm' | 'excited' | 'focused' | 'relaxed'
  brainwavePattern: 'alpha' | 'beta' | 'theta' | 'delta' | 'gamma'
}

interface VoiceCommand {
  id: string
  command: string
  action: string
  confidence: number
  timestamp: number
}

interface GesturePattern {
  type: 'swipe' | 'pinch' | 'rotate' | 'tap' | 'hover'
  direction?: 'up' | 'down' | 'left' | 'right'
  intensity: number
  duration: number
}

interface NeuralInterfaceProps {
  active: boolean
  onNeuralSync: (state: NeuralState) => void
  onVoiceCommand: (command: VoiceCommand) => void
  onGesture: (gesture: GesturePattern) => void
  onAttentionChange: (attention: number) => void
}

export function NeuralInterface({ 
  active, 
  onNeuralSync, 
  onVoiceCommand, 
  onGesture, 
  onAttentionChange 
}: NeuralInterfaceProps) {
  const [neuralState, setNeuralState] = useState<NeuralState>({
    syncLevel: 0,
    attention: 0,
    relaxation: 0,
    focus: 0,
    cognitiveLoad: 0,
    emotionalState: 'calm',
    brainwavePattern: 'alpha'
  })
  
  const [isListening, setIsListening] = useState(false)
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null)
  const [gestureHistory, setGestureHistory] = useState<GesturePattern[]>([])
  const [calibrationMode, setCalibrationMode] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const neuralSyncRef = useRef<number>()
  const gestureDetectionRef = useRef<number>()

  // Initialize neural synchronization
  useEffect(() => {
    if (!active) return

    const startNeuralSync = () => {
      neuralSyncRef.current = window.setInterval(() => {
        // Simulate neural data acquisition
        const newSyncLevel = Math.min(100, neuralState.syncLevel + (Math.random() - 0.3) * 5)
        const newAttention = Math.max(0, Math.min(100, 50 + Math.sin(Date.now() * 0.001) * 30))
        const newRelaxation = Math.max(0, Math.min(100, 60 + Math.cos(Date.now() * 0.0008) * 25))
        const newFocus = Math.max(0, Math.min(100, newAttention * 0.8 + newRelaxation * 0.2))
        const newCognitiveLoad = Math.max(0, Math.min(100, 100 - newRelaxation + Math.random() * 20))
        
        const emotionalStates: NeuralState['emotionalState'][] = ['calm', 'excited', 'focused', 'relaxed']
        const brainwavePatterns: NeuralState['brainwavePattern'][] = ['alpha', 'beta', 'theta', 'delta', 'gamma']
        
        const newState: NeuralState = {
          syncLevel: Math.max(0, newSyncLevel),
          attention: newAttention,
          relaxation: newRelaxation,
          focus: newFocus,
          cognitiveLoad: newCognitiveLoad,
          emotionalState: emotionalStates[Math.floor(Math.random() * emotionalStates.length)],
          brainwavePattern: brainwavePatterns[Math.floor(Math.random() * brainwavePatterns.length)]
        }
        
        setNeuralState(newState)
        onNeuralSync(newState)
        onAttentionChange(newAttention)
      }, 100)
    }

    startNeuralSync()

    return () => {
      if (neuralSyncRef.current) {
        clearInterval(neuralSyncRef.current)
      }
    }
  }, [active, neuralState.syncLevel, onNeuralSync, onAttentionChange])

  // Initialize voice recognition
  useEffect(() => {
    if (!active || !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-NG'

    recognitionRef.current.onresult = (event: any) => {
      const last = event.results.length - 1
      const command = event.results[last][0].transcript
      const confidence = event.results[last][0].confidence

      if (confidence > 0.7) {
        const voiceCommand: VoiceCommand = {
          id: `cmd-${Date.now()}`,
          command: command.toLowerCase(),
          action: processVoiceCommand(command.toLowerCase()),
          confidence: confidence * 100,
          timestamp: Date.now()
        }
        
        setLastCommand(voiceCommand)
        onVoiceCommand(voiceCommand)
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [active, onVoiceCommand])

  // Gesture detection simulation
  useEffect(() => {
    if (!active) return

    const detectGestures = () => {
      gestureDetectionRef.current = window.setInterval(() => {
        const gestureTypes: GesturePattern['type'][] = ['swipe', 'pinch', 'rotate', 'tap', 'hover']
        const directions: GesturePattern['direction'][] = ['up', 'down', 'left', 'right']
        
        const randomGesture: GesturePattern = {
          type: gestureTypes[Math.floor(Math.random() * gestureTypes.length)],
          direction: Math.random() > 0.5 ? directions[Math.floor(Math.random() * directions.length)] : undefined,
          intensity: Math.random() * 100,
          duration: Math.random() * 2000 + 500
        }
        
        setGestureHistory(prev => [...prev.slice(-9), randomGesture])
        onGesture(randomGesture)
      }, 2000)
    }

    detectGestures()

    return () => {
      if (gestureDetectionRef.current) {
        clearInterval(gestureDetectionRef.current)
      }
    }
  }, [active, onGesture])

  const processVoiceCommand = (command: string): string => {
    if (command.includes('open') || command.includes('launch')) {
      return 'launch_module'
    } else if (command.includes('close') || command.includes('exit')) {
      return 'exit_module'
    } else if (command.includes('citizen') || command.includes('profile')) {
      return 'citizen_profile'
    } else if (command.includes('wallet') || command.includes('finance')) {
      return 'financial_services'
    } else if (command.includes('government') || command.includes('services')) {
      return 'government_services'
    } else if (command.includes('quantum') || command.includes('security')) {
      return 'quantum_security'
    } else if (command.includes('help') || command.includes('assist')) {
      return 'help_system'
    } else if (command.includes('calibrate') || command.includes('sync')) {
      return 'neural_calibration'
    }
    return 'unknown_command'
  }

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const startCalibration = () => {
    setCalibrationMode(true)
    setNeuralState(prev => ({ ...prev, syncLevel: 0 }))
    
    setTimeout(() => {
      setCalibrationMode(false)
      setNeuralState(prev => ({ ...prev, syncLevel: 85 }))
    }, 5000)
  }

  const getBrainwaveColor = (pattern: NeuralState['brainwavePattern']) => {
    switch (pattern) {
      case 'alpha': return 'text-green-400'
      case 'beta': return 'text-yellow-400'
      case 'theta': return 'text-purple-400'
      case 'delta': return 'text-blue-400'
      case 'gamma': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getEmotionalColor = (state: NeuralState['emotionalState']) => {
    switch (state) {
      case 'calm': return 'text-blue-400'
      case 'excited': return 'text-red-400'
      case 'focused': return 'text-green-400'
      case 'relaxed': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Neural Sync Overlay */}
      <motion.div
        className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-cyan-400/30 pointer-events-auto"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <Brain className="w-8 h-8 text-cyan-400" />
            <motion.div
              className="absolute inset-0 bg-cyan-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <div>
            <h3 className="text-white font-bold">Neural Interface</h3>
            <p className="text-cyan-300 text-sm">Sync Level: {neuralState.syncLevel.toFixed(1)}%</p>
          </div>
        </div>

        {/* Neural Metrics */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Attention</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-cyan-400"
                  animate={{ width: `${neuralState.attention}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              <span className="text-green-400 text-xs font-mono">{neuralState.attention.toFixed(0)}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Relaxation</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                  animate={{ width: `${neuralState.relaxation}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              <span className="text-purple-400 text-xs font-mono">{neuralState.relaxation.toFixed(0)}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Focus</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                  animate={{ width: `${neuralState.focus}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              <span className="text-yellow-400 text-xs font-mono">{neuralState.focus.toFixed(0)}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Cognitive Load</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-400 to-pink-400"
                  animate={{ width: `${neuralState.cognitiveLoad}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              <span className="text-red-400 text-xs font-mono">{neuralState.cognitiveLoad.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Brainwave Pattern */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">Brainwave Pattern</span>
            <span className={`text-sm font-mono ${getBrainwaveColor(neuralState.brainwavePattern)}`}>
              {neuralState.brainwavePattern.toUpperCase()}
            </span>
          </div>
          <div className="h-8 bg-gray-900 rounded-lg overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20"
              animate={{
                x: [-100, 100, -100]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <div className="relative z-10 h-full flex items-center justify-center">
              <Activity className={`w-4 h-4 ${getBrainwaveColor(neuralState.brainwavePattern)}`} />
            </div>
          </div>
        </div>

        {/* Emotional State */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Emotional State</span>
            <span className={`text-sm font-semibold ${getEmotionalColor(neuralState.emotionalState)}`}>
              {neuralState.emotionalState.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-2">
          <motion.button
            onClick={toggleVoiceRecognition}
            className={`p-2 rounded-lg transition-colors ${
              isListening 
                ? 'bg-red-500/20 border-red-400/30 text-red-400' 
                : 'bg-green-500/20 border-green-400/30 text-green-400'
            } border`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isListening ? 'Stop Voice Recognition' : 'Start Voice Recognition'}
          >
            {isListening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>

          <motion.button
            onClick={startCalibration}
            className="p-2 bg-blue-500/20 border-blue-400/30 text-blue-400 rounded-lg border transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Calibrate Neural Sync"
          >
            <Target className="w-4 h-4" />
          </motion.button>

          <motion.button
            className="p-2 bg-purple-500/20 border-purple-400/30 text-purple-400 rounded-lg border transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Neural Settings"
          >
            <Brain className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Last Command Display */}
      <AnimatePresence>
        {lastCommand && (
          <motion.div
            className="absolute top-4 left-4 bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-green-400/30 pointer-events-auto"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center space-x-3">
              <RadioTower className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-white font-medium text-sm">Voice Command</p>
                <p className="text-green-300 text-xs">"{lastCommand.command}"</p>
                <p className="text-white/60 text-xs">Confidence: {lastCommand.confidence.toFixed(1)}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calibration Overlay */}
      <AnimatePresence>
        {calibrationMode && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center mx-auto mb-6"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360]
                }}
                transition={{
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                }}
              >
                <Brain className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-4">Neural Calibration</h2>
              <p className="text-cyan-300 text-lg mb-8">Synchronizing with your brainwave patterns...</p>
              <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GestureInterface({ active, onGesture }: { active: boolean, onGesture: (gesture: GesturePattern) => void }) {
  const [currentGesture, setCurrentGesture] = useState<GesturePattern | null>(null)
  const [gestureZones, setGestureZones] = useState<Array<{x: number, y: number, active: boolean}>>([])

  useEffect(() => {
    if (!active) return

    // Initialize gesture zones
    const zones = Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) * 33.33,
      y: Math.floor(i / 3) * 33.33,
      active: false
    }))
    setGestureZones(zones)

    const simulateGestures = () => {
      const interval = setInterval(() => {
        const gestureTypes: GesturePattern['type'][] = ['swipe', 'pinch', 'rotate', 'tap', 'hover']
        const directions: GesturePattern['direction'][] = ['up', 'down', 'left', 'right']
        
        const gesture: GesturePattern = {
          type: gestureTypes[Math.floor(Math.random() * gestureTypes.length)],
          direction: Math.random() > 0.5 ? directions[Math.floor(Math.random() * directions.length)] : undefined,
          intensity: Math.random() * 100,
          duration: Math.random() * 2000 + 500
        }
        
        setCurrentGesture(gesture)
        onGesture(gesture)
        
        setTimeout(() => setCurrentGesture(null), 1000)
      }, 3000)

      return () => clearInterval(interval)
    }

    const cleanup = simulateGestures()
    return cleanup
  }, [active, onGesture])

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Gesture Zones */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {gestureZones.map((zone, index) => (
          <motion.div
            key={index}
            className="border border-cyan-400/10 relative overflow-hidden"
            animate={{
              backgroundColor: zone.active ? 'rgba(0, 255, 255, 0.1)' : 'transparent'
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20"
              animate={{
                opacity: zone.active ? [0, 0.5, 0] : 0
              }}
              transition={{ duration: 1 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Current Gesture Display */}
      {currentGesture && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-cyan-400/30"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center"
              animate={{
                rotate: currentGesture.type === 'rotate' ? 360 : 0,
                scale: currentGesture.type === 'pinch' ? [1, 0.8, 1] : 1
              }}
              transition={{ duration: 1, repeat: currentGesture.type === 'rotate' ? Infinity : 0 }}
            >
              <Touchpad className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-white font-bold capitalize">{currentGesture.type}</h3>
              {currentGesture.direction && (
                <p className="text-cyan-300 text-sm">{currentGesture.direction}</p>
              )}
              <p className="text-white/60 text-xs">Intensity: {currentGesture.intensity.toFixed(0)}%</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function NeuralVisualization({ neuralState }: { neuralState: NeuralState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 300
    canvas.height = 200

    const drawVisualization = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw brainwave pattern
      const centerY = canvas.height / 2
      const amplitude = 50
      const frequency = 0.02
      
      ctx.strokeStyle = '#00ffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      for (let x = 0; x < canvas.width; x += 2) {
        const y = centerY + Math.sin(x * frequency + Date.now() * 0.01) * amplitude * (neuralState.attention / 100)
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.stroke()

      // Draw neural activity points
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const intensity = neuralState.focus / 100
        
        ctx.fillStyle = `rgba(0, 255, 255, ${intensity})`
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const interval = setInterval(drawVisualization, 50)
    return () => clearInterval(interval)
  }, [neuralState])

  return (
    <div className="bg-black/50 rounded-lg p-4 border border-cyan-400/30">
      <h4 className="text-white font-medium mb-3">Neural Activity</h4>
      <canvas
        ref={canvasRef}
        className="w-full h-32 rounded-lg border border-gray-700"
      />
      <div className="mt-2 text-xs text-cyan-300">
        Pattern: {neuralState.brainwavePattern.toUpperCase()}
      </div>
    </div>
  )
}