"use client"
import React from 'react'
import { ChatApp } from '@/components/chat/chat-app'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center bg-blue-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-blue-300 text-sm font-medium">Conversational AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Chat</h1>
          <p className="text-gray-300 mt-2">Ask anything. Get instant assistance.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
          <ChatApp />
        </div>
      </div>
    </div>
  )
}
