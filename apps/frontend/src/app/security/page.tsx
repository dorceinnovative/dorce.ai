'use client'

import { Shield, Lock, Radar } from 'lucide-react'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-red-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <Shield className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-red-300 text-sm font-medium">Enterprise‑grade Protection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">Security</h1>
          <p className="text-gray-300 mt-2">Quantum encryption, zero‑trust architecture, and continuous monitoring.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-red-400/30">
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-3 inline-flex mb-4"><Lock className="w-5 h-5 text-white" /></div>
            <div className="text-lg font-semibold mb-1">AES‑256 Encryption</div>
            <div className="text-gray-300 text-sm">Military‑grade encryption for data and transactions.</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-red-400/30">
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-3 inline-flex mb-4"><Radar className="w-5 h-5 text-white" /></div>
            <div className="text-lg font-semibold mb-1">Fraud Detection</div>
            <div className="text-gray-300 text-sm">AI‑powered detection trained on African patterns.</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-red-400/30">
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-3 inline-flex mb-4"><Shield className="w-5 h-5 text-white" /></div>
            <div className="text-lg font-semibold mb-1">Zero‑Trust</div>
            <div className="text-gray-300 text-sm">Least privilege access across services and vendors.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

