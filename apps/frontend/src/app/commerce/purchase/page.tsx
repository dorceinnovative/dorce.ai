'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

export default function PurchaseAirtimePage() {
  const { isAuthenticated } = useAuth()
  const params = useSearchParams()
  const productId = (params?.get('productId')) || ''
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return
      try {
        const { products } = await apiClient.getProducts()
        const p = (products || []).find((x: any) => x.id === productId)
        setProduct(p || null)
      } catch {}
    }
    loadProduct()
  }, [productId])

  const purchase = async () => {
    if (!productId || !phone) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await apiClient.request('/api/marketplace/purchases/airtime', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          phoneNumber: phone,
          customAmount: amount ? Number(amount) : undefined,
          metadata: { channel: 'web' },
        }),
      })
      setResult(res)
    } catch (e: any) {
      setError(e?.message || 'Purchase failed')
    } finally { setLoading(false) }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to purchase airtime.</div>
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
            <span className="text-orange-300 text-sm font-medium">Complete Purchase</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Purchase Airtime</h1>
          <p className="text-gray-300 mt-2">Enter phone and optional amount; confirm payment after provider ref.</p>
        </div>
        <Card className="border-orange-500/30 bg-black/40">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-xl">Purchase Airtime</CardTitle>
            <CardDescription>Complete your top‑up</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {product && (
              <div className="rounded-lg border border-orange-500/20 p-4">
                <div className="text-lg font-semibold">{product.name}</div>
                <div className="text-xs text-gray-400">{product.category}</div>
                <div className="mt-1 text-sm text-gray-300">{product.description}</div>
                <div className="mt-2 text-sm font-semibold">{product.price ? `₦${(product.price/100).toLocaleString()}` : 'Dynamic price'}</div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Amount (optional, kobo)</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <Button disabled={loading} onClick={purchase} className="bg-orange-600 hover:bg-orange-700">{loading ? 'Processing…' : 'Purchase'}</Button>
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
