"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { OSInterface } from '@/components/os-interface'
import ServiceMap from '@/components/ServiceMap'
import { useOSKernel } from '@/lib/os-kernel-context'
import KycModal from '@/components/KycModal'
import { apiClient } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const { launchApp, availableApps } = useOSKernel()
  const [wallet, setWallet] = useState<{ balance: number; currency: string; accountId: string } | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)

  const services = [
    {
      id: 'transfer',
      name: 'Transfer',
      description: 'Send money instantly',
      status: 'active' as const,
      metadata: { icon: '🚀', category: 'payments', color: '#34C759' },
      position_x: 260, position_y: 220,
    },
    {
      id: 'register-business',
      name: 'Register Business (CAC)',
      description: 'Incorporate your company',
      status: 'active' as const,
      metadata: { icon: '🏢', category: 'business', color: '#0A84FF' },
      position_x: 320, position_y: 200,
    },
    {
      id: 'vendor-onboarding',
      name: 'Vendor Onboarding',
      description: 'Become a marketplace vendor',
      status: 'active' as const,
      metadata: { icon: '🛍️', category: 'commerce', color: '#FF9F0A' },
      position_x: 360, position_y: 240,
    },
    {
      id: 'storelink',
      name: 'Storelink Creation',
      description: 'Create a shareable store link',
      status: 'active' as const,
      metadata: { icon: '🔗', category: 'commerce', color: '#BF5AF2' },
      position_x: 400, position_y: 220,
    },
    {
      id: 'subscriptions',
      name: 'Digital Subscriptions',
      description: 'Manage recurring billing',
      status: 'active' as const,
      metadata: { icon: '🔄', category: 'payments', color: '#64D2FF' },
      position_x: 240, position_y: 260,
    },
    {
      id: 'nin-registration',
      name: 'NIN Registration',
      description: 'Enroll for NIN nationwide',
      status: 'active' as const,
      metadata: { icon: '🛡️', category: 'identity', color: '#30D158' },
      position_x: 300, position_y: 280,
    },
    {
      id: 'premium-card',
      name: 'Premium Card Printing',
      description: 'Order high-quality ID cards',
      status: 'active' as const,
      metadata: { icon: '💳', category: 'identity', color: '#FFD60A' },
      position_x: 360, position_y: 300,
    },
    {
      id: 'tin-registration',
      name: 'TIN Registration',
      description: 'Individual and Corporate TIN',
      status: 'active' as const,
      metadata: { icon: '📄', category: 'compliance', color: '#FF375F' },
      position_x: 420, position_y: 260,
    },
  ]
  const [showKyc, setShowKyc] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchWallet = async () => {
      if (!isLoading && isAuthenticated) {
        try {
          const data = await apiClient.getWallet()
          setWallet(data)
        } catch (e: any) {
          setWalletError(e?.message || 'Failed to load wallet')
        }
      }
    }
    fetchWallet()
  }, [isLoading, isAuthenticated])

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

  const handleServiceClick = (service: any) => {
    switch (service.id) {
      case 'transfer':
        router.push('/wallet/transfer'); break
      case 'register-business':
        router.push('/cac-registration'); break
      case 'vendor-onboarding':
        router.push('/commerce/onboard'); break
      case 'storelink':
        router.push('/commerce'); break
      case 'subscriptions':
        router.push('/subscriptions'); break
      case 'nin-registration':
        router.push('/nin/enroll'); break
      case 'premium-card':
        router.push('/nin/card'); break
      case 'tin-registration':
        router.push('/tin'); break
      default:
        router.push('/dashboard')
    }
  }

  return (
    <OSInterface>
      <div className="os-dashboard-content min-h-screen bg-black text-white p-6">
        <KycModal open={showKyc} onClose={()=>setShowKyc(false)} onCompleted={()=>{ try { location.reload() } catch {} }} />
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
            <p className="text-2xl font-bold text-green-400">
              {wallet ? `${wallet.currency || '₦'}${(wallet.balance || 0).toLocaleString()}` : 'Loading...'}
            </p>
            <p className="text-sm text-gray-400 mt-1">{wallet?.accountId ? `Account: ${wallet.accountId}` : 'Available funds'}</p>
            {walletError && <p className="text-sm text-red-400 mt-2">{walletError}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => router.push('/wallet/fund')} className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700">Fund</button>
              <button onClick={() => router.push('/wallet/transfer')} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Transfer</button>
              <button onClick={() => router.push('/wallet/withdraw')} className="px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700">Withdraw</button>
            </div>
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
          {!(user as any)?.kyc?.status || (user as any)?.kyc?.status !== 'APPROVED' ? (
            <div className="bg-yellow-600/20 border border-yellow-500/40 text-yellow-200 rounded-2xl p-4 mb-4">
              <div className="font-semibold mb-1">Finish KYC to unlock all features</div>
              <div className="text-sm text-yellow-100/80">Verify your identity from the dashboard to access transfers, CAC, vendor onboarding and more.</div>
              <div className="mt-3">
                <button onClick={() => setShowKyc(true)} className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700">Start KYC</button>
              </div>
            </div>
          ) : null}
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

        {/* Service Discovery Map */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Service Discovery</h2>
          <ServiceMap services={[...services, {
            id: 'escrow',
            name: 'Escrow',
            description: 'Hold funds securely until delivery',
            status: 'active' as const,
            metadata: { icon: '🛡️', category: 'trust', color: '#2DD4BF' },
            position_x: 280, position_y: 240,
          }] as any} onServiceClick={handleServiceClick} />
        </div>

        {/* Service Containers */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">Transfer</h3>
              <p className="text-sm text-gray-300">Send money instantly to anyone.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/wallet/transfer')} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Open</button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">Escrow</h3>
              <p className="text-sm text-gray-300">Hold funds until delivery is confirmed.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/escrow')} className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700">Open</button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">Register Business (CAC)</h3>
              <p className="text-sm text-gray-300">Incorporate your company quickly.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/cac-registration')} className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700">Open</button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">Vendor Onboarding</h3>
              <p className="text-sm text-gray-300">Become a marketplace vendor.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/commerce/onboard')} className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700">Open</button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">Storelink Creation</h3>
              <p className="text-sm text-gray-300">Create a shareable store link.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/commerce')} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700">Open</button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">Digital Subscriptions</h3>
              <p className="text-sm text-gray-300">Manage recurring billing.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/subscriptions')} className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700">Open</button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">NIN Registration</h3>
              <p className="text-sm text-gray-300">Enroll for NIN nationwide.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/nin/enroll')} className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700">Open</button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">Premium Card Printing</h3>
              <p className="text-sm text-gray-300">Order high-quality ID cards.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/nin/card')} className="px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700">Open</button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <h3 className="font-semibold">TIN Registration</h3>
              <p className="text-sm text-gray-300">Individual and Corporate TIN.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => router.push('/tin')} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">Open</button>
              </div>
            </div>
          </div>
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
