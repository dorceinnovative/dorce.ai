'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { getAuthTokens } from '@/lib/auth-client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Building2, CheckCircle, FileText } from 'lucide-react'

export default function CACRegistrationPage() {
  const [name, setName] = useState('')
  const [type, setType] = useState<'business-name' | 'limited' | 'ngo' | 'cooperative'>('business-name')
  const [checkResult, setCheckResult] = useState<any>(null)
  const [submitResult, setSubmitResult] = useState<any>(null)
  const [tracking, setTracking] = useState('')
  const [status, setStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  const authenticated = !!getAuthTokens()

  const checkName = async () => {
    setError(null)
    setCheckResult(null)
    try {
      const { data } = await api.post('/cac/check-name', { businessName: name })
      setCheckResult(data)
    } catch (err: any) {
      setError(err?.message || 'Name check failed')
    }
  }

  const submitApplication = async () => {
    setError(null)
    setSubmitResult(null)
    try {
      const { data } = await api.post('/cac/applications', { name, type })
      setSubmitResult(data)
    } catch (err: any) {
      setError(err?.message || 'Application submit failed')
    }
  }

  const getStatus = async () => {
    setError(null)
    setStatus(null)
    try {
      const { data } = await api.get(`/cac/applications/${tracking}/status`)
      setStatus(data)
    } catch (err: any) {
      setError(err?.message || 'Status fetch failed')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-blue-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <Building2 className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-blue-300 text-sm font-medium">Agent‑assisted CAC registration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">CAC Registration</h1>
          <p className="text-gray-300 mt-2">Check name availability, submit applications, and track status seamlessly.</p>
        </div>

        {!authenticated && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 mb-6">
            <div className="flex items-center gap-2 text-yellow-300 mb-2"><FileText className="w-4 h-4" /> <span className="font-semibold">Sign in required</span></div>
            <div className="text-gray-300 text-sm mb-4">Sign in to check names, submit applications, and track status.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700">Sign In</a>
          </div>
        )}

        <Card className="border-blue-500/30 bg-black/40">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-xl">New Application</CardTitle>
            <CardDescription>Check name and submit your registration</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-blue-300">Business/Entity Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Example Ventures Ltd" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-blue-300">Registration Type</label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business-name">Business Name</SelectItem>
                  <SelectItem value="limited">Limited Company</SelectItem>
                  <SelectItem value="ngo">NGO</SelectItem>
                  <SelectItem value="cooperative">Cooperative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} />
                <span>
                  I consent to verify my NIN/CAC data for registration purposes under NDPR.
                </span>
              </div>
              <div className="flex gap-3">
                <Button disabled={!authenticated || !consent} onClick={checkName} className="bg-blue-600 hover:bg-blue-700">Check Name</Button>
                <Button disabled={!authenticated || !consent} onClick={submitApplication} className="bg-green-600 hover:bg-green-700">Submit Application</Button>
              </div>
            </div>
            {checkResult && (
              <div className="md:col-span-2 rounded-lg border border-blue-500/20 p-4">
                <div className="flex items-center gap-2 text-blue-300 text-sm mb-2"><CheckCircle className="w-4 h-4" /> Name Check Result</div>
                <pre className="text-blue-200 text-xs overflow-auto">{JSON.stringify(checkResult, null, 2)}</pre>
              </div>
            )}
            {submitResult && (
              <div className="md:col-span-2 rounded-lg border border-green-500/20 p-4">
                <div className="flex items-center gap-2 text-green-300 text-sm mb-2"><CheckCircle className="w-4 h-4" /> Application Submitted</div>
                <pre className="text-green-200 text-xs overflow-auto">{JSON.stringify(submitResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 border-blue-500/30 bg-black/40">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-xl">Track Status</CardTitle>
            <CardDescription>Use your tracking number to check progress</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-blue-300">Tracking Number</label>
              <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="TRK-0000001" />
            </div>
            <Button onClick={getStatus} variant="outline">Get Status</Button>
            {status && (
              <div className="rounded-lg border border-blue-500/20 p-4">
                <div className="flex items-center gap-2 text-blue-300 text-sm mb-2"><FileText className="w-4 h-4" /> Status</div>
                <pre className="text-blue-200 text-xs overflow-auto">{JSON.stringify(status, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
