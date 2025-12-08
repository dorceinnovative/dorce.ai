'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { getAuthTokens } from '@/lib/auth-client'

export default function NINPage() {
  const [nin, setNin] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    setAuthenticated(!!getAuthTokens())
  }, [])

  const verifyNIN = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.post('/api/nin/verify', { nin })
      setResult(data)
    } catch (err: any) {
      setError(err?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.get(`/api/nin/verification-status/${nin}`)
      setResult(data)
    } catch (err: any) {
      setError(err?.message || 'Status check failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-green-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-green-300 text-sm font-medium">Identity Services</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">NIN Services</h1>
          <p className="text-gray-300 mt-2">Verify, enroll, order cards, and track status.</p>
        </div>
        {!authenticated && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 text-yellow-300">
            Please <a href="/login" className="underline">sign in</a> to access protected NIN services.
          </div>
        )}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
          <label className="block text-sm text-blue-300 mb-2">Enter NIN</label>
          <input
            type="text"
            value={nin}
            onChange={(e) => setNin(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30 focus:outline-none focus:border-blue-400"
            placeholder="12345678901"
          />
          <div className="flex gap-3 mt-4">
            <button
              disabled={!authenticated || loading || nin.length < 8}
              onClick={verifyNIN}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify NIN'}
            </button>
            <button
              disabled={!authenticated || loading || nin.length < 8}
              onClick={checkStatus}
              className="px-4 py-2 rounded-lg bg-white/10 border border-blue-400/30 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Check Status
            </button>
            <a href="/nin/enroll" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors">Enroll</a>
            <a href="/nin/card" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors">Order Card</a>
            <a href="/nin/verify" className="px-4 py-2 rounded-lg bg-white/10 border border-blue-400/30 hover:bg-white/20 transition-colors">Verification Platform</a>
          </div>
        </div>

        {error && <div className="mt-4 text-red-400">{error}</div>}
        {result && (
          <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
            <pre className="text-blue-200 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
