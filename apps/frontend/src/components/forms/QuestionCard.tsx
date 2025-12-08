'use client'

import { ReactNode } from 'react'

export default function QuestionCard({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Next',
  backLabel = 'Back',
  canNext = true,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  backLabel?: string
  canNext?: boolean
}) {
  return (
    <div className="w-full max-w-xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-blue-400/30">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      {subtitle && <p className="text-sm text-gray-300 mb-6">{subtitle}</p>}
      <div className="space-y-4">{children}</div>
      <div className="flex items-center justify-between mt-6">
        <button
          disabled={!onBack}
          onClick={onBack}
          className={`px-4 py-2 rounded-lg ${onBack ? 'bg-white/10 border border-blue-400/30 hover:bg-white/20' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
        >
          {backLabel}
        </button>
        <button
          disabled={!canNext || !onNext}
          onClick={onNext}
          className={`px-4 py-2 rounded-lg ${canNext && onNext ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 opacity-50 cursor-not-allowed'} text-white`}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}

