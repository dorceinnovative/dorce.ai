'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Building2, User, ArrowRight } from 'lucide-react'

export default function TinRegistrationPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-indigo-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <BadgeCheck className="w-4 h-4 text-indigo-400 mr-2" />
            <span className="text-indigo-300 text-sm font-medium">Official TIN registration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">TIN Registration</h1>
          <p className="text-gray-300 mt-2">Get Tax Identification Numbers for individuals and registered businesses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/30">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-3 inline-flex mb-4"><User className="w-5 h-5 text-white" /></div>
            <div className="text-lg font-semibold mb-1">Individual TIN</div>
            <div className="text-gray-300 text-sm mb-4">Register a personal TIN for tax purposes.</div>
            <button
              disabled={loading}
              onClick={() => (window.location.href = '/tin/individual')}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600"
            >
              {loading ? 'Please wait...' : 'Start Individual TIN'}
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/30">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-3 inline-flex mb-4"><Building2 className="w-5 h-5 text-white" /></div>
            <div className="text-lg font-semibold mb-1">Corporate TIN</div>
            <div className="text-gray-300 text-sm mb-4">Register a TIN for your CAC‑registered business.</div>
            <button
              disabled={loading}
              onClick={() => (window.location.href = '/tin/corporate')}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600"
            >
              {loading ? 'Please wait...' : 'Start Corporate TIN'}
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-white">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
