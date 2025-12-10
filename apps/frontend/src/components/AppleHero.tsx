'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import DorceAILogo from './DorceAILogo'

interface AppleHeroProps {
  onDemoClick?: () => void
}

export default function AppleHero({ onDemoClick }: AppleHeroProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  
  const rotatingTexts = [
    "One Platform. Infinite Possibilities.",
    "Your Nigeria. Any Device. Anywhere.",
    "Connecting 218 Million Citizens.",
    "Agent & Partner Network."
  ]

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % rotatingTexts.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-blue-900">
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-10 animate-pulse" 
             style={{ animationDuration: '4s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Logo */}
              <motion.div 
                className="flex justify-center mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <DorceAILogo size="large" />
              </motion.div>

              {/* Main headline */}
              <motion.h1 
                className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-green-200 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                DORCE
              </motion.h1>

              {/* Rotating subtext */}
              <motion.div 
                className="h-20 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTextIndex}
                    className="text-2xl md:text-3xl font-light text-gray-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {rotatingTexts[currentTextIndex]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* Description */}
              <motion.p 
                className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                Nigeria's Agent & Partner Network - Unifying 218 million citizens through technology. 
                Access government services, financial tools, and marketplace solutions in one secure platform.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <Link 
                  href="/register/wizard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                
                <button 
                  onClick={onDemoClick}
                  className="border border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all flex items-center gap-2 backdrop-blur-sm hover:bg-white hover:bg-opacity-10"
                >
                  View Demo
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1" />
                  </svg>
                </button>
              </motion.div>

              {/* Service badges */}
              <motion.div 
                className="flex flex-wrap justify-center gap-4 mt-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                {[
                  { icon: "💳", text: "Payments" },
                  { icon: "🏪", text: "Marketplace" },
                  { icon: "🆔", text: "Identity" },
                  { icon: "💼", text: "Business" },
                  { icon: "📱", text: "Mobile" },
                  { icon: "🔒", text: "Security" }
                ].map((badge, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-md rounded-full px-4 py-2 text-sm text-gray-300"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-gray-400"
        >
          <span className="text-sm">Explore Services</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}