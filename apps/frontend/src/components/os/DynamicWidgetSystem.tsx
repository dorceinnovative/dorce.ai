import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, DollarSign, Activity, Package, Zap, Settings, X, Pin, Minimize, Maximize2, RefreshCw } from 'lucide-react'

interface WidgetData {
  type: 'chart' | 'gauge' | 'metric' | 'activity' | 'list'
  title: string
  data: any[]
  config?: {
    color?: string
    max?: number
    unit?: string
    refreshRate?: number
  }
}

interface Widget {
  id: string
  x: number
  y: number
  width: number
  height: number
  data: WidgetData
  minimized: boolean
  pinned: boolean
  opacity: number
  zIndex: number
}

const COLORS = ['#00ff88', '#00d4ff', '#ff00ff', '#ffff00', '#ff6b6b', '#4ecdc4']

export default function DynamicWidgetSystem() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [refreshTimers, setRefreshTimers] = useState<{[key: string]: NodeJS.Timeout}>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate real-time data
  const generateRealTimeData = useCallback((type: string) => {
    switch (type) {
      case 'economic':
        return Array.from({ length: 20 }, (_, i) => ({
          time: new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString(),
          gdp: Math.random() * 100 + 50,
          inflation: Math.random() * 5 + 2,
          employment: Math.random() * 10 + 90
        }))
      case 'population':
        return Array.from({ length: 12 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          citizens: Math.floor(Math.random() * 100000 + 500000),
          growth: Math.random() * 10 - 5
        }))
      case 'energy':
        return [
          { name: 'Solar', value: Math.random() * 30 + 20, color: '#ffd700' },
          { name: 'Wind', value: Math.random() * 25 + 15, color: '#87ceeb' },
          { name: 'Hydro', value: Math.random() * 20 + 10, color: '#4169e1' },
          { name: 'Nuclear', value: Math.random() * 15 + 10, color: '#ff6347' }
        ]
      case 'activity':
        return Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          active: Math.floor(Math.random() * 10000 + 1000),
          new: Math.floor(Math.random() * 1000 + 100)
        }))
      default:
        return []
    }
  }, [])

  // Initialize widgets
  useEffect(() => {
    const initialWidgets: Widget[] = [
      {
        id: 'economic-dashboard',
        x: 50,
        y: 50,
        width: 400,
        height: 300,
        data: {
          type: 'chart',
          title: 'Economic Indicators',
          data: generateRealTimeData('economic'),
          config: { color: '#00ff88', refreshRate: 5000 }
        },
        minimized: false,
        pinned: false,
        opacity: 0.9,
        zIndex: 1
      },
      {
        id: 'population-metric',
        x: 500,
        y: 50,
        width: 200,
        height: 150,
        data: {
          type: 'metric',
          title: 'Population',
          data: [{ value: 8473921, change: 2.3, label: 'Total Citizens' }],
          config: { color: '#00d4ff', unit: 'citizens' }
        },
        minimized: false,
        pinned: true,
        opacity: 0.9,
        zIndex: 2
      },
      {
        id: 'energy-distribution',
        x: 750,
        y: 50,
        width: 300,
        height: 300,
        data: {
          type: 'chart',
          title: 'Energy Distribution',
          data: generateRealTimeData('energy'),
          config: { color: '#ff00ff', refreshRate: 10000 }
        },
        minimized: false,
        pinned: false,
        opacity: 0.9,
        zIndex: 1
      },
      {
        id: 'system-activity',
        x: 50,
        y: 400,
        width: 350,
        height: 200,
        data: {
          type: 'activity',
          title: 'System Activity',
          data: generateRealTimeData('activity'),
          config: { color: '#ffff00', refreshRate: 3000 }
        },
        minimized: false,
        pinned: false,
        opacity: 0.9,
        zIndex: 1
      },
      {
        id: 'performance-gauge',
        x: 450,
        y: 250,
        width: 200,
        height: 200,
        data: {
          type: 'gauge',
          title: 'System Performance',
          data: [{ value: 87, max: 100, label: 'Efficiency Score' }],
          config: { color: '#4ecdc4', max: 100, unit: '%' }
        },
        minimized: false,
        pinned: true,
        opacity: 0.9,
        zIndex: 2
      }
    ]
    setWidgets(initialWidgets)
  }, [generateRealTimeData])

  // Auto-refresh system
  useEffect(() => {
    widgets.forEach(widget => {
      if (widget.data.config?.refreshRate && !refreshTimers[widget.id]) {
        const timer = setInterval(() => {
          setWidgets(prev => prev.map(w => 
            w.id === widget.id 
              ? { ...w, data: { ...w.data, data: generateRealTimeData(getDataType(w.data.title)) } }
              : w
          ))
        }, widget.data.config.refreshRate)
        
        setRefreshTimers(prev => ({ ...prev, [widget.id]: timer }))
      }
    })

    return () => {
      Object.values(refreshTimers).forEach(timer => clearInterval(timer))
      setRefreshTimers({})
    }
  }, [widgets, generateRealTimeData, refreshTimers])

  const getDataType = (title: string): string => {
    if (title.includes('Economic')) return 'economic'
    if (title.includes('Population')) return 'population'
    if (title.includes('Energy')) return 'energy'
    if (title.includes('Activity')) return 'activity'
    return 'economic'
  }

  // Drag and drop handlers
  const handleMouseDown = (e: React.MouseEvent, widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget) return

    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - widget.x,
      y: e.clientY - widget.y
    })
    setDraggedWidget(widgetId)
    
    // Bring to front
    const maxZ = Math.max(...widgets.map(w => w.zIndex))
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, zIndex: maxZ + 1 } : w
    ))
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedWidget || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(e.clientX - containerRect.left - dragOffset.x, containerRect.width - 200))
    const newY = Math.max(0, Math.min(e.clientY - containerRect.top - dragOffset.y, containerRect.height - 100))

    setWidgets(prev => prev.map(widget => 
      widget.id === draggedWidget 
        ? { ...widget, x: newX, y: newY }
        : widget
    ))
  }, [draggedWidget, dragOffset])

  const handleMouseUp = useCallback(() => {
    setDraggedWidget(null)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (draggedWidget) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggedWidget, handleMouseMove, handleMouseUp])

  // Widget controls
  const toggleMinimize = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, minimized: !w.minimized } : w
    ))
  }

  const togglePin = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, pinned: !w.pinned } : w
    ))
  }

  const removeWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
    if (refreshTimers[widgetId]) {
      clearInterval(refreshTimers[widgetId])
      setRefreshTimers(prev => {
        const newTimers = { ...prev }
        delete newTimers[widgetId]
        return newTimers
      })
    }
  }

  const refreshWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId 
        ? { ...w, data: { ...w.data, data: generateRealTimeData(getDataType(w.data.title)) } }
        : w
    ))
  }

  // Render widget content
  const renderWidgetContent = (widget: Widget) => {
    if (widget.minimized) return null

    const { data } = widget
    
    switch (data.type) {
      case 'chart':
        return (
          <div className="h-full p-4">
            <h3 className="text-sm font-semibold mb-2 text-white/80">{data.title}</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                {data.title.includes('Energy') ? (
                  <PieChart>
                    <Pie
                      data={data.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {data.data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  <LineChart data={data.data}>
                    <Line 
                      type="monotone" 
                      dataKey={data.title.includes('Economic') ? 'gdp' : 'active'}
                      stroke={data.config?.color || '#00ff88'} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )
      
      case 'metric':
        const metric = data.data[0]
        return (
          <div className="h-full p-4 flex flex-col justify-center">
            <h3 className="text-xs font-medium text-white/60 mb-1">{data.title}</h3>
            <div className="text-2xl font-bold text-white mb-1">
              {metric.value.toLocaleString()}
            </div>
            <div className={`text-xs flex items-center ${
              metric.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {metric.change >= 0 ? '+' : ''}{metric.change}%
            </div>
          </div>
        )
      
      case 'gauge':
        const gauge = data.data[0]
        const percentage = (gauge.value / gauge.max) * 100
        return (
          <div className="h-full p-4 flex flex-col justify-center items-center">
            <h3 className="text-xs font-medium text-white/60 mb-2">{data.title}</h3>
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke={data.config?.color || '#00ff88'}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - percentage / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{gauge.value}</span>
              </div>
            </div>
            <div className="text-xs text-white/60 mt-1">{gauge.label}</div>
          </div>
        )
      
      case 'activity':
        return (
          <div className="h-full p-4">
            <h3 className="text-sm font-semibold mb-2 text-white/80">{data.title}</h3>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.data}>
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stroke={data.config?.color || '#00ff88'} 
                    fill={data.config?.color || '#00ff88'}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Dynamic Widget System</h1>
        <p className="text-white/60">Real-time data visualization with draggable widgets</p>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-screen bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden"
      >
        <AnimatePresence>
          {widgets.map(widget => (
            <motion.div
              key={widget.id}
              className={`absolute bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl ${
                widget.pinned ? 'ring-2 ring-blue-400/50' : ''
              }`}
              style={{
                left: widget.x,
                top: widget.y,
                width: widget.minimized ? 200 : widget.width,
                height: widget.minimized ? 60 : widget.height,
                opacity: widget.opacity,
                zIndex: widget.zIndex,
                cursor: draggedWidget === widget.id ? 'grabbing' : 'grab'
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: widget.opacity }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onMouseDown={(e) => handleMouseDown(e, widget.id)}
            >
              {/* Widget Header */}
              <div className="flex items-center justify-between p-2 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: widget.data.config?.color || '#00ff88' }}
                  />
                  <span className="text-xs font-medium text-white/80">
                    {widget.minimized ? widget.data.title : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => refreshWidget(widget.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3 h-3 text-white/60 hover:text-white" />
                  </button>
                  <button
                    onClick={() => togglePin(widget.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title={widget.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`w-3 h-3 ${widget.pinned ? 'text-blue-400' : 'text-white/60 hover:text-white'}`} />
                  </button>
                  <button
                    onClick={() => toggleMinimize(widget.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title={widget.minimized ? 'Maximize' : 'Minimize'}
                  >
                    {widget.minimized ? 
                      <Maximize2 className="w-3 h-3 text-white/60 hover:text-white" /> :
                      <Minimize className="w-3 h-3 text-white/60 hover:text-white" />
                    }
                  </button>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-3 h-3 text-white/60 hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Widget Content */}
              {!widget.minimized && renderWidgetContent(widget)}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>
      </div>
    </div>
  )
}