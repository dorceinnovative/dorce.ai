'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function WalletWithdrawPage() {
  const [amount, setAmount] = useState<number>(1000)
  const [channel, setChannel] = useState<'bank'|'wallet'|'paystack'>('bank')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const withdraw = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await apiClient.request('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, channel, destination })
      })
      setResult(res)
    } catch (e: any) { setError(e?.message || 'Withdrawal failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-green-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-green-300 text-sm font-medium">Wallet Withdrawal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">Withdraw</h1>
          <p className="text-gray-300 mt-2">Withdraw funds to bank, another wallet, or Paystack.</p>
        </div>
        <Card className="border-green-500/30 bg-black/40">
          <CardHeader className="border-b border-green-500/20">
            <CardTitle className="text-xl">Withdraw</CardTitle>
            <CardDescription>Enter amount and destination</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-green-300">Amount (kobo)</label>
              <Input type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text.green.-300">Channel</label>
              <select value={channel} onChange={(e)=>setChannel(e.target.value as any)} className="px-3 py-2 rounded-lg bg-black/40 border border-green-500/30">
                <option value="bank">Bank</option>
                <option value="wallet">Wallet</option>
                <option value="paystack">Paystack</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-green-300">Destination</label>
              <Input placeholder="Account/Wallet ID" value={destination} onChange={(e)=>setDestination(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="text-xs text-gray-400">Fees shown before confirm</div>
            <Button onClick={withdraw} disabled={loading} className="bg-green-600 hover:bg-green-700">{loading ? 'Processing…' : 'Withdraw'}</Button>
          </CardFooter>
        </Card>
        {error && <div className="text-red-400 mt-4">{error}</div>}
        {result && (
          <Card className="mt-4 border-green-500/30 bg-black/40">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="text-lg">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-green-200 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

