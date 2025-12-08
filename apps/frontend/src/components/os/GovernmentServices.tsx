import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, User, CreditCard, Globe, FileText, Camera, Fingerprint, Eye, CheckCircle, AlertCircle, Clock, X } from 'lucide-react'

interface CitizenProfile {
  nin: string
  fullName: string
  dateOfBirth: string
  gender: 'Male' | 'Female'
  nationality: string
  stateOfOrigin: string
  lga: string
  phoneNumber: string
  email: string
  address: string
  photo: string
  fingerprintData: string
  irisScan: string
  signature: string
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended'
  verificationLevel: 'Basic' | 'Enhanced' | 'Premium'
  lastUpdated: string
}

interface GovernmentService {
  id: string
  name: string
  category: 'Identity' | 'Travel' | 'Tax' | 'Business' | 'Social' | 'Healthcare'
  icon: React.ReactNode
  status: 'Available' | 'Processing' | 'Completed' | 'Rejected'
  processingTime: string
  requirements: string[]
  fees: number
  description: string
}

interface VerificationStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  icon: React.ReactNode
  description: string
}

export function GovernmentServices() {
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile>({
    nin: '12345678901',
    fullName: 'Adebayo Oluwaseun Johnson',
    dateOfBirth: '1990-03-15',
    gender: 'Male',
    nationality: 'Nigerian',
    stateOfOrigin: 'Lagos State',
    lga: 'Ikeja',
    phoneNumber: '+2348012345678',
    email: 'adebayo.johnson@email.com',
    address: '15, Awolowo Road, Ikoyi, Lagos',
    photo: '',
    fingerprintData: 'Fingerprint enrolled',
    irisScan: 'Iris scan completed',
    signature: 'Digital signature verified',
    status: 'Active',
    verificationLevel: 'Premium',
    lastUpdated: '2024-11-30T10:30:00Z'
  })

  const [governmentServices, setGovernmentServices] = useState<GovernmentService[]>([
    {
      id: 'nin-enrollment',
      name: 'NIN Enrollment',
      category: 'Identity',
      icon: <CreditCard className="w-6 h-6" />,
      status: 'Completed',
      processingTime: 'Instant',
      requirements: ['Birth Certificate', 'Valid ID', 'Passport Photo'],
      fees: 0,
      description: 'National Identity Number enrollment and verification'
    },
    {
      id: 'passport-application',
      name: 'International Passport',
      category: 'Travel',
      icon: <Globe className="w-6 h-6" />,
      status: 'Processing',
      processingTime: '6-8 weeks',
      requirements: ['NIN', 'Birth Certificate', 'Local Government Certificate'],
      fees: 35000,
      description: 'Standard Nigerian international passport application'
    },
    {
      id: 'cac-registration',
      name: 'Business Registration',
      category: 'Business',
      icon: <FileText className="w-6 h-6" />,
      status: 'Available',
      processingTime: '24-48 hours',
      requirements: ['Business Name', 'Registered Address', 'Director Information'],
      fees: 15000,
      description: 'Corporate Affairs Commission business registration'
    },
    {
      id: 'tax-filing',
      name: 'Tax Filing',
      category: 'Tax',
      icon: <Shield className="w-6 h-6" />,
      status: 'Available',
      processingTime: '1-3 days',
      requirements: ['TIN', 'Financial Records', 'Employment Details'],
      fees: 5000,
      description: 'Federal Inland Revenue Service tax filing'
    }
  ])

  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: 'biometric-capture',
      name: 'Biometric Capture',
      status: 'completed',
      icon: <Fingerprint className="w-5 h-5" />,
      description: 'Fingerprint and facial recognition'
    },
    {
      id: 'document-verification',
      name: 'Document Verification',
      status: 'completed',
      icon: <FileText className="w-5 h-5" />,
      description: 'Verify identity documents'
    },
    {
      id: 'address-verification',
      name: 'Address Verification',
      status: 'processing',
      icon: <Eye className="w-5 h-5" />,
      description: 'Physical address confirmation'
    },
    {
      id: 'final-approval',
      name: 'Final Approval',
      status: 'pending',
      icon: <CheckCircle className="w-5 h-5" />,
      description: 'Government approval and activation'
    }
  ])

  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'verification'>('profile')
  const [selectedService, setSelectedService] = useState<GovernmentService | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Available':
      case 'completed':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'Processing':
      case 'processing':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'Completed':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'Rejected':
      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'pending':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Identity': return 'from-blue-500 to-cyan-500'
      case 'Travel': return 'from-green-500 to-emerald-500'
      case 'Tax': return 'from-orange-500 to-red-500'
      case 'Business': return 'from-purple-500 to-pink-500'
      case 'Social': return 'from-indigo-500 to-violet-500'
      case 'Healthcare': return 'from-teal-500 to-green-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Federal Government Services
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Unified citizen portal for all federal government services with quantum-secure identity verification
          </p>
        </motion.div>

        {/* Citizen Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center">
              <User className="w-8 h-8 mr-4 text-blue-400" />
              Citizen Profile
            </h2>
            <div className={`px-4 py-2 rounded-full border ${getStatusColor(citizenProfile.status)}`}>
              {citizenProfile.status}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-blue-300 text-sm font-medium">National Identity Number</label>
                <p className="text-white text-lg font-mono">{citizenProfile.nin}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">Full Name</label>
                <p className="text-white text-lg">{citizenProfile.fullName}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">Date of Birth</label>
                <p className="text-white text-lg">{citizenProfile.dateOfBirth}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">Gender</label>
                <p className="text-white text-lg">{citizenProfile.gender}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-blue-300 text-sm font-medium">Nationality</label>
                <p className="text-white text-lg">{citizenProfile.nationality}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">State of Origin</label>
                <p className="text-white text-lg">{citizenProfile.stateOfOrigin}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">Local Government</label>
                <p className="text-white text-lg">{citizenProfile.lga}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">Phone Number</label>
                <p className="text-white text-lg">{citizenProfile.phoneNumber}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-blue-300 text-sm font-medium">Email Address</label>
                <p className="text-white text-lg">{citizenProfile.email}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">Residential Address</label>
                <p className="text-white text-lg">{citizenProfile.address}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">Verification Level</label>
                <p className="text-white text-lg">{citizenProfile.verificationLevel}</p>
              </div>
              <div>
                <label className="text-blue-300 text-sm font-medium">Last Updated</label>
                <p className="text-white text-lg">{new Date(citizenProfile.lastUpdated).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Biometric Status */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Fingerprint className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-white font-medium">Fingerprint</p>
                  <p className="text-green-300 text-sm">{citizenProfile.fingerprintData}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Eye className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Iris Scan</p>
                  <p className="text-blue-300 text-sm">{citizenProfile.irisScan}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-white font-medium">Digital Signature</p>
                  <p className="text-purple-300 text-sm">{citizenProfile.signature}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Government Services Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Shield className="w-8 h-8 mr-4 text-blue-400" />
            Available Government Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {governmentServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedService(service)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(service.category)} flex items-center justify-center`}>
                    {service.icon}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(service.status)}`}>
                    {service.status}
                  </div>
                </div>

                <h3 className="text-white text-lg font-bold mb-2">{service.name}</h3>
                <p className="text-blue-200 text-sm mb-4">{service.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-300">Processing Time:</span>
                    <span className="text-white">{service.processingTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-300">Fee:</span>
                    <span className="text-white">₦{service.fees.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-blue-300 text-xs mb-2">Requirements:</p>
                  <div className="flex flex-wrap gap-1">
                    {service.requirements.slice(0, 2).map((req, idx) => (
                      <span key={idx} className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">
                        {req}
                      </span>
                    ))}
                    {service.requirements.length > 2 && (
                      <span className="text-blue-300 text-xs">+{service.requirements.length - 2} more</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Verification Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <CheckCircle className="w-8 h-8 mr-4 text-blue-400" />
            Identity Verification Progress
          </h2>

          <div className="space-y-4">
            {verificationSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{step.name}</h3>
                  <p className="text-blue-300 text-sm">{step.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(step.status)}`}>
                  {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-white font-medium">Overall Verification Status</p>
                <p className="text-blue-300 text-sm">75% Complete - 1 step remaining</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-400 text-2xl font-bold">75%</p>
              <p className="text-blue-300 text-sm">Complete</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedService(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-white flex items-center">
                  {selectedService.icon}
                  <span className="ml-4">{selectedService.name}</span>
                </h3>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-6">
                <p className="text-blue-200 text-lg">{selectedService.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                    <p className="text-blue-300 text-sm mb-1">Processing Time</p>
                    <p className="text-white text-lg font-semibold">{selectedService.processingTime}</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4">
                    <p className="text-green-300 text-sm mb-1">Service Fee</p>
                    <p className="text-white text-lg font-semibold">₦{selectedService.fees.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Required Documents</h4>
                  <div className="space-y-2">
                    {selectedService.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span className="text-white">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all">
                    Apply Now
                  </button>
                  <button className="flex-1 bg-white/10 text-white py-3 px-6 rounded-xl font-semibold border border-blue-400/30 hover:bg-white/20 transition-all">
                    Save for Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function NINManagement() {
  const [ninData, setNinData] = useState({
    nin: '12345678901',
    enrollmentDate: '2023-01-15',
    enrollmentCenter: 'Ikeja Digital Center, Lagos',
    status: 'Active',
    verificationLevel: 'Premium',
    biometricStatus: 'Complete',
    documentStatus: 'Verified'
  })

  const [biometricData, setBiometricData] = useState({
    fingerprint: { status: 'Enrolled', quality: 98 },
    facial: { status: 'Captured', quality: 95 },
    iris: { status: 'Scanned', quality: 92 },
    signature: { status: 'Digital', quality: 88 }
  })

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30"
      >
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <CreditCard className="w-8 h-8 mr-4 text-blue-400" />
          NIN Management Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-green-400 text-sm font-medium">Active</span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">{ninData.nin}</h3>
            <p className="text-blue-300 text-sm">National Identity Number</p>
          </div>

          <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Complete</span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">100%</h3>
            <p className="text-green-300 text-sm">Biometric Enrollment</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Camera className="w-8 h-8 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">Premium</span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">Verified</h3>
            <p className="text-purple-300 text-sm">Identity Status</p>
          </div>

          <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Fingerprint className="w-8 h-8 text-orange-400" />
              <span className="text-orange-400 text-sm font-medium">Quantum</span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">Secure</h3>
            <p className="text-orange-300 text-sm">Security Level</p>
          </div>
        </div>
      </motion.div>

      {/* Biometric Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30"
      >
        <h3 className="text-2xl font-bold text-white mb-6">Biometric Data Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(biometricData).map(([key, data]) => (
            <div key={key} className="bg-white/5 rounded-xl p-6 border border-blue-400/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-medium capitalize">{key}</span>
                <div className={`w-3 h-3 rounded-full ${
                  data.quality >= 95 ? 'bg-green-400' : 
                  data.quality >= 85 ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Status:</span>
                  <span className="text-white">{data.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Quality:</span>
                  <span className="text-white">{data.quality}%</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      data.quality >= 95 ? 'bg-green-400' : 
                      data.quality >= 85 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${data.quality}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
