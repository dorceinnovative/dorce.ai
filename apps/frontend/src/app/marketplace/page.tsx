"use client"
import React from 'react'
import { SubscriptionMarketplace } from '@/components/subscription/subscription-marketplace'

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-orange-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-orange-300 text-sm font-medium">Subscriptions Marketplace</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Marketplace</h1>
          <p className="text-gray-300 mt-2">Discover and manage subscriptions tailored for you.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
          <SubscriptionMarketplace />
        </div>
      </div>
    </div>
  )
}
