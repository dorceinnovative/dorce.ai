'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { ShieldCheck, Fingerprint, ScanFace, CheckCircle } from 'lucide-react'

export default function NinEnrollPage() {
  const { isAuthenticated, user } = useAuth()
  const [nin, setNin] = useState('')
  const [slipTemplate, setSlipTemplate] = useState<'classic' | 'premium' | 'executive' | 'quantum'>('premium')
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [slipResult, setSlipResult] = useState<any>(null)
  const [cardResult, setCardResult] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [enrollId, setEnrollId] = useState<string>('')
  const [form, setForm] = useState<any>({ firstName: '', lastName: '', dob: '', phone: '' })
  const [biometrics, setBiometrics] = useState<any>({ type: 'face', data: '' })
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEnrollment = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.post<{ id?: string; enrollId?: string; data?: { id?: string } }>(
        '/api/nin-enrollment/create',
        form
      )
      const created: any = data as any
      setEnrollId(String(created?.id ?? created?.enrollId ?? created?.data?.id ?? ''))
      setStep(2)
    } catch (e: any) {
      setError(e?.message || 'Enrollment creation failed')
    } finally { setLoading(false) }
  }

  const submitBiometrics = async () => {
    if (!enrollId) return
    setLoading(true); setError(null)
    try {
      await api.post(`/api/nin-enrollment/${enrollId}/biometrics`, biometrics)
      setStep(3)
    } catch (e: any) {
      setError(e?.message || 'Biometrics submission failed')
    } finally { setLoading(false) }
  }

  const completeEnrollment = async () => {
    if (!enrollId) return
    setLoading(true); setError(null)
    try {
      await api.put(`/api/nin-enrollment/${enrollId}/complete`, {})
      await checkStatus()
    } catch (e: any) {
      setError(e?.message || 'Completion failed')
    } finally { setLoading(false) }
  }

  const checkStatus = async () => {
    if (!enrollId) return
    setLoading(true); setError(null)
    try {
      const { data } = await api.get(`/api/nin-enrollment/${enrollId}/status`)
      setStatus(data)
      setStep(4)
    } catch (e: any) {
      setError(e?.message || 'Status check failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-green-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-green-300 text-sm font-medium">Agent‑led NIN enrollment</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">NIN Enrollment</h1>
          <p className="text-gray-300 mt-2">Create, capture biometrics, and complete your enrollment in minutes.</p>
        </div>

        {!isAuthenticated && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 mb-6">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">Sign in to access NIN services</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">Sign In</a>
          </div>
        )}

        <Card className="border-green-500/30 bg-black/40">
          <CardHeader className="border-b border-green-500/20">
            <CardTitle className="text-xl">Enrollment Steps</CardTitle>
            <CardDescription>Follow the guided, secure process</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-blue-300 text-sm">Step 1: Create Enrollment</div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                <Input placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                <Input placeholder="DOB (YYYY-MM-DD)" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Button onClick={createEnrollment} disabled={loading} className="bg-green-600 hover:bg-green-700">{loading ? 'Creating…' : 'Create Enrollment'}</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-blue-300 text-sm">Step 2: Submit Biometrics</div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={biometrics.type} onValueChange={(v) => setBiometrics({ ...biometrics, type: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Biometric type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="face">Face</SelectItem>
                    <SelectItem value="fingerprint">Fingerprint</SelectItem>
                    <SelectItem value="iris">Iris</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Biometric Data (base64)" value={biometrics.data} onChange={(e) => setBiometrics({ ...biometrics, data: e.target.value })} />
              </div>
              <Button onClick={submitBiometrics} disabled={loading} className="bg-purple-600 hover:bg-purple-700">{loading ? 'Submitting…' : 'Submit Biometrics'}</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-blue-300 text-sm">Step 3: Complete Enrollment</div>
              <div className="flex gap-3">
                <Button onClick={completeEnrollment} disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading ? 'Completing…' : 'Complete Enrollment'}</Button>
                <Button onClick={checkStatus} disabled={loading} variant="outline">Check Status</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-blue-300 text-sm">Status</div>
              <pre className="text-blue-200 text-sm overflow-auto">{JSON.stringify(status, null, 2)}</pre>
            </div>
          )}
          </CardContent>
          <CardFooter className="justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Secure processing • Agent verification</span>
            </div>
            <div className="text-xs text-gray-500">Enrollment ID: {enrollId || 'pending'}</div>
          </CardFooter>
        </Card>
        {isAuthenticated && (
          <Card className="mt-6 border-green-500/30 bg-black/40">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="text-xl">Quick NIN Services</CardTitle>
              <CardDescription>Verify NIN, generate premium slip, or request plastic card</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-blue-300">NIN</label>
                <Input value={nin} onChange={(e) => setNin(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button disabled={loading || !nin} onClick={async () => {
                  setLoading(true); setError(null)
                  try {
                    const { data } = await api.post('/api/nin/verify', { nin, userId: user?.id })
                    setVerifyResult(data)
                  } catch (e: any) { setError(e?.message || 'Verification failed') } finally { setLoading(false) }
                }}>Verify NIN</Button>
                <Select value={slipTemplate} onValueChange={(v) => setSlipTemplate(v as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Slip template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="quantum">Quantum</SelectItem>
                  </SelectContent>
                </Select>
                <Button disabled={loading || !nin} onClick={async () => {
                  setLoading(true); setError(null)
                  try {
                    const { data } = await api.post('/api/nin/generate-premium-slip', { nin, userId: user?.id, templateType: slipTemplate })
                    setSlipResult(data)
                  } catch (e: any) { setError(e?.message || 'Slip generation failed') } finally { setLoading(false) }
                }}>Generate Premium Slip</Button>
                <Button disabled={loading || !nin} onClick={async () => {
                  setLoading(true); setError(null)
                  try {
                    const { data } = await api.post('/api/nin/request-plastic-card', { nin, userId: user?.id, deliveryMethod: 'pickup', pickupLocation: 'Lagos HQ' })
                    setCardResult(data)
                  } catch (e: any) { setError(e?.message || 'Card request failed') } finally { setLoading(false) }
                }}>Request Plastic Card</Button>
              </div>
              {verifyResult && (
                <div className="rounded-lg border border-green-500/20 p-4">
                  <div className="text-sm text-blue-300 mb-2">Verification Result</div>
                  <pre className="text-blue-200 text-xs overflow-auto">{JSON.stringify(verifyResult, null, 2)}</pre>
                </div>
              )}
              {slipResult && (
                <div className="rounded-lg border border-green-500/20 p-4">
                  <div className="text-sm text-blue-300 mb-2">Premium Slip</div>
                  <pre className="text-blue-200 text-xs overflow-auto">{JSON.stringify(slipResult, null, 2)}</pre>
                </div>
              )}
              {cardResult && (
                <div className="rounded-lg border border-green-500/20 p-4">
                  <div className="text-sm text-blue-300 mb-2">Card Request</div>
                  <pre className="text-blue-200 text-xs overflow-auto">{JSON.stringify(cardResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {error && <div className="text-red-400 mt-4">{error}</div>}
      </div>
    </div>
  )
}
