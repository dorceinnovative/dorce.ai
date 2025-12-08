import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, Users, Building2, DollarSign, Activity, Globe, Brain,
  TrendingUp, BarChart3, PieChart, Network, Wifi, Camera, Mic,
  Settings, Power, Volume2, VolumeX, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, RefreshCw, Search, Bell, User, Menu, X,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MousePointer, Touchpad,
  Speech, Target, RadioTower, Play, Pause, Square, RotateCcw,
  Phone, Mail, MapPin, Calendar, Clock, Star, Heart, AlertTriangle
} from 'lucide-react'
import DorceNationalOS from '../components/os/DorceNationalOS'

interface NationalDashboardState {
  currentView: 'dashboard' | 'modules' | 'analytics' | 'settings'
  citizenMode: boolean
  quantumMode: boolean
  darkMode: boolean
  realTimeUpdates: boolean
  selectedModule: string | null
  notifications: Notification[]
  systemStatus: 'online' | 'maintenance' | 'offline'
}

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface NationalMetrics {
  totalCitizens: number
  activeUsers: number
  dailyTransactions: number
  gdpContribution: number
  quantumSecurityLevel: number
  aiEfficiency: number
  systemUptime: number
  fraudDetectionRate: number
  citizenSatisfaction: number
}

const NationalOSDashboard: React.FC = () => {
  const [state, setState] = useState<NationalDashboardState>({
    currentView: 'dashboard',
    citizenMode: true,
    quantumMode: true,
    darkMode: true,
    realTimeUpdates: true,
    selectedModule: null,
    notifications: [
      {
        id: '1',
        type: 'success',
        title: 'NIN Enrollment Complete',
        message: 'Your National Identity Number has been successfully enrolled',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'info',
        title: 'Quantum Security Update',
        message: 'System security protocols have been enhanced',
        timestamp: new Date(),
        read: false
      }
    ],
    systemStatus: 'online'
  })

  const [nationalMetrics, setNationalMetrics] = useState<NationalMetrics>({
    totalCitizens: 218000000,
    activeUsers: 125000000,
    dailyTransactions: 1250000000,
    gdpContribution: 45000000000000, // 45 trillion NGN
    quantumSecurityLevel: 99.9,
    aiEfficiency: 94.7,
    systemUptime: 99.97,
    fraudDetectionRate: 99.8,
    citizenSatisfaction: 87.3
  })

  const [currentTime, setCurrentTime] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Simulate real-time metric updates
  useEffect(() => {
    if (!state.realTimeUpdates) return

    const interval = setInterval(() => {
      setNationalMetrics(prev => ({
        ...prev,
        dailyTransactions: prev.dailyTransactions + Math.floor(Math.random() * 1000000),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 1000),
        aiEfficiency: Math.min(100, prev.aiEfficiency + (Math.random() - 0.5) * 0.1),
        quantumSecurityLevel: Math.min(100, prev.quantumSecurityLevel + (Math.random() - 0.5) * 0.05)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [state.realTimeUpdates])

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number): string => {
    return `₦${formatNumber(amount)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400'
      case 'maintenance': return 'text-yellow-400'
      case 'offline': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Star className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <Bell className="w-4 h-4 text-blue-400" />
    }
  }

  const unreadNotifications = state.notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 text-white overflow-hidden">
      {/* Quantum Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 opacity-90" />
        
        {/* Quantum Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        {/* Quantum Grid */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black/30 backdrop-blur-md border-b border-cyan-400/30 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Dorce.ai National OS
                </h1>
                <p className="text-sm text-white/60">Federal Republic of Nigeria Digital Infrastructure</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search national services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  state.systemStatus === 'online' ? 'bg-green-400' :
                  state.systemStatus === 'maintenance' ? 'bg-yellow-400' :
                  'bg-red-400'
                }`} />
                <span className={`text-sm ${getStatusColor(state.systemStatus)}`}>
                  {state.systemStatus.toUpperCase()}
                </span>
              </div>

              {/* Time */}
              <div className="text-sm text-white/60">
                {currentTime.toLocaleTimeString('en-NG')}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 mt-2 w-80 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-2xl z-50"
                    >
                      <div className="p-4 border-b border-white/20">
                        <h3 className="font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {state.notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-white/10 hover:bg-white/5 transition-colors ${
                              !notification.read ? 'bg-white/5' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-white/60 text-xs mt-1">{notification.message}</p>
                                <p className="text-white/40 text-xs mt-2">
                                  {notification.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">Citizen Adebayo</p>
                  <p className="text-xs text-white/60">NIN: 12345678901</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 max-w-7xl mx-auto">
          {/* National Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-cyan-400/30"
            >
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-cyan-400" />
                <span className="text-cyan-300 text-sm">Total Citizens</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {formatNumber(nationalMetrics.totalCitizens)}
              </div>
              <div className="text-cyan-400 text-sm">+2.1% this month</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-green-400/30"
            >
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-green-400" />
                <span className="text-green-300 text-sm">Active Users</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {formatNumber(nationalMetrics.activeUsers)}
              </div>
              <div className="text-green-400 text-sm">+5.7% this month</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30"
            >
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <span className="text-purple-300 text-sm">Daily Transactions</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {formatNumber(nationalMetrics.dailyTransactions)}
              </div>
              <div className="text-purple-400 text-sm">+12.3% this week</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-orange-400/30"
            >
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-orange-400" />
                <span className="text-orange-300 text-sm">GDP Contribution</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {formatCurrency(nationalMetrics.gdpContribution)}
              </div>
              <div className="text-orange-400 text-sm">+8.9% this quarter</div>
            </motion.div>
          </div>

          {/* System Performance Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-blue-400/30"
            >
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
                <span className="text-blue-300 text-sm">Quantum Security</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {nationalMetrics.quantumSecurityLevel.toFixed(1)}%
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${nationalMetrics.quantumSecurityLevel}%` }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-indigo-400/30"
            >
              <div className="flex items-center justify-between mb-4">
                <Brain className="w-8 h-8 text-indigo-400" />
                <span className="text-indigo-300 text-sm">AI Efficiency</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {nationalMetrics.aiEfficiency.toFixed(1)}%
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-indigo-400 to-purple-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${nationalMetrics.aiEfficiency}%` }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-pink-400/30"
            >
              <div className="flex items-center justify-between mb-4">
                <Network className="w-8 h-8 text-pink-400" />
                <span className="text-pink-300 text-sm">System Uptime</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {nationalMetrics.systemUptime.toFixed(2)}%
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-pink-400 to-rose-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${nationalMetrics.systemUptime}%` }}
                />
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Zap className="w-6 h-6 mr-3 text-cyan-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Shield />, title: 'NIN Services', desc: 'Identity Management' },
                { icon: <DollarSign />, title: 'Wallet', desc: 'Financial Services' },
                { icon: <Globe />, title: 'Marketplace', desc: 'E-commerce Hub' },
                { icon: <Building2 />, title: 'CAC Services', desc: 'Business Registration' }
              ].map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/20 hover:border-cyan-400/50 transition-all duration-300 group"
                >
                  <div className="text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
                    {React.cloneElement(action.icon, { className: 'w-6 h-6' })}
                  </div>
                  <h4 className="font-medium text-white mb-1">{action.title}</h4>
                  <p className="text-white/60 text-xs">{action.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* National OS Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <DorceNationalOS />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default NationalOSDashboard