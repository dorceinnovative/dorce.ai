'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

export default function NinCardPage() {
  const [orderId, setOrderId] = useState('')
  const [payload, setPayload] = useState({ type: 'premium', nameOnCard: '', deliveryAddress: '' })
  const [slipUrl, setSlipUrl] = useState('')
  const [method, setMethod] = useState('wallet')
  const [ref, setRef] = useState('')
  const [pricing, setPricing] = useState<any>(null)
  const [details, setDetails] = useState<any>(null)
  const [track, setTrack] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      try { setPricing(await apiClient.ninCardPricing()) } catch {}
    }
    run()
  }, [])

  const createOrder = async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient.ninCardCreateOrder(payload as any)
      setOrderId(String(res?.id || res?.orderId || res?.data?.id || ''))
    } catch (e: any) { setError(e?.message || 'Create order failed') }
    finally { setLoading(false) }
  }

  const uploadSlip = async () => {
    setLoading(true); setError(null)
    try { await apiClient.ninCardUploadSlip(orderId, slipUrl) } catch (e: any) { setError(e?.message || 'Upload slip failed') } finally { setLoading(false) }
  }

  const pay = async () => {
    setLoading(true); setError(null)
    try { await apiClient.ninCardPay(orderId, method); setDetails(await apiClient.ninCardOrderDetails(orderId)) } catch (e: any) { setError(e?.message || 'Payment failed') } finally { setLoading(false) }
  }

  const verifyPayment = async () => {
    setLoading(true); setError(null)
    try { await apiClient.ninCardVerifyPayment(orderId, ref); setDetails(await apiClient.ninCardOrderDetails(orderId)) } catch (e: any) { setError(e?.message || 'Verify payment failed') } finally { setLoading(false) }
  }

  const trackOrder = async () => {
    setLoading(true); setError(null)
    try { setTrack(await apiClient.ninCardTrack(orderId)) } catch (e: any) { setError(e?.message || 'Track failed') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-green-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-green-300 text-sm font-medium">Premium Slip & Plastic Card</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">NIN Card Ordering</h1>
          <p className="text-gray-300 mt-2">Create orders, upload payment slips, and track deliveries.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <select value={payload.type} onChange={(e) => setPayload({ ...payload, type: e.target.value })} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30">
              <option value="premium">Premium Slip</option>
              <option value="plastic">Plastic Card</option>
            </select>
            <input placeholder="Name on Card" value={payload.nameOnCard} onChange={(e) => setPayload({ ...payload, nameOnCard: e.target.value })} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <input placeholder="Delivery Address" value={payload.deliveryAddress} onChange={(e) => setPayload({ ...payload, deliveryAddress: e.target.value })} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30 col-span-2" />
          </div>
          <button onClick={createOrder} disabled={loading} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">Create Order</button>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Payment Slip URL" value={slipUrl} onChange={(e) => setSlipUrl(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <button onClick={uploadSlip} disabled={!orderId || loading} className="px-4 py-2 rounded-lg bg-white/10 border border-blue-400/30 hover:bg-white/20 transition-colors disabled:opacity-50">Upload Slip</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30">
              <option value="wallet">Wallet</option>
              <option value="paystack">Paystack</option>
              <option value="flutterwave">Flutterwave</option>
            </select>
            <button onClick={pay} disabled={!orderId || loading} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50">Pay</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Payment Ref" value={ref} onChange={(e) => setRef(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <button onClick={verifyPayment} disabled={!orderId || loading} className="px-4 py-2 rounded-lg bg-white/10 border border-blue-400/30 hover:bg-white/20 transition-colors disabled:opacity-50">Verify Payment</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="px-4 py-2 rounded-lg bg-black/40 border border-blue-400/30" />
            <button onClick={trackOrder} disabled={!orderId || loading} className="px-4 py-2 rounded-lg bg-white/10 border border-blue-400/30 hover:bg-white/20 transition-colors disabled:opacity-50">Track</button>
          </div>
        </div>
        {error && <div className="text-red-400 mt-4">{error}</div>}
        {pricing && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 mt-4">
            <h2 className="text-xl font-semibold mb-2">Pricing</h2>
            <pre className="text-blue-200 text-sm overflow-auto">{JSON.stringify(pricing, null, 2)}</pre>
          </div>
        )}
        {details && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 mt-4">
            <h2 className="text-xl font-semibold mb-2">Order Details</h2>
            <pre className="text-blue-200 text-sm overflow-auto">{JSON.stringify(details, null, 2)}</pre>
          </div>
        )}
        {track && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 mt-4">
            <h2 className="text-xl font-semibold mb-2">Tracking</h2>
            <pre className="text-blue-200 text-sm overflow-auto">{JSON.stringify(track, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
