'use client'

import { useState } from 'react'
import { loginAndStore } from '@/lib/auth-client'
import { apiClient } from '@/lib/api'
import DorceAILogo from '@/components/DorceAILogo'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [accountType, setAccountType] = useState<'individual' | 'business' | 'agent'>('individual')
  const [companyName, setCompanyName] = useState('')
  const [cacNumber, setCacNumber] = useState('')
  const [agentCode, setAgentCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const extra = accountType === 'business' ? { companyName, cacNumber } : accountType === 'agent' ? { agentCode } : {}
      await apiClient.register(email, phone, password, firstName, lastName, accountType, extra)
      await loginAndStore(email, password)
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <DorceAILogo size="small" />
          <span className="text-sm text-gray-300">Back to Home</span>
        </Link>
      </div>
      <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-blue-400/30">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Create account</h1>
        <p className="text-gray-300 mb-6">Join the AI‑powered platform for Individuals, Businesses, and Agents</p>
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setAccountType('individual')} className={`px-3 py-2 rounded-lg ${accountType==='individual'?'bg-green-600':'bg-white/10 border border-blue-400/30'}`}>Individual</button>
            <button type="button" onClick={() => setAccountType('business')} className={`px-3 py-2 rounded-lg ${accountType==='business'?'bg-green-600':'bg-white/10 border border-blue-400/30'}`}>Business</button>
            <button type="button" onClick={() => setAccountType('agent')} className={`px-3 py-2 rounded-lg ${accountType==='agent'?'bg-green-600':'bg-white/10 border border-blue-400/30'}`}>Agent</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Choose account type to unlock tailored features and services.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-blue-300 mb-2">First Name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            </div>
            <div>
              <label className="block text-sm text-blue-300 mb-2">Last Name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-blue-300 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" required />
          </div>
          <div>
            <label className="block text-sm text-blue-300 mb-2">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          </div>
          <div>
            <label className="block text-sm text-blue-300 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" required />
          </div>
          {accountType==='business' && (
            <div>
              <label className="block text-sm text-blue-300 mb-2">Company Name</label>
              <input value={companyName} onChange={(e)=>setCompanyName(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            </div>
          )}
          {accountType==='business' && (
            <div>
              <label className="block text-sm text-blue-300 mb-2">CAC Number</label>
              <input value={cacNumber} onChange={(e)=>setCacNumber(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            </div>
          )}
          {accountType==='agent' && (
            <div>
              <label className="block text-sm text-blue-300 mb-2">Agent Code</label>
              <input value={agentCode} onChange={(e)=>setAgentCode(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            </div>
          )}
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">{loading ? 'Creating account...' : 'Create Account'}</button>
        </form>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              const base = process.env.NEXT_PUBLIC_API_URL || ''
              if (base) window.location.href = `${base}/api/auth/google`
            }}
            className="w-full py-3 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors"
          >
            Continue with Google
          </button>
        </div>
        <div className="mt-4 text-sm text-blue-300">
          Already have an account? <a href="/login" className="text-blue-400">Sign in</a>
        </div>
      </div>
    </div>
  )
}
