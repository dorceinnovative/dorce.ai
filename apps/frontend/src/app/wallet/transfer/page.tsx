'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'

export default function WalletTransferPage() {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState<number>(1000)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true); setError(null); setResult(null)
    try { setResult(await apiClient.walletTransfer(to, amount, note)) } catch (e: any) { setError(e?.message || 'Transfer failed') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-green-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-green-300 text-sm font-medium">Instant Transfers</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">Wallet Transfer</h1>
          <p className="text-gray-300 mt-2">Send money securely with a note.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 space-y-4">
          <input placeholder="Recipient ID/Email/Phone" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">Send</button>
        </div>
        {error && <div className="text-red-400 mt-4">{error}</div>}
        {result && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 mt-4">
            <pre className="text-blue-200 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
