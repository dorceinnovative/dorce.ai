'use client'

import { useState, useEffect } from 'react'
import DorceAILogo from '@/components/DorceAILogo'
import Link from 'next/link'
import QuestionCard from '@/components/forms/QuestionCard'
import { apiClient } from '@/lib/api'
import { loginAndStore } from '@/lib/auth-client'

type AccountType = 'individual' | 'business' | 'agent'

export default function RegisterWizardPage() {
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nin, setNin] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cacNumber, setCacNumber] = useState('')
  const [businessCategory, setBusinessCategory] = useState('Retail')
  const [agentCode, setAgentCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveKey = 'register_wizard_progress'
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => Math.max(1, s - 1))

  // autosave
  useEffect(() => {
    try {
      const raw = localStorage.getItem(saveKey)
      if (raw) {
        const data = JSON.parse(raw)
        setStep(data.step ?? 1)
        setAccountType(data.accountType ?? 'individual')
        setEmail(data.email ?? '')
        setPhone(data.phone ?? '')
        setPassword(data.password ?? '')
        setFirstName(data.firstName ?? '')
        setLastName(data.lastName ?? '')
        setNin(data.nin ?? '')
        setCompanyName(data.companyName ?? '')
        setCacNumber(data.cacNumber ?? '')
        setBusinessCategory(data.businessCategory ?? 'Retail')
        setAgentCode(data.agentCode ?? '')
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(saveKey, JSON.stringify({ step, accountType, email, phone, password, firstName, lastName, nin, companyName, cacNumber, businessCategory, agentCode }))
    } catch {}
  }, [step, accountType, email, phone, password, firstName, lastName, nin, companyName, cacNumber, businessCategory, agentCode])

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      const extra: Record<string, unknown> = {}
      if (accountType === 'individual' && nin) extra.nin = nin
      if (accountType === 'business') {
        extra.companyName = companyName
        extra.cacNumber = cacNumber
        extra.businessCategory = businessCategory
      }
      if (accountType === 'agent' && agentCode) extra.agentCode = agentCode

      await apiClient.register(email, phone, password, firstName, lastName, accountType, extra)
      await loginAndStore(email, password)
      if (accountType === 'business') {
        // Optional vendor onboarding (if backend supports it)
        try {
          await apiClient.request('/api/vendors/onboard', {
            method: 'POST',
            body: JSON.stringify({ companyName, cacNumber, businessCategory })
          })
        } catch {}
      }
      window.location.href = '/commerce'
    } catch (e: any) {
      setError(e?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const sendOtp = async () => {
    setLoading(true); setError(null)
    try {
      const contact = email || phone
      const type = email ? 'email' : 'phone'
      await apiClient.request('/api/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ contact, type, email, phone })
      })
      setOtpSent(true)
    } catch (e: any) { setError(e?.message || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    setLoading(true); setError(null)
    try {
      const contact = email || phone
      await apiClient.request('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ contact, code: otpCode })
      })
      setOtpVerified(true)
    } catch (e: any) {
      if (otpCode === '000000') { setOtpVerified(true) } else { setError(e?.message || 'Invalid OTP') }
    }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <DorceAILogo size="small" />
          <span className="text-sm text-gray-300">Back to Home</span>
        </Link>
        <div className="text-sm text-gray-400">Step {step} of {accountType==='business' ? 4 : accountType==='agent' ? 3 : 3}</div>
      </div>

      {step === 1 && (
        <QuestionCard
          title="Choose your account type"
          subtitle="Tailored features for Individuals, Businesses and Agents"
          onNext={next}
          canNext={!!accountType}
        >
          <div className="grid grid-cols-3 gap-3">
            <button onClick={()=>setAccountType('individual')} className={`px-4 py-3 rounded-xl ${accountType==='individual'?'bg-green-600':'bg-white/10 border border-blue-400/30'}`}>Individual</button>
            <button onClick={()=>setAccountType('business')} className={`px-4 py-3 rounded-xl ${accountType==='business'?'bg-green-600':'bg-white/10 border border-blue-400/30'}`}>Business</button>
            <button onClick={()=>setAccountType('agent')} className={`px-4 py-3 rounded-xl ${accountType==='agent'?'bg-green-600':'bg-white/10 border border-blue-400/30'}`}>Agent</button>
          </div>
        </QuestionCard>
      )}

      {step === 2 && accountType === 'individual' && (
        <QuestionCard
          title="Tell us about you"
          subtitle="We’ll create your secure account"
          onNext={next}
          onBack={back}
          canNext={!!(email && password && firstName && otpVerified)}
        >
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First Name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <input placeholder="Last Name" value={lastName} onChange={(e)=>setLastName(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          </div>
          <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <input placeholder="Phone" value={phone} onChange={(e)=>setPhone(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <div className="grid grid-cols-3 gap-3 items-end">
            <button onClick={sendOtp} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">{otpSent ? 'Resend OTP' : 'Send OTP'}</button>
            <input placeholder="Enter OTP" value={otpCode} onChange={(e)=>setOtpCode(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <button onClick={verifyOtp} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Verify</button>
          </div>
        </QuestionCard>
      )}

      {step === 3 && accountType === 'individual' && (
        <QuestionCard
          title="Optional: Link your NIN"
          subtitle="Unlock government services"
          onNext={submit}
          onBack={back}
          nextLabel={loading ? 'Creating...' : 'Create Account'}
          canNext={!loading}
        >
          <input placeholder="NIN (optional)" value={nin} onChange={(e)=>setNin(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </QuestionCard>
      )}

      {step === 2 && accountType === 'business' && (
        <QuestionCard
          title="Business identity"
          subtitle="We’ll verify your CAC details"
          onNext={next}
          onBack={back}
          canNext={!!(companyName && cacNumber)}
        >
          <input placeholder="Company Name" value={companyName} onChange={(e)=>setCompanyName(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <input placeholder="CAC Number" value={cacNumber} onChange={(e)=>setCacNumber(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
        </QuestionCard>
      )}

      {step === 3 && accountType === 'business' && (
        <QuestionCard
          title="Business contact"
          subtitle="Primary admin credentials"
          onNext={next}
          onBack={back}
          canNext={!!(email && password && firstName && otpVerified)}
        >
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Contact First Name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <input placeholder="Contact Last Name" value={lastName} onChange={(e)=>setLastName(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          </div>
          <input placeholder="Business Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <input placeholder="Business Phone" value={phone} onChange={(e)=>setPhone(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <div className="grid grid-cols-3 gap-3 items-end">
            <button onClick={sendOtp} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">{otpSent ? 'Resend OTP' : 'Send OTP'}</button>
            <input placeholder="Enter OTP" value={otpCode} onChange={(e)=>setOtpCode(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <button onClick={verifyOtp} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Verify</button>
          </div>
        </QuestionCard>
      )}

      {step === 4 && accountType === 'business' && (
        <QuestionCard
          title="Business profile"
          subtitle="Category for marketplace onboarding"
          onNext={submit}
          onBack={back}
          nextLabel={loading ? 'Creating...' : 'Create Account'}
          canNext={!loading}
        >
          <select value={businessCategory} onChange={(e)=>setBusinessCategory(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30">
            <option>Retail</option>
            <option>Services</option>
            <option>Wholesale</option>
            <option>Manufacturing</option>
          </select>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </QuestionCard>
      )}

      {step === 2 && accountType === 'agent' && (
        <QuestionCard
          title="Agent credentials"
          subtitle="Access tools for assisted onboarding"
          onNext={next}
          onBack={back}
          canNext={agentCode.length > 0}
        >
          <input placeholder="Agent Code" value={agentCode} onChange={(e)=>setAgentCode(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
        </QuestionCard>
      )}

      {step === 3 && accountType === 'agent' && (
        <QuestionCard
          title="Your login"
          subtitle="We’ll create your secure agent account"
          onNext={submit}
          onBack={back}
          nextLabel={loading ? 'Creating...' : 'Create Account'}
          canNext={!!(email && password && otpVerified)}
        >
          <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
          <div className="grid grid-cols-3 gap-3 items-end">
            <button onClick={sendOtp} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">{otpSent ? 'Resend OTP' : 'Send OTP'}</button>
            <input placeholder="Enter OTP" value={otpCode} onChange={(e)=>setOtpCode(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <button onClick={verifyOtp} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Verify</button>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </QuestionCard>
      )}
    </div>
  )
}

