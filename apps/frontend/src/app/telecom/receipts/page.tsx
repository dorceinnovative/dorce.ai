'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function TelecomReceiptsPage() {
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
    } catch (err: any) { setError(err?.message || 'Failed to load receipts') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const ReceiptList = ({ items, title }: { items: any[]; title: string }) => (
    <Card className="border-blue-500/30 bg-black/40">
      <CardHeader className="border-b border-blue-500/20">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>Recent receipts</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">
        {items.map((t: any, i: number) => (
          <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-blue-400/30">
            <div className="text-sm">Ref: {t.reference || t.id}</div>
            <div className="text-sm">Amount: ₦{(Number(t.amount)/100).toLocaleString()}</div>
            <div className="text-sm">Status: {t.status}</div>
            <div className="text-xs text-gray-400">{t.createdAt || t.timestamp || ''}</div>
            <div className="mt-2">
              <button onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-white/10 border border-blue-500/30 hover:bg-white/20 text-xs">Print</button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-gray-400">No receipts.</div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-blue-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-blue-300 text-sm font-medium">Telecom Receipts</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Receipts</h1>
          <p className="text-gray-300 mt-2">Review your airtime and electricity purchases.</p>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        {loading && <div className="text-gray-400 mb-4">Loading…</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReceiptList items={airtime} title="Airtime" />
          <ReceiptList items={electricity} title="Electricity" />
        </div>
      </div>
    </div>
  )
}
