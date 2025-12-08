'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

export default function ConfirmPaymentPage() {
  const { isAuthenticated } = useAuth()
  const [transactionId, setTransactionId] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    if (!transactionId || !reference) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await apiClient.request('/api/marketplace/transactions/confirm', {
        method: 'POST',
        body: JSON.stringify({ transactionId, reference }),
      })
      setResult(res)
    } catch (e: any) {
      setError(e?.message || 'Confirmation failed')
    } finally { setLoading(false) }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to confirm payments.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-orange-300 text-sm font-medium">Payment Confirmation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Confirm Payment</h1>
          <p className="text-gray-300 mt-2">Verify your transaction against provider reference.</p>
        </div>
        <Card className="border-orange-500/30 bg-black/40">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-xl">Confirm Payment</CardTitle>
            <CardDescription>Enter transaction ID and provider reference</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Transaction ID</label>
              <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Payment Reference</label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <Button disabled={loading} onClick={confirm} className="bg-orange-600 hover:bg-orange-700">{loading ? 'Confirming…' : 'Confirm Payment'}</Button>
            {error && <div className="text-red-400">{error}</div>}
            {result && (
              <div className="rounded-lg border border-orange-500/20 p-4">
                <div className="text-sm text-orange-300 mb-2">Result</div>
                <pre className="text-orange-200 text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
