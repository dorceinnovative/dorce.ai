import React from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Shield, Zap, CreditCard, Activity } from 'lucide-react'

export function FinancialEcosystem() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Quantum Financial Ecosystem
          </h1>
          <p className="text-xl text-green-200 max-w-3xl mx-auto">
            Multi-currency digital wallet with quantum-secure transactions and AI-powered investment management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { name: 'Universal Wallet', balance: 125000.50, icon: <CreditCard className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500' },
            { name: 'Investment Portfolio', balance: 450000.75, icon: <TrendingUp className="w-6 h-6" />, color: 'from-green-500 to-emerald-500' },
            { name: 'Quantum Savings', balance: 85000.25, icon: <Shield className="w-6 h-6" />, color: 'from-purple-500 to-pink-500' },
            { name: 'Business Account', balance: 280000.00, icon: <Activity className="w-6 h-6" />, color: 'from-orange-500 to-red-500' }
          ].map((wallet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`bg-gradient-to-br ${wallet.color} backdrop-blur-xl rounded-2xl p-6 border border-green-400/20 hover:border-green-400/40 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {wallet.icon}
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>

              <h3 className="text-white text-lg font-bold mb-2">{wallet.name}</h3>
              <p className="text-white text-2xl font-bold">₦{wallet.balance.toLocaleString()}</p>
              <p className="text-green-300 text-sm mt-2">Quantum Secured</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Zap className="w-6 h-6" />, label: 'Send Money', color: 'from-blue-500 to-cyan-500' },
            { icon: <Activity className="w-6 h-6" />, label: 'Receive', color: 'from-green-500 to-emerald-500' },
            { icon: <TrendingUp className="w-6 h-6" />, label: 'Invest', color: 'from-purple-500 to-pink-500' },
            { icon: <Shield className="w-6 h-6" />, label: 'Exchange', color: 'from-orange-500 to-red-500' }
          ].map((action, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`bg-gradient-to-br ${action.color} text-white p-6 rounded-2xl border border-green-400/30 hover:border-green-400/50 transition-all duration-300`}
            >
              <div className="flex flex-col items-center space-y-2">
                {action.icon}
                <span className="font-medium">{action.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}