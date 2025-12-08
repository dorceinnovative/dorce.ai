
'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Store } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function CommercePage() {
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState<{ products: any[]; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.getProducts()
        setProducts(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load marketplace')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <Store className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-orange-300 text-sm font-medium">Naija Vendors Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Marketplace</h1>
          <p className="text-gray-300 mt-2">Discover products nationwide. Smart listings and secure orders.</p>
          <div className="mt-4 flex gap-3">
            <a href="/commerce/onboard" className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700">Become a Vendor</a>
            <a href="/commerce/transactions" className="px-4 py-2 rounded-lg bg-white/10 border border-orange-500/30 hover:bg-white/20">My Transactions</a>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30 mb-6">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to view marketplace products and manage orders.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700">Sign In</a>
          </div>
        )}
        {loading && isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                <div className="h-36 bg-white/5 rounded-lg mb-4" />
                <div className="h-4 w-2/3 bg-white/5 rounded mb-2" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        )}
        {error && isAuthenticated && <div className="text-red-400">{error}</div>}

        {products && isAuthenticated && (
          <>
          <div className="mb-4 flex gap-3 items-center">
            <input
              placeholder="Search products"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              className="px-4 py-2 rounded-lg bg-black/40 border border-orange-500/30 w-full max-w-md"
            />
            <select
              value={cat}
              onChange={(e)=>setCat(e.target.value)}
              className="px-3 py-2 rounded-lg bg-black/40 border border-orange-500/30"
            >
              <option value="">All</option>
              <option value="AIRTIME">Airtime</option>
              <option value="DATA">Data</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="PIN_VOUCHER">Pin Voucher</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.products.map((p, i) => (
              ((q==='' || (p.name||'').toLowerCase().includes(q.toLowerCase()) || (p.description||'').toLowerCase().includes(q.toLowerCase()))
                && (cat==='' || String(p.category||'')===cat)) && (
              <Card key={i} className="border-orange-500/30 bg-black/40">
                <CardHeader className="border-b border-orange-500/20">
                  <CardTitle className="text-lg">{p.name || 'Product'}</CardTitle>
                  <CardDescription>{p.category || 'General'}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-36 bg-white/5 rounded-lg mb-4" />
                  <div className="text-gray-300 text-sm">{p.description || ''}</div>
                  <div className="mt-2 font-semibold">{p.price ? `₦${(p.price/100).toLocaleString()}` : 'Dynamic'}</div>
                  <div className="mt-1 text-xs text-gray-400">{p.provider || ''}</div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <a href={`/commerce/purchase?productId=${p.id}`} className="inline-block px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">Buy</a>
                  <a href={`/commerce/confirm`} className="inline-block px-4 py-2 rounded-lg bg-white/10 border border-orange-500/30 hover:bg-white/20">Confirm Payment</a>
                  <a href={`/commerce/product/${p.id}`} className="inline-block px-4 py-2 rounded-lg bg-white/10 border border-orange-500/30 hover:bg-white/20">Details</a>
                </CardFooter>
              </Card>
              )
            ))}
            {products.products.length === 0 && (
              <div className="text-gray-400">No products available yet.</div>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  )
}
