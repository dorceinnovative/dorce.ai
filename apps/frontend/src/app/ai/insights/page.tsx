'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient, api } from '@/lib/api'

export default function AIInsightsPage() {
  const { isAuthenticated } = useAuth()
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [businessInsights, setBusinessInsights] = useState<string>('')
  const [marketResearch, setMarketResearch] = useState<string>('')
  const [marketingContent, setMarketingContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const runBusiness = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.post<string>('/api/integration/ai/business-insights', { industry, location })
      setBusinessInsights(data)
    } catch (e: any) { setError(e?.message || 'Business insights failed') } finally { setLoading(false) }
  }

  const runMarket = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.post<string>('/api/integration/ai/market-research', { industry, location })
      setMarketResearch(data)
    } catch (e: any) { setError(e?.message || 'Market research failed') } finally { setLoading(false) }
  }

  const runMarketing = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.post<string>('/api/integration/ai/marketing-content', { product })
      setMarketingContent(data)
    } catch (e: any) { setError(e?.message || 'Marketing content failed') } finally { setLoading(false) }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to use AI insights.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-500/30 bg-black/40">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-xl">Business Insights</CardTitle>
            <CardDescription>Industry and location</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <Input placeholder="Industry" value={industry} onChange={(e)=>setIndustry(e.target.value)} />
            <Input placeholder="Location" value={location} onChange={(e)=>setLocation(e.target.value)} />
            <Button disabled={loading} onClick={runBusiness} className="bg-blue-600 hover:bg-blue-700">Generate</Button>
            {error && <div className="text-red-400">{error}</div>}
            {businessInsights && <pre className="text-blue-200 text-xs overflow-auto">{businessInsights}</pre>}
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-black/40">
          <CardHeader className="border-b border-purple-500/20">
            <CardTitle className="text-xl">Market Research</CardTitle>
            <CardDescription>Industry and location</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <Input placeholder="Industry" value={industry} onChange={(e)=>setIndustry(e.target.value)} />
            <Input placeholder="Location" value={location} onChange={(e)=>setLocation(e.target.value)} />
            <Button disabled={loading} onClick={runMarket} className="bg-purple-600 hover:bg-purple-700">Research</Button>
            {marketResearch && <pre className="text-purple-200 text-xs overflow-auto">{marketResearch}</pre>}
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-black/40">
          <CardHeader className="border-b border-green-500/20">
            <CardTitle className="text-xl">Marketing Content</CardTitle>
            <CardDescription>Product name/description</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <Input placeholder="Product" value={product} onChange={(e)=>setProduct(e.target.value)} />
            <Button disabled={loading} onClick={runMarketing} className="bg-green-600 hover:bg-green-700">Generate</Button>
            {marketingContent && <pre className="text-green-200 text-xs overflow-auto">{marketingContent}</pre>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

