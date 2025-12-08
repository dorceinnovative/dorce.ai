'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Shield, CheckCircle, BadgeCheck, Star } from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const id = String(params?.id || '')
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const { products } = await apiClient.getProducts()
        const p = (products || []).find((x: any) => String(x.id) === id)
        setProduct(p || null)
      } catch (e: any) { setError(e?.message || 'Failed to load product') }
      finally { setLoading(false) }
    }
    if (id) load()
  }, [id])

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-orange-300 text-sm font-medium">Product Details</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Marketplace</h1>
          <p className="text-gray-300 mt-2">Review pricing, provider, and service guarantees.</p>
        </div>
        {loading && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
            <div className="h-36 bg-white/5 rounded-lg mb-4" />
            <div className="h-4 w-2/3 bg-white/5 rounded mb-2" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
        )}
        {error && <div className="text-red-400">{error}</div>}
        {product && (
          <Card className="border-orange-500/30 bg-black/40">
            <CardHeader className="border-b border-orange-500/20">
              <CardTitle className="text-xl">{product.name || 'Product'}</CardTitle>
              <CardDescription>{product.category || 'General'}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="h-48 bg-white/5 rounded-lg" />
              <div className="text-gray-300 text-sm">{product.description || ''}</div>
              <div className="flex items-center gap-3 text-xs">
                <div className="inline-flex items-center bg-white/10 border border-orange-500/20 rounded-full px-3 py-1">
                  <Shield className="w-3 h-3 mr-1" /> PCI‑DSS
                </div>
                <div className="inline-flex items-center bg-white/10 border border-orange-500/20 rounded-full px-3 py-1">
                  <BadgeCheck className="w-3 h-3 mr-1" /> NDPR
                </div>
                <div className="inline-flex items-center bg.white/10 border border-orange-500/20 rounded-full px-3 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" /> Uptime 99.9%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400">Price</div>
                  <div className="font-semibold">{product.price ? `₦${(product.price/100).toLocaleString()}` : 'Dynamic'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Provider</div>
                  <div className="font-semibold">{product.provider || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Delivery ETA</div>
                  <div className="font-semibold">Under 30s</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                  <div className="font-semibold">99.9%</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-yellow-300">
                {[1,2,3,4,5].map((i)=> (
                  <Star key={i} className="w-4 h-4" />
                ))}
                <span className="text-xs text-gray-400 ml-2">Top rated vendor</span>
              </div>
              <div className="text-xs text-gray-500">Auto‑failover enabled. Refunds processed within 24h.</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white/5 rounded-xl p-4 border border-orange-500/20">
                  <div className="text-sm font-semibold mb-2">Service Level</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Delivery: under 30 seconds</li>
                    <li>• Availability: 99.9%</li>
                    <li>• Failover routing on provider downtime</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-orange-500/20">
                  <div className="text-sm font-semibold mb-2">Refund Policy</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Instant reversal on failed delivery</li>
                    <li>• Refund window: 24 hours</li>
                    <li>• Disputes handled within 48 hours</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <a href={`/commerce/purchase?productId=${product.id}`} className="inline-block px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">Buy Now</a>
              <a href={`/commerce/confirm`} className="inline-block px-4 py-2 rounded-lg bg-white/10 border border-orange-500/30 hover:bg-white/20">Confirm Payment</a>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
