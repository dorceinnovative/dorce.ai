'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MarketTransactionsPage() {
  const { isAuthenticated } = useAuth()
  const [airtime, setAirtime] = useState<any[]>([])
  const [electricity, setElectricity] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const a = await apiClient.request('/api/marketplace/transactions/airtime')
      const e = await apiClient.request('/api/marketplace/transactions/electricity')
      setAirtime(a?.data || a?.transactions || [])
      setElectricity(e?.data || e?.transactions || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (isAuthenticated) load() }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to view your marketplace transactions.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-orange-300 text-sm font-medium">Marketplace History</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Transactions</h1>
          <p className="text-gray-300 mt-2">Review airtime and electricity payments.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-orange-500/30 bg-black/40">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-xl">Airtime Transactions</CardTitle>
            <CardDescription>Recent top‑ups</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && <div className="text-red-400 mb-4">{error}</div>}
            {loading && <div className="text-gray-400">Loading…</div>}
            <div className="space-y-3">
              {airtime.map((t: any) => (
                <div key={t.id || t.reference} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                  <div className="text-sm text-gray-300">Reference</div>
                  <div className="text-lg font-semibold">{t.reference || t.id}</div>
                  <div className="text-sm">Amount: ₦{(Number(t.amount)/100).toLocaleString()}</div>
                  <div className="text-sm">Status: {t.status}</div>
                </div>
              ))}
              {airtime.length === 0 && (
                <div className="text-gray-400">No airtime transactions.</div>
              )}
            </div>
            <div className="mt-4"><Button variant="outline" onClick={load}>Refresh</Button></div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-black/40">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-xl">Electricity Transactions</CardTitle>
            <CardDescription>Recent payments</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && <div className="text-red-400 mb-4">{error}</div>}
            {loading && <div className="text-gray-400">Loading…</div>}
            <div className="space-y-3">
              {electricity.map((t: any) => (
                <div key={t.id || t.reference} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                  <div className="text-sm text-gray-300">Reference</div>
                  <div className="text-lg font-semibold">{t.reference || t.id}</div>
                  <div className="text-sm">Amount: ₦{(Number(t.amount)/100).toLocaleString()}</div>
                  <div className="text-sm">Status: {t.status}</div>
                </div>
              ))}
              {electricity.length === 0 && (
                <div className="text-gray-400">No electricity transactions.</div>
              )}
            </div>
            <div className="mt-4"><Button variant="outline" onClick={load}>Refresh</Button></div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
