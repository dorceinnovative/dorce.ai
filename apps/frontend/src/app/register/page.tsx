'use client'

import { useState, useEffect } from 'react'
import DorceAILogo from '@/components/DorceAILogo'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { loginAndStore } from '@/lib/auth-client'
import { ArrowRight, CheckCircle, Mail, Phone, User, Lock, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => Math.max(1, s - 1))

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem('register_progress')
      if (saved) {
        const data = JSON.parse(saved)
        setStep(data.step ?? 1)
        setEmail(data.email ?? '')
        setPhone(data.phone ?? '')
        setPassword(data.password ?? '')
        setFullName(data.fullName ?? '')
        setOtpVerified(data.otpVerified ?? false)
      }
    } catch {}
  }, [])

  // Save progress
  useEffect(() => {
    try {
      localStorage.setItem('register_progress', JSON.stringify({
        step, email, phone, password, fullName, otpVerified
      }))
    } catch {}
  }, [step, email, phone, password, fullName, otpVerified])

  const sendOtp = async () => {
    setLoading(true)
    setError(null)
    try {
      const contact = email || phone
      const type = email ? 'email' : 'phone'
      await apiClient.request('/api/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ contact, type, email, phone })
      })
      setOtpSent(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setLoading(true)
    setError(null)
    try {
      const contact = email || phone
      const tokens = await apiClient.request('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ contact, code: otpCode })
      })
      try { localStorage.setItem('auth_tokens', JSON.stringify(tokens)) } catch {}
      setOtpVerified(true)
      next()
    } catch (e: any) {
      setError(e?.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const submitRegistration = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Clear saved progress
      localStorage.removeItem('register_progress')
      // Redirect to main dashboard
      window.location.href = '/dashboard'
    } catch (e: any) {
      setError(e?.message || 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueFromStep1 = async () => {
    setLoading(true)
    setError(null)
    try {
      const [firstName, ...lastNameParts] = fullName.trim().split(' ')
      const lastName = lastNameParts.join(' ') || ''
      const tokens = await apiClient.register(email, phone, password, firstName, lastName, 'individual', {})
      try { localStorage.setItem('auth_tokens', JSON.stringify(tokens)) } catch {}
      // proactively send OTP to email
      await sendOtp()
      next()
    } catch (e: any) {
      // If user exists, try login and proceed to OTP
      try {
        await loginAndStore(email, password)
        await sendOtp()
        next()
      } catch (err: any) {
        setError(e?.message || err?.message || 'Unable to start registration')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background with Apple-style gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-10 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            >
              <div className="w-8 h-8 border border-green-400/60 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <DorceAILogo size="small" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Back to Home</span>
            </Link>
            <div className="text-sm text-gray-400">
              Step {step} of 3
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-md">
            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-12 space-x-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  num <= step ? 'bg-green-400' : 'bg-gray-600'
                }`} />
              ))}
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                    Create Your Account
                  </h1>
                  <p className="text-gray-300">Join millions of Nigerians on Dorce.ai</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:border-green-400 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:border-green-400 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:border-green-400 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:border-green-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleContinueFromStep1}
                  disabled={!fullName || !email || !phone || !password || loading}
                  className="w-full mt-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? 'Please wait...' : 'Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="mt-6 text-center text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-green-400 hover:text-green-300 transition-colors">
                    Sign in
                  </Link>
                </div>
              </div>
            )}

            {/* Step 2: Email Verification */}
            {step === 2 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <div className="text-center mb-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
                  <p className="text-gray-300 text-sm">
                    We sent a verification code to {email}
                  </p>
                </div>

                {!otpSent ? (
                  <div className="text-center">
                    <button
                      onClick={sendOtp}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-xl font-semibold transition-colors"
                    >
                      {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:border-green-400 transition-colors text-center text-lg tracking-widest"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={verifyOtp}
                      disabled={loading || otpCode.length !== 6}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
                    >
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <button
                      onClick={sendOtp}
                      disabled={loading}
                      className="w-full py-3 bg-transparent border border-white/20 hover:border-white/40 rounded-xl font-semibold transition-colors text-gray-300"
                    >
                      Resend Code
                    </button>
                  </div>
                )}

                <button
                  onClick={back}
                  className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Back
                </button>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Welcome to Dorce.ai!</h2>
                <p className="text-gray-300 mb-8">
                  Your account has been created successfully. Let's get you started.
                </p>

                <button
                  onClick={submitRegistration}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-xl font-semibold transition-colors"
                >
                  {isSubmitting ? 'Creating Account...' : 'Continue to Dashboard'}
                </button>

                {error && (
                  <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
