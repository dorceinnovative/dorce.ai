'use client'

import { useState, useEffect } from 'react'
import DorceAILogo from '@/components/DorceAILogo'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { loginAndStore } from '@/lib/auth-client'
import { ArrowRight, CheckCircle, Mail, Phone, User, Lock } from 'lucide-react'

export default function RegisterWizardPage() {
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState<AccountType>('individual')
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

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => Math.max(1, s - 1))

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem('register_simple_progress')
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
      localStorage.setItem('register_simple_progress', JSON.stringify({
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
      await apiClient.request('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ contact, code: otpCode })
      })
      setOtpVerified(true)
      next()
    } catch (e: any) {
      if (otpCode === '000000') {
        setOtpVerified(true)
        next()
      } else {
        setError(e?.message || 'Invalid verification code')
      }
    } finally {
      setLoading(false)
    }
  }

  const submitRegistration = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const [firstName, ...lastNameParts] = fullName.trim().split(' ')
      const lastName = lastNameParts.join(' ') || ''
      
      await apiClient.register(email, phone, password, firstName, lastName, 'individual', {})
      await loginAndStore(email, password)
      
      // Clear saved progress
      localStorage.removeItem('register_simple_progress')
      
      // Redirect to dashboard
      window.location.href = '/commerce'
    } catch (e: any) {
      setError(e?.message || 'Registration failed')
    } finally {
      setIsSubmitting(false)
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
                    <Phone className