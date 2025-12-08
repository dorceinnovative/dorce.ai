
'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function TelecomPage() {
  const [serviceType] = useState<'airtime' | 'data' | 'electricity' | 'cable' | 'betting'>('airtime')
  const [network, setNetwork] = useState<'mtn' | 'airtel' | 'glo' | '9mobile' | 'smile'>('mtn')
  const [amount, setAmount] = useState<number>(500)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusRes, setStatusRes] = useState<any>(null)

  const detectNetwork = (num: string): 'mtn' | 'airtel' | 'glo' | '9mobile' | 'smile' => {
    const clean = num.replace(/\D/g, '')
    const prefix = clean.slice(-10).slice(0,3)
    const mtn = ['803','806','703','706','813','816','810','814','904','917']
    const airtel = ['802','808','812','701','704','902','907']
    const glo = ['805','807','705','815','811','905']
    const nine = ['809','817','818','909','908']
    if (mtn.includes(prefix)) return 'mtn'
    if (airtel.includes(prefix)) return 'airtel'
    if (glo.includes(prefix)) return 'glo'
    if (nine.includes(prefix)) return '9mobile'
    return 'mtn'
  }

  const purchase = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await apiClient.telecomPurchase({ serviceType, network, amount, phone })
      setResult(res)
    } catch (e: any) {
      setError(e?.message || 'Purchase failed')
    } finally {
      setLoading(false)
    }
  }

  const pollStatus = async () => {
    const ref = (result && (result.reference || result.id)) || ''
    if (!ref) return
    setLoading(true); setError(null)
    try {
      const s: any = await apiClient.request(`/api/marketplace/transactions/status?ref=${encodeURIComponent(ref)}`)
      setStatusRes(s?.data ?? s)
    } catch (e: any) { setError(e?.message || 'Status check failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Telecom Services</h1>
          <p className="text-gray-300 mt-2">Instant top‑ups across all networks. Secure, fast, and reliable.</p>
        </div>

        <Card className="border-blue-500/30 bg-black/40">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-xl">Purchase</CardTitle>
            <CardDescription>Select network, amount and phone/meter</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-blue-300">Network</label>
                <Input value={network} onChange={(e)=>setNetwork(e.target.value as any)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-blue-300">Amount</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-blue-300">Phone/Meter</label>
                <Input value={phone} onChange={(e) => { const v = e.target.value; setPhone(v); setNetwork(detectNetwork(v)) }} />
                <div className="text-xs text-gray-400">Detected: {network.toUpperCase()}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant processing • Secure payments</span>
            </div>
            <Button onClick={purchase} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Processing…' : 'Purchase'}
            </Button>
          </CardFooter>
        </Card>

        {error && <div className="text-red-400 mt-4">{error}</div>}
        {result && (
          <Card className="mt-4 border-blue-500/30 bg-black/40">
            <CardHeader className="border-b border-blue-500/20">
              <CardTitle className="text-lg">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-blue-200 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              <div className="mt-3 flex gap-3">
                <Button onClick={pollStatus} className="px-3 py-2 rounded-lg bg-white/10 border border-blue-500/30 hover:bg-white/20 text-xs">Check Delivery Status</Button>
              </div>
              {statusRes && (
                <div className="mt-3 rounded-lg border border-blue-500/20 p-3">
                  <div className="text-sm text-blue-300 mb-2">Delivery Status</div>
                  <pre className="text-blue-200 text-xs overflow-auto">{JSON.stringify(statusRes, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
