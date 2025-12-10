'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Handshake, User, Store, DollarSign, ArrowRight } from 'lucide-react'

export default function EscrowPage() {
  const [buyerEmail, setBuyerEmail] = useState('')
  const [vendorEmail, setVendorEmail] = useState('')
  const [amount, setAmount] = useState<number>(5000)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [tracking, setTracking] = useState('')
  const [status, setStatus] = useState<any>(null)

  const createEscrow = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.post('/api/escrow/create', {
        buyerEmail, vendorEmail, amount, note
      })
      setResult(data)
      if ((data as any)?.escrowId) setTracking((data as any).escrowId)
    } catch (err: any) {
      setError(err?.message || 'Escrow creation failed')
    } finally {
      setLoading(false)
    }
  }

  const getStatus = async () => {
    setError(null)
    setStatus(null)
    try {
      const { data } = await api.get(`/api/escrow/${tracking}/status`)
      setStatus(data)
    } catch (err: any) {
      setError(err?.message || 'Status fetch failed')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-teal-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-teal-400 mr-2" />
            <span className="text-teal-300 text-sm font-medium">Secure transactions between buyers and vendors</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">Escrow</h1>
          <p className="text-gray-300 mt-2">Hold funds safely until delivery is confirmed. Reduce disputes and build trust.</p>
        </div>

        <Card className="border-teal-500/30 bg-black/40">
          <CardHeader className="border-b border-teal-500/20">
            <CardTitle>Create Escrow</CardTitle>
            <CardDescription>Start a secure transaction between a buyer and a vendor.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="Buyer Email" type="email" value={buyerEmail} onChange={(e)=>setBuyerEmail(e.target.value)} className="pl-9 bg-black/40 border-teal-500/30" />
            </div>
            <div className="relative">
              <Store className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="Vendor Email" type="email" value={vendorEmail} onChange={(e)=>setVendorEmail(e.target.value)} className="pl-9 bg-black/40 border-teal-500/30" />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="Amount (₦)" type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} className="pl-9 bg-black/40 border-teal-500/30" />
            </div>
            <Input placeholder="Note (optional)" value={note} onChange={(e)=>setNote(e.target.value)} className="bg-black/40 border-teal-500/30 md:col-span-2" />
          </CardContent>
          <CardFooter className="flex items-center gap-3">
            <Button onClick={createEscrow} disabled={loading || !buyerEmail || !vendorEmail || amount<=0} className="bg-teal-600 hover:bg-teal-700">
              {loading ? 'Creating...' : 'Create Escrow'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {error && <div className="text-sm text-red-400">{error}</div>}
            {result && <div className="text-sm text-green-400">Escrow created. ID: {(result as any)?.escrowId || 'generated'}</div>}
          </CardFooter>
        </Card>

        <div className="mt-8">
          <Card className="border-teal-500/30 bg-black/40">
            <CardHeader className="border-b border-teal-500/20">
              <CardTitle>Track Escrow</CardTitle>
              <CardDescription>Use the escrow ID to see current status.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 pt-4">
              <Input placeholder="Escrow ID" value={tracking} onChange={(e)=>setTracking(e.target.value)} className="bg-black/40 border-teal-500/30" />
              <Button onClick={getStatus} className="bg-white/10 border border-teal-500/30 hover:bg-white/20">Check Status</Button>
            </CardContent>
            {status && (
              <CardFooter className="text-sm text-gray-300">
                <div>Status: {(status as any)?.status || 'Pending'}</div>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="mt-8 text-sm text-gray-400 flex gap-6">
          <Link href="/dashboard" className="hover:text-white inline-flex items-center gap-2"><Handshake className="w-4 h-4" />Back to Dashboard</Link>
          <Link href="/commerce/onboard" className="hover:text-white inline-flex items-center gap-2"><Store className="w-4 h-4" />Become a Vendor</Link>
        </div>
      </div>
    </div>
  )
}

