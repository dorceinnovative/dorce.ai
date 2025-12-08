'use client'

import Link from 'next/link'

export default function AIPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-indigo-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-indigo-300 text-sm font-medium">Neural Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">AI & Neural</h1>
          <p className="text-gray-300 mt-2">Business insights, market research, and marketing content generation.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-indigo-400/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">AI Insights</div>
              <div className="text-gray-300 text-sm">Generate insights for industry, location, and products.</div>
            </div>
            <Link href="/ai/insights" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">Open</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

