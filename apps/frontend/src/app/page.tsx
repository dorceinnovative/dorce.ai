// Dorce.ai - Apple-Style Landing Page
'use client'

import dynamic from 'next/dynamic'

const AppleStyleLanding = dynamic(
  () => import('@/pages/AppleStyleLanding').then(mod => mod.default),
  { ssr: false }
)

export default function Home() {
  return <AppleStyleLanding />
}
