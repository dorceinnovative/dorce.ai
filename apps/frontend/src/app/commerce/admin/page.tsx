'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
type ProductCategory = 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'PIN_VOUCHER'
import { useAuth } from '@/lib/auth-context'

export default function AdminProductsPage() {
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kpi, setKpi] = useState<{ gmv: number; orders: number; successRate: number } | null>(null)

  const [form, setForm] = useState({
    name: '',
    category: 'AIRTIME' as ProductCategory,
    description: '',
    icon: '',
    provider: '',
    price: '' as any,
  })

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await apiClient.getProducts()
      setProducts(data.products || [])
      try {
        const a = await apiClient.request('/api/marketplace/transactions/airtime')
        const e = await apiClient.request('/api/marketplace/transactions/electricity')
        const airtime = a?.data || a?.transactions || []
        const electricity = e?.data || e?.transactions || []
        const all = [...airtime, ...electricity]
        const orders = all.length
        const gmv = all.reduce((sum: number, t: any) => sum + (Number(t.amount)||0), 0)
        const successes = all.filter((t: any) => String(t.status||'').toLowerCase().includes('success')).length
        const successRate = orders ? Math.round((successes/orders)*1000)/10 : 0
        setKpi({ gmv, orders, successRate })
      } catch {}
    } catch (e: any) {
      setError(e?.message || 'Failed to load products')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (isAuthenticated) load() }, [isAuthenticated])

  const createProduct = async () => {
    setLoading(true); setError(null)
    try {
      await apiClient.request('/api/marketplace/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description,
          icon: form.icon,
          provider: form.provider,
          price: form.price ? Number(form.price) : undefined,
        }),
      })
      await load()
      setForm({ name: '', category: 'AIRTIME', description: '', icon: '', provider: '', price: '' })
    } catch (e: any) {
      setError(e?.message || 'Create product failed')
    } finally { setLoading(false) }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
            <div className="text-lg font-semibold mb-2">Admin access required</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to manage marketplace products.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-orange-300 text-sm font-medium">Vendor Admin</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Admin: Marketplace Products</h1>
          <p className="text-gray-300 mt-2">Create and manage products for airtime/data/electricity.</p>
        </div>

        {kpi && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
              <div className="text-sm text-gray-300">GMV</div>
              <div className="text-2xl font-semibold">₦{(kpi.gmv/100).toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
              <div className="text-sm text-gray-300">Orders</div>
              <div className="text-2xl font-semibold">{kpi.orders}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
              <div className="text-sm text-gray-300">Success Rate</div>
              <div className="text-2xl font-semibold">{kpi.successRate}%</div>
            </div>
          </div>
        )}

        <Card className="border-orange-500/30 bg-black/40 mb-6">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-xl">Create Product</CardTitle>
            <CardDescription>Fill details and save</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ProductCategory })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={'AIRTIME'}>Airtime</SelectItem>
                  <SelectItem value={'DATA'}>Data</SelectItem>
                  <SelectItem value={'ELECTRICITY'}>Electricity</SelectItem>
                  <SelectItem value={'PIN_VOUCHER'}>Pin Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Icon URL</label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Provider</label>
              <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Fixed Price (kobo)</label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Button disabled={loading} onClick={createProduct} className="bg-orange-600 hover:bg-orange-700">{loading ? 'Saving…' : 'Save Product'}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-black/40">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-xl">Products</CardTitle>
            <CardDescription>Current active products</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && <div className="text-red-400 mb-4">{error}</div>}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                    <div className="h-24 bg-white/5 rounded-lg mb-3" />
                    <div className="h-4 w-2/3 bg-white/5 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                  <div className="h-24 bg-white/5 rounded-lg mb-3" />
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.category}</div>
                  <div className="mt-1 text-sm text-gray-300">{p.description}</div>
                  <div className="mt-2 text-sm font-semibold">{p.price ? `₦${(p.price/100).toLocaleString()}` : 'Dynamic'}</div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-gray-400">No products yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
