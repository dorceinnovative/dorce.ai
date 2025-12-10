'use client'

import { useState } from 'react'
import { loginAndStore } from '@/lib/auth-client'
import DorceAILogo from '@/components/DorceAILogo'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await loginAndStore(email, password)
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err?.message || 'Login failed')
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
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-gray-300">Sign in to your Dorce.ai account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:border-green-400 transition-colors"
                    required
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
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    const base = process.env.NEXT_PUBLIC_API_URL || ''
                    if (base) window.location.href = `${base}/api/auth/google`
                  }}
                  className="w-full py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18c-.69 1.92-1.08 4.02-1.08 6.22s.39 4.3 1.08 6.22l2.85-2.22z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="mt-6 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-green-400 hover:text-green-300 transition-colors">
                  Create one
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
