'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api'
import { X, IdCard, BadgeCheck, Building2, User, Camera, Upload, ArrowRight } from 'lucide-react'

type KycRole = 'individual' | 'business' | 'agent'

interface Props {
  open: boolean
  onClose: () => void
  onCompleted?: () => void
}

export default function KycModal({ open, onClose, onCompleted }: Props) {
  const [role, setRole] = useState<KycRole>('individual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [bvn, setBvn] = useState('')
  const [nin, setNin] = useState('')
  const [idType, setIdType] = useState('passport')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [corpName, setCorpName] = useState('')
  const [cacNumber, setCacNumber] = useState('')
  const [corpDocs, setCorpDocs] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [idPhoto, setIdPhoto] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open) {
      setRole('individual')
      setLoading(false)
      setError(null)
      setResult(null)
    }
  }, [open])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (e: any) {
      setError(e?.message || 'Camera access denied')
    }
  }

  const captureImage = (setter: (d: string)=>void) => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const data = canvas.toDataURL('image/png')
    setter(data)
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload: any = { role, bvn, nin, idType }
      if (selfie) payload.selfie = selfie
      if (idPhoto) payload.idPhoto = idPhoto
      if (role !== 'individual') {
        payload.corpName = corpName
        payload.cacNumber = cacNumber
      }
      const res = await apiClient.request('/api/kyc/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      setResult(res)
      if (onCompleted) onCompleted()
    } catch (err: any) {
      setError(err?.message || 'KYC submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-green-400" />
              <div className="font-semibold">Start Verification</div>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="px-6 pt-4">
            <div className="mb-4 flex gap-2">
              <button onClick={()=>setRole('individual')} className={`px-3 py-2 rounded-lg ${role==='individual'?'bg-green-600 text-white':'bg-white/10 text-gray-300 border border-white/20'}`}>Individual</button>
              <button onClick={()=>setRole('business')} className={`px-3 py-2 rounded-lg ${role==='business'?'bg-blue-600 text-white':'bg-white/10 text-gray-300 border border-white/20'}`}>Business</button>
              <button onClick={()=>setRole('agent')} className={`px-3 py-2 rounded-lg ${role==='agent'?'bg-indigo-600 text-white':'bg-white/10 text-gray-300 border border-white/20'}`}>Agent</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3"><User className="w-4 h-4 text-gray-300" /><div className="text-sm text-gray-300">Identity Basics</div></div>
                <input value={bvn} onChange={(e)=>setBvn(e.target.value)} placeholder="BVN (optional)" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white mb-2" />
                <input value={nin} onChange={(e)=>setNin(e.target.value)} placeholder="NIN (optional)" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white" />
                {role!=='individual' && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-gray-300" /><div className="text-sm text-gray-300">Corporate</div></div>
                    <input value={corpName} onChange={(e)=>setCorpName(e.target.value)} placeholder="Business Name" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white mb-2" />
                    <input value={cacNumber} onChange={(e)=>setCacNumber(e.target.value)} placeholder="CAC Number" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white" />
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3"><IdCard className="w-4 h-4 text-gray-300" /><div className="text-sm text-gray-300">Government ID</div></div>
                <select value={idType} onChange={(e)=>setIdType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white mb-2">
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver License</option>
                  <option value="voters_card">Voter Card</option>
                  <option value="nin_slip">NIN Slip</option>
                </select>
                <label className="block text-xs text-gray-400 mb-2">Upload ID Image</label>
                <input type="file" accept="image/*" onChange={(e)=>setIdFile(e.target.files?.[0]||null)} className="w-full text-sm text-gray-300" />
                <div className="mt-3 flex gap-2">
                  <button onClick={startCamera} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-gray-200 flex items-center gap-2"><Camera className="w-4 h-4" />Open Camera</button>
                  <button onClick={()=>captureImage(setIdPhoto)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-gray-200 flex items-center gap-2"><Upload className="w-4 h-4" />Capture ID</button>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3"><Camera className="w-4 h-4 text-gray-300" /><div className="text-sm text-gray-300">Selfie Capture</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <video ref={videoRef} className="w-full rounded-lg bg-black/40 border border-white/20" muted playsInline />
                  <div className="mt-2 flex gap-2">
                    <button onClick={startCamera} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-gray-200">Start Camera</button>
                    <button onClick={()=>captureImage(setSelfie)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-gray-200">Capture Selfie</button>
                  </div>
                </div>
                <div>
                  <canvas ref={canvasRef} className="w-full rounded-lg bg-black/40 border border-white/20" />
                  <div className="mt-2 text-xs text-gray-400">Preview</div>
                </div>
              </div>
            </div>

            {error && <div className="mt-3 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">{error}</div>}
            {result && <div className="mt-3 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-300 text-sm">Verification submitted</div>}

            <div className="flex items-center justify-end gap-2 py-4">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-gray-200">Cancel</button>
              <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                {loading ? 'Submitting...' : 'Submit'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

