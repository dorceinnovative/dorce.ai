'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import DorceAILogo from '@/components/DorceAILogo'
import Link from 'next/link'

export default function NinVerifyPage() {
  const [nin, setNin] = useState('')
  const [dob, setDob] = useState('')
  const [lastName, setLastName] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(false)

  const verify = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const { data } = await api.post('/api/nin/verify', { nin, dob, lastName })
      setResult(data)
    } catch (e: any) {
      setError(e?.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <DorceAILogo size="small" />
          <span className="text-sm text-gray-300">Back to Home</span>
        </Link>
        <div className="flex gap-3 text-sm">
          <Link href="/nin/enroll" className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700">Enroll</Link>
          <Link href="/nin/card" className="px-3 py-2 rounded-lg bg-white/10 border border-blue-400/30 hover:bg-white/20">Order Card</Link>
        </div>
      </div>
      <div className="w-full max-w-3xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-blue-400/30">
        <div className="mb-4">
          <div className="inline-flex items-center bg-blue-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-blue-300 text-sm font-medium">Secure Identity Verification</span>
          </div>
          <h1 className="text-4xl font-bold mt-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">NIN Verification</h1>
          <p className="text-gray-300 mt-2">Verify identity quickly and securely.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-blue-300 mb-2">NIN</label>
            <input value={nin} onChange={(e) => setNin(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" placeholder="12345678901" />
          </div>
          <div>
            <label className="block text-sm text-blue-300 mb-2">Date of Birth</label>
            <input value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <label className="block text-sm text-blue-300 mb-2">Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" placeholder="Surname" />
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-400 mt-4 mb-4">
          <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} />
          <span>I consent to verify my identity (NIN) for service access under NDPR.</span>
        </div>
        <button onClick={verify} disabled={loading || nin.length < 8 || !consent} className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">Verify</button>
        {error && <div className="text-red-400 mt-4">{error}</div>}
        {result && (
          <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
            <pre className="text-blue-200 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
