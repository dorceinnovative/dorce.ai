"use client"
import React from 'react'

export default function LoansPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-purple-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-purple-300 text-sm font-medium">Credit Services</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Loans</h1>
          <p className="text-gray-300 mt-2">Apply, track status, and manage repayments in one place.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30">
          <p className="text-gray-300">This section will offer loan products and application tracking.</p>
        </div>
      </div>
    </div>
  )
}
