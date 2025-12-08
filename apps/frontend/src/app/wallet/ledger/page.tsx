'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function WalletLedgerPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res: any = await apiClient.request('/api/wallet/ledger')
      setEntries(res?.data ?? res?.entries ?? [])
    } catch (e: any) { setError(e?.message || 'Failed to load ledger') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const exportCsv = () => {
    try {
      const rows = [['date','account','type','amount','balance','reference']]
      entries.forEach((t: any) => rows.push([
        String(t.date||t.createdAt||''),
        String(t.account||''),
        String(t.type||''),
        String(t.amount||''),
        String(t.balance||''),
        String(t.reference||t.id||'')
      ]))
      const csv = rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'wallet-ledger.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const filtered = entries.filter((t) =>
    filter === '' || String(t.type||'').toLowerCase().includes(filter.toLowerCase()) || String(t.account||'').toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-green-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-green-300 text-sm font-medium">Wallet Ledger</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">Ledger</h1>
          <p className="text-gray-300 mt-2">Double-entry journal of your wallet accounts.</p>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        {loading && <div className="text-gray-400 mb-4">Loading…</div>}
        <div className="mb-4 flex gap-3 items-center">
          <input placeholder="Filter by account/type" value={filter} onChange={(e)=>setFilter(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-green-500/30 w-full max-w-md" />
          <button onClick={exportCsv} className="px-3 py-2 rounded-lg bg-white/10 border border-green-500/30 hover:bg-white/20 text-xs">Export CSV</button>
        </div>
        <Card className="border-green-500/30 bg-black/40">
          <CardHeader className="border-b border-green-500/20">
            <CardTitle className="text-xl">Entries</CardTitle>
            <CardDescription>Recent journal entries</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {filtered.map((t: any, i: number) => (
              <div key={i} className="grid grid-cols-5 gap-3 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-green-400/30">
                <div className="text-xs text-gray-400">{t.date||t.createdAt||''}</div>
                <div className="text-sm">{t.account}</div>
                <div className="text-sm">{t.type}</div>
                <div className="text-sm">₦{(Number(t.amount)/100).toLocaleString()}</div>
                <div className="text-xs text-gray-400">Bal: ₦{(Number(t.balance)/100).toLocaleString()}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-gray-400">No entries.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
