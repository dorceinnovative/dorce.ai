import { useState, useEffect, useCallback } from 'react'

export interface OSApp {
  id: string
  name: string
  icon: string
  windowId?: string
  isRunning: boolean
  permissions: string[]
  memoryUsage: number
  cpuUsage: number
}

export interface OSWindow {
  id: string
  appId: string
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  isMinimized: boolean
  isMaximized: boolean
  isActive: boolean
  zIndex: number
}

export interface OSNotification {
  id: string
  appId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  timestamp: Date
  isRead: boolean
  actions?: OSNotificationAction[]
}

export interface OSNotificationAction {
  id: string
  label: string
  action: string
  payload?: any
}

export interface OSSystemState {
  activeWindows: OSWindow[]
  runningApps: OSApp[]
  notifications: OSNotification[]
  processes: OSProcess[]
  systemResources: {
    memory: { used: number; total: number; percentage: number }
    cpu: { usage: number; cores: number }
    storage: { used: number; total: number; percentage: number }
  }
  user: {
    id: string
    username: string
    permissions: string[]
    isAdmin: boolean
  }
}

export interface OSProcess {
  id: string
  appId: string
  pid: number
  status: 'running' | 'suspended' | 'terminated'
  memoryUsage: number
  cpuUsage: number
  startTime: Date
}

export function useOSKernel() {
  const [systemState, setSystemState] = useState<OSSystemState | null>(null)
  const [availableApps, setAvailableApps] = useState<OSApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch system state
  const fetchSystemState = useCallback(async () => {
    try {
      const response = await fetch('/api/os/system-state', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSystemState(data)
        setError(null)
      } else {
        throw new Error('Failed to fetch system state')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  // Fetch available apps
  const fetchAvailableApps = useCallback(async () => {
    try {
      const response = await fetch('/api/os/apps', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableApps(data)
      } else {
        throw new Error('Failed to fetch apps')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  // Initialize OS kernel
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      await Promise.all([fetchSystemState(), fetchAvailableApps()])
      setIsLoading(false)
    }
    
    initialize()
  }, [fetchSystemState, fetchAvailableApps])

  // Launch app
  const launchApp = useCallback(async (appId: string): Promise<OSWindow> => {
    try {
      const response = await fetch(`/api/os/apps/${appId}/launch`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const window = await response.json()
        // Refresh system state after launching
        await fetchSystemState()
        return window
      } else {
        throw new Error('Failed to launch app')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [fetchSystemState])

  // Close app
  const closeApp = useCallback(async (appId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/os/apps/${appId}/close`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchSystemState()
      } else {
        throw new Error('Failed to close app')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [fetchSystemState])

  // Update window
  const updateWindow = useCallback(async (windowId: string, updates: Partial<OSWindow>): Promise<OSWindow> => {
    try {
      const response = await fetch(`/api/os/windows/${windowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const window = await response.json()
        await fetchSystemState()
        return window
      } else {
        throw new Error('Failed to update window')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [fetchSystemState])

  // Send notification
  const sendNotification = useCallback(async (
    notification: Omit<OSNotification, 'id' | 'timestamp' | 'isRead'>
  ): Promise<OSNotification> => {
    try {
      const response = await fetch('/api/os/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notification)
      })
      
      if (response.ok) {
        const notif = await response.json()
        await fetchSystemState()
        return notif
      } else {
        throw new Error('Failed to send notification')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [fetchSystemState])

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/os/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchSystemState()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [fetchSystemState])

  // Restart system
  const restartSystem = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/os/system/restart', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchSystemState()
      } else {
        throw new Error('Failed to restart system')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [fetchSystemState])

  // Get unread notifications count
  const getUnreadNotificationsCount = useCallback((): number => {
    return systemState?.notifications.filter(n => !n.isRead).length || 0
  }, [systemState])

  // Get active window
  const getActiveWindow = useCallback((): OSWindow | undefined => {
    return systemState?.activeWindows.find(w => w.isActive)
  }, [systemState])

  // Check if app is running
  const isAppRunning = useCallback((appId: string): boolean => {
    return systemState?.runningApps.some(app => app.id === appId) || false
  }, [systemState])

  return {
    systemState,
    availableApps,
    isLoading,
    error,
    launchApp,
    closeApp,
    updateWindow,
    sendNotification,
    markNotificationRead,
    restartSystem,
    getUnreadNotificationsCount,
    getActiveWindow,
    isAppRunning,
    refreshSystemState: fetchSystemState,
  }
}