import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Hand, Mic, Eye, Camera, Volume2, VolumeX, 
  Zap, Activity, Target, RadioTower, 
  Play, Pause, Square, RotateCcw, Settings,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  MousePointer, Touchpad, Speech
} from 'lucide-react'

interface Gesture {
  type: 'swipe' | 'pinch' | 'rotate' | 'tap' | 'hover'
  direction?: 'up' | 'down' | 'left' | 'right'
  confidence: number
  timestamp: number
  coordinates: { x: number; y: number }
}

interface VoiceCommand {
  command: string
  confidence: number
  timestamp: number
  executed: boolean
}

interface HandTracking {
  landmarks: number[][]
  gesture: string
  confidence: number
  tracking: boolean
}

export default function GestureVoiceInterface() {
  const [gestureMode, setGestureMode] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [eyeTracking, setEyeTracking] = useState(false)
  const [gestures, setGestures] = useState<Gesture[]>([])
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([])
  const [handTracking, setHandTracking] = useState<HandTracking | null>(null)
  const [currentGesture, setCurrentGesture] = useState<string>('none')
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [sensitivity, setSensitivity] = useState(0.7)
  const [feedback, setFeedback] = useState<string>('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recognitionRef = useRef<any | null>(null)
  const animationRef = useRef<number>()

  // Simulate gesture detection
  const simulateGesture = useCallback(() => {
    const gestureTypes: Gesture['type'][] = ['swipe', 'pinch', 'rotate', 'tap', 'hover']
    const directions: Gesture['direction'][] = ['up', 'down', 'left', 'right']
    
    const type = gestureTypes[Math.floor(Math.random() * gestureTypes.length)]
    const direction = type === 'swipe' ? directions[Math.floor(Math.random() * directions.length)] : undefined
    
    const gesture: Gesture = {
      type,
      direction,
      confidence: 0.7 + Math.random() * 0.3,
      timestamp: Date.now(),
      coordinates: {
        x: Math.random() * 800,
        y: Math.random() * 600
      }
    }
    
    setGestures(prev => [...prev.slice(-9), gesture])
    setCurrentGesture(`${type}${direction ? `-${direction}` : ''}`)
    setFeedback(`Detected: ${type}${direction ? ` ${direction}` : ''} (${Math.round(gesture.confidence * 100)}% confidence)`)
    
    setTimeout(() => setFeedback(''), 2000)
  }, [])

  // Simulate voice commands
  const simulateVoiceCommand = useCallback(() => {
    const commands = [
      'open wallet', 'show notifications', 'launch government services',
      'check security', 'open AI assistant', 'show analytics',
      'navigate home', 'go back', 'scroll up', 'scroll down',
      'zoom in', 'zoom out', 'select item', 'close window'
    ]
    
    const command = commands[Math.floor(Math.random() * commands.length)]
    const voiceCommand: VoiceCommand = {
      command,
      confidence: 0.8 + Math.random() * 0.2,
      timestamp: Date.now(),
      executed: false
    }
    
    setVoiceCommands(prev => [...prev.slice(-9), voiceCommand])
    setVoiceLevel(0.3 + Math.random() * 0.7)
    setFeedback(`Voice: "${command}" (${Math.round(voiceCommand.confidence * 100)}% confidence)`)
    
    setTimeout(() => {
      setVoiceLevel(0)
      setFeedback('')
    }, 2000)
  }, [])

  // Simulate hand tracking
  const simulateHandTracking = useCallback(() => {
    const landmarks = []
    for (let i = 0; i < 21; i++) {
      landmarks.push([
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 50
      ])
    }
    
    const gestures = ['open', 'closed', 'pointing', 'peace', 'thumbs_up', 'fist']
    const gesture = gestures[Math.floor(Math.random() * gestures.length)]
    
    setHandTracking({
      landmarks,
      gesture,
      confidence: 0.75 + Math.random() * 0.25,
      tracking: true
    })
  }, [])

  // Initialize gesture simulation
  useEffect(() => {
    if (gestureMode) {
      const interval = setInterval(simulateGesture, 3000)
      return () => clearInterval(interval)
    }
  }, [gestureMode, simulateGesture])

  // Initialize voice simulation
  useEffect(() => {
    if (voiceMode) {
      const interval = setInterval(simulateVoiceCommand, 4000)
      return () => clearInterval(interval)
    }
  }, [voiceMode, simulateVoiceCommand])

  // Initialize hand tracking simulation
  useEffect(() => {
    if (gestureMode) {
      const interval = setInterval(simulateHandTracking, 100)
      return () => clearInterval(interval)
    }
  }, [gestureMode, simulateHandTracking])

  // Initialize camera access
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.log('Camera access denied or not available')
    }
  }, [])

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    const WSR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (WSR) {
      const recognition = new WSR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-NG'
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from((event as any).results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
        
        setVoiceLevel(0.5 + Math.random() * 0.5)
        setFeedback(`Listening: "${transcript}"`)
      }
      
      recognition.onerror = (event: any) => {
        console.log('Speech recognition error:', event.error)
        setVoiceMode(false)
      }
      
      recognitionRef.current = recognition
    }
  }, [])

  // Toggle gesture mode
  const toggleGestureMode = useCallback(async () => {
    const newMode = !gestureMode
    setGestureMode(newMode)
    
    if (newMode) {
      await initializeCamera()
      setFeedback('Gesture mode activated - Camera initialized')
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      setHandTracking(null)
      setFeedback('Gesture mode deactivated')
    }
    
    setTimeout(() => setFeedback(''), 2000)
  }, [gestureMode, initializeCamera])

  // Toggle voice mode
  const toggleVoiceMode = useCallback(() => {
    if (!recognitionRef.current) {
      initializeSpeechRecognition()
    }
    
    const newMode = !voiceMode
    setVoiceMode(newMode)
    
    if (newMode && recognitionRef.current) {
      recognitionRef.current.start()
      setFeedback('Voice mode activated - Listening for commands')
    } else if (recognitionRef.current) {
      recognitionRef.current.stop()
      setVoiceLevel(0)
      setFeedback('Voice mode deactivated')
    }
    
    setTimeout(() => setFeedback(''), 2000)
  }, [voiceMode, initializeSpeechRecognition])

  // Toggle eye tracking
  const toggleEyeTracking = useCallback(() => {
    const newMode = !eyeTracking
    setEyeTracking(newMode)
    setFeedback(`Eye tracking ${newMode ? 'activated' : 'deactivated'}`)
    setTimeout(() => setFeedback(''), 2000)
  }, [eyeTracking])

  // Execute gesture command
  const executeGestureCommand = useCallback((gesture: Gesture) => {
    const commands = {
      'swipe-left': 'Navigate back',
      'swipe-right': 'Navigate forward',
      'swipe-up': 'Scroll up',
      'swipe-down': 'Scroll down',
      'pinch': 'Zoom out',
      'rotate': 'Rotate view',
      'tap': 'Select item',
      'hover': 'Preview item'
    }
    
    const command = `${gesture.type}${gesture.direction ? `-${gesture.direction}` : ''}`
    const action = commands[command as keyof typeof commands] || 'Unknown gesture'
    
    setFeedback(`Executed: ${action}`)
    setTimeout(() => setFeedback(''), 2000)
  }, [])

  // Execute voice command
  const executeVoiceCommand = useCallback((command: VoiceCommand) => {
    const actions = {
      'open wallet': 'Opening Digital Wallet',
      'show notifications': 'Showing Notifications',
      'launch government services': 'Launching Government Services',
      'check security': 'Checking Security Status',
      'open AI assistant': 'Opening AI Assistant',
      'show analytics': 'Showing Analytics Dashboard',
      'navigate home': 'Navigating to Home',
      'go back': 'Going Back',
      'scroll up': 'Scrolling Up',
      'scroll down': 'Scrolling Down',
      'zoom in': 'Zooming In',
      'zoom out': 'Zooming Out',
      'select item': 'Selecting Item',
      'close window': 'Closing Window'
    }
    
    const action = actions[command.command as keyof typeof actions] || `Processing: ${command.command}`
    setFeedback(action)
    setTimeout(() => setFeedback(''), 3000)
  }, [])

  // Calibration process
  const startCalibration = useCallback(() => {
    setCalibrationMode(true)
    setFeedback('Starting calibration process...')
    
    setTimeout(() => {
      setFeedback('Follow the on-screen instructions')
    }, 2000)
    
    setTimeout(() => {
      setCalibrationMode(false)
      setFeedback('Calibration complete!')
    }, 8000)
    
    setTimeout(() => setFeedback(''), 2000)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 relative overflow-hidden">
      {/* Camera Feed */}
      <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-purple-500">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={192}
          height={144}
        />
        {gestureMode && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            LIVE
          </div>
        )}
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-10 mb-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Gesture & Voice Interface
            </h1>
            <p className="text-purple-300">Control your OS with natural gestures and voice commands</p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={startCalibration}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Target className="w-4 h-4" />
              <span>Calibrate</span>
            </motion.button>
            <motion.div 
              className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  gestureMode || voiceMode ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className="text-white text-sm font-medium">
                  {gestureMode || voiceMode ? 'Active' : 'Standby'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.button
            onClick={toggleGestureMode}
            className={`p-4 rounded-xl border-2 transition-all ${
              gestureMode
                ? 'bg-purple-600 border-purple-400 text-white'
                : 'bg-black bg-opacity-30 border-purple-500 border-opacity-30 text-purple-300 hover:bg-purple-600 hover:bg-opacity-30'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Hand className="w-6 h-6" />
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-white font-medium mb-1">Gesture Control</div>
            <div className="text-sm text-purple-300">
              {gestureMode ? 'Active - Camera enabled' : 'Click to enable'}
            </div>
          </motion.button>

          <motion.button
            onClick={toggleVoiceMode}
            className={`p-4 rounded-xl border-2 transition-all ${
              voiceMode
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-black bg-opacity-30 border-blue-500 border-opacity-30 text-blue-300 hover:bg-blue-600 hover:bg-opacity-30'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Mic className="w-6 h-6" />
              <Speech className="w-5 h-5" />
            </div>
            <div className="text-white font-medium mb-1">Voice Control</div>
            <div className="text-sm text-blue-300">
              {voiceMode ? 'Listening...' : 'Click to enable'}
            </div>
          </motion.button>

          <motion.button
            onClick={toggleEyeTracking}
            className={`p-4 rounded-xl border-2 transition-all ${
              eyeTracking
                ? 'bg-green-600 border-green-400 text-white'
                : 'bg-black bg-opacity-30 border-green-500 border-opacity-30 text-green-300 hover:bg-green-600 hover:bg-opacity-30'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Eye className="w-6 h-6" />
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-white font-medium mb-1">Eye Tracking</div>
            <div className="text-sm text-green-300">
              {eyeTracking ? 'Tracking enabled' : 'Click to enable'}
            </div>
          </motion.button>
        </div>

        {/* Sensitivity Control */}
        <div className="bg-black bg-opacity-30 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Sensitivity</span>
            <span className="text-purple-400 text-sm">{Math.round(sensitivity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
      </motion.div>

      {/* Gesture Visualization */}
      <motion.div 
        className="relative z-10 mb-8"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="bg-black bg-opacity-30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500 border-opacity-30">
          <div className="flex items-center space-x-2 mb-4">
            <Hand className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Gesture Recognition</h2>
            <span className="text-purple-400 text-sm">Real-time hand tracking</span>
          </div>

          {/* Current Gesture Display */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 bg-opacity-20 rounded-lg p-6 border border-purple-500 border-opacity-30 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-medium">Current Gesture</div>
              <div className="text-purple-400 text-sm">Confidence: {handTracking ? Math.round(handTracking.confidence * 100) : 0}%</div>
            </div>
            <div className="text-3xl font-bold text-white mb-2 capitalize">
              {currentGesture.replace('-', ' ')}
            </div>
            <div className="text-purple-300 text-sm">
              {gestureMode ? 'Tracking active - Move your hands' : 'Enable gesture mode to start tracking'}
            </div>
          </div>

          {/* Hand Tracking Visualization */}
          {handTracking && (
            <div className="bg-black rounded-lg p-4 mb-4">
              <div className="grid grid-cols-7 gap-2">
                {handTracking.landmarks.map((landmark, index) => (
                  <motion.div
                    key={index}
                    className="w-3 h-3 bg-purple-400 rounded-full"
                    style={{
                      left: `${landmark[0]}%`,
                      top: `${landmark[1]}%`,
                      transform: `scale(${1 + landmark[2] / 100})`
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 1,
                      delay: index * 0.05,
                      repeat: Infinity
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Gestures */}
          <div className="space-y-2">
            <h3 className="text-white font-medium mb-3">Recent Gestures</h3>
            {gestures.slice(-5).reverse().map((gesture, index) => (
              <motion.div
                key={gesture.timestamp}
                className="flex items-center justify-between bg-black bg-opacity-50 rounded-lg p-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <div className="text-white capitalize">{gesture.type}{gesture.direction ? ` ${gesture.direction}` : ''}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-purple-400 text-sm">
                    ({Math.round(gesture.coordinates.x)}, {Math.round(gesture.coordinates.y)})
                  </div>
                  <div className="text-green-400 text-sm font-medium">
                    {Math.round(gesture.confidence * 100)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Voice Recognition */}
      <motion.div 
        className="relative z-10 mb-8"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="bg-black bg-opacity-30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500 border-opacity-30">
          <div className="flex items-center space-x-2 mb-4">
            <Mic className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Voice Recognition</h2>
            <span className="text-blue-400 text-sm">Natural language commands</span>
          </div>

          {/* Voice Level Meter */}
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 bg-opacity-20 rounded-lg p-6 border border-blue-500 border-opacity-30 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-medium">Voice Level</div>
              <div className="text-blue-400 text-sm">{voiceMode ? 'Listening...' : 'Standby'}</div>
            </div>
            <div className="w-full bg-gray-800 bg-opacity-50 rounded-full h-4 mb-2">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full"
                animate={{ width: `${voiceLevel * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="text-blue-300 text-sm">
              {voiceMode ? 'Speak clearly for best results' : 'Enable voice mode to start listening'}
            </div>
          </div>

          {/* Voice Commands */}
          <div className="space-y-2">
            <h3 className="text-white font-medium mb-3">Recent Commands</h3>
            {voiceCommands.slice(-5).reverse().map((command, index) => (
              <motion.div
                key={command.timestamp}
                className="flex items-center justify-between bg-black bg-opacity-50 rounded-lg p-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <div className="text-white">"{command.command}"</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    command.executed ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
                  }`} />
                  <div className="text-green-400 text-sm font-medium">
                    {Math.round(command.confidence * 100)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Feedback Panel */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 backdrop-blur-xl rounded-lg p-4 border border-purple-500 border-opacity-30 z-50"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-2 h-2 bg-purple-400 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-white font-medium">{feedback}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calibration Overlay */}
      <AnimatePresence>
        {calibrationMode && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-xl z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-black bg-opacity-90 rounded-2xl p-8 border border-purple-500 border-opacity-30 max-w-md text-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <motion.div
                className="w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Target className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Calibrating Sensors</h3>
              <p className="text-purple-300 mb-6">
                Please hold still while we calibrate your gesture and voice recognition systems
              </p>
              <motion.div
                className="w-full bg-gray-800 bg-opacity-50 rounded-full h-2"
              >
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 8, ease: "linear" }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Controls */}
      <motion.div
        className="fixed bottom-8 right-8 z-30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="bg-black bg-opacity-80 backdrop-blur-xl rounded-2xl p-4 border border-purple-500 border-opacity-30">
          <div className="flex items-center space-x-4 mb-4">
            <motion.button
              className={`p-3 rounded-full transition-all ${
                gestureMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-purple-600 hover:bg-opacity-50'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleGestureMode}
            >
              <Hand className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              className={`p-3 rounded-full transition-all ${
                voiceMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-blue-600 hover:bg-opacity-50'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVoiceMode}
            >
              <Mic className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              className={`p-3 rounded-full transition-all ${
                eyeTracking
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-green-600 hover:bg-opacity-50'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleEyeTracking}
            >
              <Eye className="w-5 h-5" />
            </motion.button>
          </div>
          
          <div className="text-center">
            <div className="text-white text-sm font-medium mb-1">Quick Controls</div>
            <div className="text-purple-400 text-xs">Gesture • Voice • Eye</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
