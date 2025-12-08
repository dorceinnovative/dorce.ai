'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

export default function AgentDashboard() {
  const [me, setMe] = useState<{ id: string; email: string } | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError(null)
      try {
        const user = await apiClient.getCurrentUser()
        setMe(user)
        const o = await apiClient.ninOrdersByUser(user.id)
        const s = await apiClient.ninStatsByUser(user.id)
        setOrders(Array.isArray(o) ? o : (o?.orders || []))
        setStats(s)
      } catch (e: any) { setError(e?.message || 'Failed to load agent dashboard') }
      finally { setLoading(false) }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-blue-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-blue-300 text-sm font-medium">Agent Workspace</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Agent Dashboard</h1>
          <p className="text-gray-300 mt-2">Manage NIN orders and registration services.</p>
        </div>
        {loading && <div className="text-gray-400">Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {me && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 mb-6">
            <div className="text-lg">{me.email}</div>
            <div className="text-sm text-gray-300">ID: {me.id}</div>
          </div>
        )}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Object.entries(stats).map(([k, v], i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
                <div className="text-sm text-gray-300">{k}</div>
                <div className="text-2xl font-semibold">{String(v)}</div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
          <h2 className="text-xl font-semibold mb-4">My NIN Orders</h2>
          <div className="space-y-3">
            {orders.map((o, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div>
                  <div className="text-sm">{o.type || o.title || 'NIN Order'}</div>
                  <div className="text-xs text-gray-400">{o.status || 'pending'}</div>
                </div>
                <a href={`/nin/card?orderId=${o.id || o.orderId || ''}`} className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-sm">Manage</a>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-gray-400 text-sm">No orders yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
