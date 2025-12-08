'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

export default function RealEstatePage() {
  const [listings, setListings] = useState<{ products: any[]; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.getProducts('real-estate')
        setListings(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load properties')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-emerald-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-emerald-300 text-sm font-medium">Property & Development</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">Real Estate</h1>
          <p className="text-gray-300 mt-2">Discover listings, development projects, and construction resources.</p>
        </div>
        {loading && <div className="text-gray-400">Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {listings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.products.map((p, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-emerald-400/30">
                <div className="h-36 bg-white/5 rounded-lg mb-4" />
                <div className="text-lg font-semibold">{p.title || p.name || 'Property'}</div>
                <div className="text-gray-300 text-sm">{p.location || p.description || ''}</div>
                <div className="mt-2 font-semibold">{p.price ? `₦${(Number(p.price)/100).toLocaleString()}` : ''}</div>
                <button className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors">View Details</button>
              </div>
            ))}
            {listings.products.length === 0 && (
              <div className="text-gray-400">No properties available yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
