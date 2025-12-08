"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { OSInterface } from '@/components/os-interface'
import { useOSKernel } from '@/lib/os-kernel-context'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const { launchApp, availableApps } = useOSKernel()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleAppLaunch = async (appId: string) => {
    try {
      await launchApp(appId)
    } catch (error) {
      console.error(`Failed to launch app ${appId}:`, error)
      alert(`Failed to launch app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <OSInterface>
      <div className="os-dashboard-content min-h-screen bg-black text-white p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <div className="inline-flex items-center bg-blue-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="text-blue-300 text-sm font-medium">Intelligent Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Welcome, {user.firstName || user.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-gray-300 mt-2">Your AI‑powered financial operating system</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
            <h3 className="text-lg font-semibold mb-2">Wallet Balance</h3>
            <p className="text-2xl font-bold text-green-400">$0.00</p>
            <p className="text-sm text-gray-400 mt-1">Available funds</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
            <h3 className="text-lg font-semibold mb-2">Total Transactions</h3>
            <p className="text-2xl font-bold text-blue-400">0</p>
            <p className="text-sm text-gray-400 mt-1">This month</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
            <h3 className="text-lg font-semibold mb-2">Account Status</h3>
            <p className="text-2xl font-bold text-yellow-400">Active</p>
            <p className="text-sm text-gray-400 mt-1">{user.role}</p>
          </div>
        </div>

        {/* Role-Based Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          {user.role === 'individual' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => handleAppLaunch('dorce-wallet')} className="bg-white/10 border border-blue-400/30 hover:bg-white/20 text-white p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm">Wallet</div>
              </button>
              <button onClick={() => handleAppLaunch('dorce-chat')} className="bg-white/10 border border-blue-400/30 hover:bg-white/20 text-white p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm">Chat</div>
              </button>
              <button onClick={() => handleAppLaunch('dorce-marketplace')} className="bg-white/10 border border-blue-400/30 hover:bg-white/20 text-white p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">🛒</div>
                <div className="text-sm">Marketplace</div>
              </button>
              <button onClick={() => router.push('/telecom')} className="bg-white/10 border border-blue-400/30 hover:bg-white/20 text-white p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">📱</div>
                <div className="text-sm">Airtime & Data</div>
              </button>
            </div>
          )}
          {user.role === 'business' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => router.push('/commerce')} className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">🏪</div>
                <div className="text-sm">Vendor Portal</div>
              </button>
              <button onClick={() => router.push('/commerce')} className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">📦</div>
                <div className="text-sm">Products</div>
              </button>
              <button onClick={() => handleAppLaunch('dorce-analytics')} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm">Analytics</div>
              </button>
              <button onClick={() => router.push('/subscriptions')} className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">🔄</div>
                <div className="text-sm">Subscriptions</div>
              </button>
            </div>
          )}
          {user.role === 'agent' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => router.push('/nin/enroll')} className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <div className="text-sm">NIN Enrollment</div>
              </button>
              <button onClick={() => router.push('/nin/card')} className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">💳</div>
                <div className="text-sm">NIN Card Orders</div>
              </button>
              <button onClick={() => router.push('/cac-registration')} className="bg-cyan-600 hover:bg-cyan-700 text-white p-4 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">📄</div>
                <div className="text-sm">CAC Registration</div>
              </button>
              <button onClick={() => router.push('/agent')} className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">🧰</div>
                <div className="text-sm">Agent Tools</div>
              </button>
            </div>
          )}
        </div>

        {/* Available Apps */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Available Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableApps.map((app) => (
              <div 
                key={app.id}
                onClick={() => handleAppLaunch(app.id)}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 hover:bg-white/20 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{app.icon}</div>
                  <div>
                    <h3 className="font-semibold">{app.name}</h3>
                    <p className="text-sm text-gray-300">{app.description || 'Available app'}</p>
                  </div>
                </div>
                {app.isRunning && (
                  <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Running
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>API Connection:</span>
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="text-green-400">Online</span>
            </div>
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span className="text-gray-400">Just now</span>
            </div>
          </div>
        </div>
      </div>
    </OSInterface>
  )
}
