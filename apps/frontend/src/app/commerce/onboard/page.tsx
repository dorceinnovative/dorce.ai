'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function VendorOnboardPage() {
  const { isAuthenticated } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState('')
  const [banner, setBanner] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#10b981')
  const [secondaryColor, setSecondaryColor] = useState('#0ea5e9')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const submit = async () => {
    if (!name || !slug) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await apiClient.request('/vendor/store', {
        method: 'POST',
        body: JSON.stringify({
          name, slug, description, logo, banner,
          primaryColor, secondaryColor,
        }),
      })
      setResult(res?.data || res)
    } catch (e: any) {
      setError(e?.message || 'Onboarding failed')
    } finally { setLoading(false) }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to create your vendor store.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-orange-300 text-sm font-medium">Vendor Onboarding</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Create Your Store</h1>
          <p className="text-gray-300 mt-2">Set up branding, colors, and description.</p>
        </div>
        <Card className="border-orange-500/30 bg-black/40">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-xl">Vendor Onboarding</CardTitle>
            <CardDescription>Create your store profile</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Store Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Slug</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-store" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm text-orange-300">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Logo URL</label>
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Banner URL</label>
              <Input value={banner} onChange={(e) => setBanner(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Primary Color</label>
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-orange-300">Secondary Color</label>
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button disabled={loading} onClick={submit} className="bg-orange-600 hover:bg-orange-700">{loading ? 'Submitting…' : 'Create Store'}</Button>
            </div>
            {error && (
              <div className="md:col-span-2 text-red-400">{error}</div>
            )}
            {result && (
              <div className="md:col-span-2 rounded-lg border border-orange-500/20 p-4">
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
