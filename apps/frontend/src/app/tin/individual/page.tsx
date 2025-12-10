'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BadgeCheck, User, Mail, Phone, FileText, MapPin, ArrowRight } from 'lucide-react'

export default function TinIndividualPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nin, setNin] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [tracking, setTracking] = useState('')
  const [status, setStatus] = useState<any>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.post('/api/tin/individual/apply', {
        fullName, email, phone, nin, address
      })
      setResult(data)
      if ((data as any)?.trackingId) setTracking((data as any).trackingId)
    } catch (err: any) {
      setError(err?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    setError(null)
    setStatus(null)
    try {
      const { data } = await api.get(`/api/tin/applications/${tracking}/status`)
      setStatus(data)
    } catch (err: any) {
      setError(err?.message || 'Status fetch failed')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-indigo-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <BadgeCheck className="w-4 h-4 text-indigo-400 mr-2" />
            <span className="text-indigo-300 text-sm font-medium">Agent‑assisted individual TIN registration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Individual TIN</h1>
          <p className="text-gray-300 mt-2">Register a Tax Identification Number for personal tax purposes.</p>
        </div>

        <Card className="border-indigo-500/30 bg-black/40">
          <CardHeader className="border-b border-indigo-500/20">
            <CardTitle>Applicant Information</CardTitle>
            <CardDescription>Provide your details to begin TIN registration.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="Full Name" value={fullName} onChange={(e)=>setFullName(e.target.value)} className="pl-9 bg-black/40 border-indigo-500/30" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="pl-9 bg-black/40 border-indigo-500/30" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="Phone" value={phone} onChange={(e)=>setPhone(e.target.value)} className="pl-9 bg-black/40 border-indigo-500/30" />
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="NIN (optional)" value={nin} onChange={(e)=>setNin(e.target.value)} className="pl-9 bg-black/40 border-indigo-500/30" />
            </div>
            <div className="relative md:col-span-2">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="Residential Address" value={address} onChange={(e)=>setAddress(e.target.value)} className="pl-9 bg-black/40 border-indigo-500/30" />
            </div>
          </CardContent>
          <CardFooter className="flex items-center gap-3">
            <Button onClick={submit} disabled={loading || !fullName || !email || !phone} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? 'Submitting...' : 'Submit Application'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {error && <div className="text-sm text-red-400">{error}</div>}
            {result && <div className="text-sm text-green-400">Application submitted. Tracking ID: {(result as any)?.trackingId || 'generated'}</div>}
          </CardFooter>
        </Card>

        <div className="mt-8">
          <Card className="border-indigo-500/30 bg-black/40">
            <CardHeader className="border-b border-indigo-500/20">
              <CardTitle>Check Application Status</CardTitle>
              <CardDescription>Use your tracking ID to see progress.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 pt-4">
              <Input placeholder="Tracking ID" value={tracking} onChange={(e)=>setTracking(e.target.value)} className="bg-black/40 border-indigo-500/30" />
              <Button onClick={checkStatus} className="bg-white/10 border border-indigo-500/30 hover:bg-white/20">Check Status</Button>
            </CardContent>
            {status && (
              <CardFooter className="text-sm text-gray-300">
                <div>Status: {(status as any)?.status || 'Pending'}</div>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <Link href="/tin" className="hover:text-white">Back to TIN</Link>
        </div>
      </div>
    </div>
  )
}

