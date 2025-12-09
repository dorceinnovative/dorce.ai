import React from 'react'
import DorceAILogo from '@/components/DorceAILogo'

export default function EnvatoBlend({ imageUrl, rotation }: { imageUrl?: string; rotation: number }) {
  return (
    <div className="absolute inset-0">
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Envato visual"
          className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-soft-light"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <DorceAILogo size="large" className="w-32 h-32" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-white/20" style={{ transform: `rotate(${rotation}deg)` }} />
      </div>
    </div>
  )
}

