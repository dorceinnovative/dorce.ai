'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettlementsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res: any = await apiClient.request<any>('/api/marketplace/settlements')
      setItems(res?.data || res?.settlements || res || [])
    } catch (e: any) { setError(e?.message || 'Failed to load settlements') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const exportCsv = () => {
    try {
      const rows = [['date','vendor','amount','status','reference']]
      items.forEach((s: any) => rows.push([
        String(s.date||s.createdAt||''),
        String(s.vendor||s.account||''),
        String(s.amount||''),
        String(s.status||''),
        String(s.reference||s.id||'')
      ]))
      const csv = rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'settlements.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const totals = items.reduce((acc, s: any) => acc + (Number(s.amount)||0), 0)

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-orange-300 text-sm font-medium">Marketplace Settlements</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Settlements</h1>
          <p className="text-gray-300 mt-2">Review payouts to vendors and export statements.</p>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        {loading && <div className="text-gray-400 mb-4">Loading…</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-orange-500/30 bg-black/40">
            <CardHeader>
              <CardTitle className="text-lg">Total Amount</CardTitle>
              <CardDescription>₦{(totals/100).toLocaleString()}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-orange-500/30 bg-black/40">
            <CardHeader>
              <CardTitle className="text-lg">Settlements</CardTitle>
              <CardDescription>{items.length}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-orange-500/30 bg-black/40">
            <CardHeader>
              <CardTitle className="text-lg">Export</CardTitle>
              <CardDescription>
                <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Card className="border-orange-500/30 bg-black/40">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-xl">Payouts</CardTitle>
            <CardDescription>Recent settlements</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {items.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-orange-400/30">
                <div>
                  <div className="text-sm font-semibold">{s.vendor||s.account||'Vendor'}</div>
                  <div className="text-xs text-gray-400">{s.reference||s.id||''}</div>
                </div>
                <div className="text-sm">₦{(Number(s.amount)/100).toLocaleString()}</div>
                <div className="text-xs text-gray-400">{s.status||'processed'}</div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-gray-400">No settlements yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

