'use client'

import { motion } from 'framer-motion'
import { CreditCard, Briefcase, Store, Link, RefreshCw, IdCard, FileText, Smartphone } from 'lucide-react'
import Link from 'next/link'

interface FeatureCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  link: string
  category: string
}

const features: FeatureCard[] = [
  {
    id: '1',
    title: 'Transfer & Payments',
    description: 'Send money instantly, pay bills, and manage your finances securely',
    icon: <CreditCard className="w-8 h-8" />,
    color: 'bg-blue-600',
    link: '/wallet',
    category: 'finance'
  },
  {
    id: '2',
    title: 'Business Registration',
    description: 'Register your business with CAC, get TIN and corporate documents',
    icon: <Briefcase className="w-8 h-8" />,
    color: 'bg-green-600',
    link: '/cac-registration',
    category: 'business'
  },
  {
    id: '3',
    title: 'Vendor Onboarding',
    description: 'Join our marketplace as a verified vendor and start selling',
    icon: <Store className="w-8 h-8" />,
    color: 'bg-orange-600',
    link: '/vendor',
    category: 'commerce'
  },
  {
    id: '4',
    title: 'Store Link Creation',
    description: 'Create custom store links for your products and services',
    icon: <Link className="w-8 h-8" />,
    color: 'bg-purple-600',
    link: '/store',
    category: 'commerce'
  },
  {
    id: '5',
    title: 'Digital Subscriptions',
    description: 'Subscribe to digital services and manage recurring payments',
    icon: <RefreshCw className="w-8 h-8" />,
    color: 'bg-red-600',
    link: '/subscriptions',
    category: 'digital'
  },
  {
    id: '6',
    title: 'NIN Registration',
    description: 'Register for National Identity Number and get your digital ID',
    icon: <IdCard className="w-8 h-8" />,
    color: 'bg-indigo-600',
    link: '/nin',
    category: 'identity'
  },
  {
    id: '7',
    title: 'Premium Card Printing',
    description: 'Order premium business cards and ID cards with fast delivery',
    icon: <CreditCard className="w-8 h-8" />,
    color: 'bg-pink-600',
    link: '/cards',
    category: 'printing'
  },
  {
    id: '8',
    title: 'TIN Registration',
    description: 'Get Tax Identification Number for individuals and corporations',
    icon: <FileText className="w-8 h-8" />,
    color: 'bg-teal-600',
    link: '/tin',
    category: 'tax'
  }
]

interface FeatureCardProps {
  feature: FeatureCard
  index: number
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      className="group relative bg-white bg-opacity-5 backdrop-blur-md rounded-2xl p-6 border border-gray-800 hover:border-gray-600 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-900 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      
      {/* Icon container */}
      <motion.div 
        className={`${feature.color} rounded-xl p-3 mb-4 inline-flex group-hover:scale-110 transition-transform duration-300`}
        whileHover={{ rotate: 10 }}
      >
        <div className="text-white">
          {feature.icon}
        </div>
      </motion.div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
        {feature.title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 group-hover:text-gray-300 transition-colors duration-300">
        {feature.description}
      </p>
      
      {/* Category badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {feature.category}
        </span>
        
        {/* Arrow indicator */}
        <motion.div
          className="text-blue-400"
          whileHover={{ x: 5 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.div>
      </div>
      
      {/* Link overlay */}
      <Link 
        href={feature.link}
        className="absolute inset-0 z-10"
        aria-label={`Learn more about ${feature.title}`}
      />
    </motion.div>
  )
}

interface FeatureCardsProps {
  className?: string
}

export default function FeatureCards({ className = '' }: FeatureCardsProps) {
  return (
    <section className={`py-20 bg-black ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover our comprehensive suite of services designed for individuals, businesses, and agents across Nigeria
          </p>
        </motion.div>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
        
        {/* CTA Section */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="text-gray-400 mb-6">
            Ready to get started? Join thousands of Nigerians already using Dorce
          </p>
          <Link 
            href="/register/wizard"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            Create Account
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}