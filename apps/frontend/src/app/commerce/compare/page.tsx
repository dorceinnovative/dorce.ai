'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'

export default function ComparePage() {
  const params = useSearchParams()
  const idsParam = (params?.get('ids')) || ''
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const { products } = await apiClient.getProducts()
        const ids = idsParam.split(',').map((x)=>x.trim()).filter(Boolean)
        const selected = (products || []).filter((p: any) => ids.includes(String(p.id))).slice(0,3)
        setProducts(selected)
      } catch (e: any) { setError(e?.message || 'Failed to load products') }
      finally { setLoading(false) }
    }
    load()
  }, [idsParam])

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-orange-300 text-sm font-medium">Vendor Comparison</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Compare</h1>
          <p className="text-gray-300 mt-2">Review pricing, provider, and reliability side by side.</p>
        </div>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                <div className="h-24 bg-white/5 rounded-lg mb-3" />
                <div className="h-4 w-2/3 bg-white/5 rounded mb-2" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        )}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                <div className="text-lg font-semibold mb-1">{p.name}</div>
                <div className="text-xs text-gray-400 mb-2">{p.category}</div>
                <div className="text-sm text-gray-300 mb-4">{p.description}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Price</div>
                    <div className="font-semibold">{p.price ? `₦${(p.price/100).toLocaleString()}` : 'Dynamic'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Provider</div>
                    <div className="font-semibold">{p.provider || '—'}</div>
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
                <div className="mt-3 flex gap-3">
                  <a href={`/commerce/product/${p.id}`} className="px-3 py-2 rounded-lg bg-white/10 border border-orange-500/30 hover:bg-white/20 text-sm">Details</a>
                  <a href={`/commerce/purchase?productId=${p.id}`} className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm">Buy</a>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && products.length === 0 && (
          <div className="text-gray-400">No products selected. Provide ids like `?ids=1,2,3`.</div>
        )}
      </div>
    </div>
  )
}
