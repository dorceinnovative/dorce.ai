'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NinOrdersPage() {
  const { isAuthenticated, user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!user?.id) return
    setLoading(true); setError(null)
    try {
      const { data } = await api.get(`/api/nin/orders/${user.id}`)
      setOrders(data || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (isAuthenticated) load() }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to view your NIN orders.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <Card className="border-green-500/30 bg-black/40">
          <CardHeader className="border-b border-green-500/20">
            <CardTitle className="text-xl">My NIN Orders</CardTitle>
            <CardDescription>Premium slips and plastic card requests</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && <div className="text-red-400 mb-4">{error}</div>}
            {loading && <div className="text-gray-400">Loading…</div>}
            <div className="space-y-3">
              {orders.map((o: any) => (
                <div key={o.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30">
                  <div className="text-sm text-gray-300">Reference</div>
                  <div className="text-lg font-semibold">{o.reference}</div>
                  <div className="mt-2 text-sm">Type: {o.type}</div>
                  <div className="text-sm">Amount: ₦{(Number(o.amount)/100).toLocaleString()}</div>
                  <div className="text-sm">Status: {o.status}</div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-gray-400">No orders yet.</div>
              )}
            </div>
            <div className="mt-4"><Button variant="outline" onClick={load}>Refresh</Button></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

