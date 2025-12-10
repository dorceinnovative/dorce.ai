'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppleHero from '@/components/AppleHero'
import FeatureCards from '@/components/FeatureCards'
import ServiceMap from '@/components/ServiceMap'
import { motion } from 'framer-motion'

interface Service {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'maintenance'
  metadata: {
    icon: string
    category: string
    color: string
  }
  position_x: number
  position_y: number
}

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showServiceMap, setShowServiceMap] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Fetch services from API
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      } else {
        // Fallback to mock data if API is not available
        setServices(getMockServices())
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      setServices(getMockServices())
    } finally {
      setLoading(false)
    }
  }

  const getMockServices = (): Service[] => [
    {
      id: '1',
      name: 'Transfer & Payments',
      description: 'Send money instantly, pay bills, and manage your finances',
      status: 'active',
      metadata: { icon: 'credit-card', category: 'finance', color: '#007AFF' },
      position_x: 100,
      position_y: 200
    },
    {
      id: '2',
      name: 'Business Registration',
      description: 'Register your business with CAC, get TIN and corporate documents',
      status: 'active',
      metadata: { icon: 'briefcase', category: 'business', color: '#34C759' },
      position_x: 300,
      position_y: 150
    },
    {
      id: '3',
      name: 'Vendor Onboarding',
      description: 'Join our marketplace as a verified vendor and start selling',
      status: 'active',
      metadata: { icon: 'store', category: 'commerce', color: '#FF9500' },
      position_x: 500,
      position_y: 250
    },
    {
      id: '4',
      name: 'Store Link Creation',
      description: 'Create custom store links for your products and services',
      status: 'active',
      metadata: { icon: 'link', category: 'commerce', color: '#AF52DE' },
      position_x: 200,
      position_y: 350
    },
    {
      id: '5',
      name: 'Digital Subscriptions',
      description: 'Subscribe to digital services and manage recurring payments',
      status: 'active',
      metadata: { icon: 'refresh-cw', category: 'digital', color: '#FF3B30' },
      position_x: 400,
      position_y: 100
    },
    {
      id: '6',
      name: 'NIN Registration',
      description: 'Register for National Identity Number and get your digital ID',
      status: 'active',
      metadata: { icon: 'id-card', category: 'identity', color: '#5856D6' },
      position_x: 150,
      position_y: 300
    },
    {
      id: '7',
      name: 'Premium Card Printing',
      description: 'Order premium business cards and ID cards with fast delivery',
      status: 'active',
      metadata: { icon: 'credit-card', category: 'printing', color: '#FF2D92' },
      position_x: 350,
      position_y: 200
    },
    {
      id: '8',
      name: 'TIN Registration',
      description: 'Get Tax Identification Number for individuals and corporations',
      status: 'active',
      metadata: { icon: 'file-text', category: 'tax', color: '#30D158' },
      position_x: 450,
      position_y: 320
    }
  ]

  const handleServiceClick = (service: Service) => {
    router.push(service.metadata.category === 'finance' ? '/wallet' : 
                service.metadata.category === 'business' ? '/cac-registration' :
                service.metadata.category === 'commerce' ? '/vendor' :
                service.metadata.category === 'digital' ? '/subscriptions' :
                service.metadata.category === 'identity' ? '/nin' :
                service.metadata.category === 'printing' ? '/cards' :
                service.metadata.category === 'tax' ? '/tin' : '/services')
  }

  const handleDemoClick = () => {
    setShowServiceMap(true)
    // Scroll to service map section
    setTimeout(() => {
      document.getElementById('service-map-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <AppleHero onDemoClick={handleDemoClick} />
      
      {/* Service Map Section */}
      <section id="service-map-section" className="py-20 bg-gradient-to-br from-black via-gray-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Interactive Service Map
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Explore our interconnected services and discover how they work together to serve your needs
            </p>
          </motion.div>
          
          {loading ? (
            <div className="flex justify-center items-center h-[600px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <ServiceMap 
              services={services} 
              onServiceClick={handleServiceClick}
              className="mx-auto"
            />
          )}
        </div>
      </section>
      
      {/* Feature Cards */}
      <FeatureCards />
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of Nigerians who are already using Dorce to grow their businesses and serve their communities
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/register/wizard')}
                className="bg-white text-black px-8 py-4 rounded-2xl text-lg font-semibold transition-all transform hover:scale-105 hover:bg-gray-100"
              >
                Get Started Free
              </button>
              <button
                onClick={() => router.push('/login')}
                className="border-2 border-white text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all hover:bg-white hover:text-black"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}