'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Complete 69 Dorce.ai Apps - CSS Animation Version
const DORCE_APPS = [
  // 🌐 SOCIAL & COMMUNICATION (Red/Pink) - 8 Apps
  { id: 'community', name: 'Community Forums', description: 'Connect with like-minded individuals', category: 'social', icon: '💬', color: '#FF6B6B', connections: ['social-feed', 'chat-messenger', 'file-sharing'] },
  { id: 'social-feed', name: 'Social Feed', description: 'Stay updated with your network', category: 'social', icon: '📱', color: '#FF8E8E', connections: ['community', 'video-calls', 'event-planner'] },
  { id: 'video-calls', name: 'Video Calls', description: 'Crystal-clear video conversations', category: 'social', icon: '📹', color: '#FF4757', connections: ['social-feed', 'voice-messages', 'group-messenger'] },
  { id: 'chat-messenger', name: 'Chat Messenger', description: 'Instant messaging with encryption', category: 'social', icon: '💭', color: '#FF3838', connections: ['community', 'voice-messages', 'file-sharing'] },
  { id: 'voice-messages', name: 'Voice Messages', description: 'Send quick voice notes', category: 'social', icon: '🎤', color: '#FF6B9D', connections: ['video-calls', 'chat-messenger', 'group-messenger'] },
  { id: 'group-messenger', name: 'Group Messenger', description: 'Create communities and collaborate', category: 'social', icon: '👥', color: '#FF8E53', connections: ['video-calls', 'voice-messages', 'event-planner'] },
  { id: 'file-sharing', name: 'File Sharing', description: 'Share files securely', category: 'social', icon: '📁', color: '#FF9FF3', connections: ['community', 'chat-messenger', 'social-feed'] },
  { id: 'event-planner', name: 'Event Planner', description: 'Organize and manage events', category: 'social', icon: '🗓️', color: '#FF6B9D', connections: ['social-feed', 'group-messenger', 'calendar'] },

  // 🛍️ COMMERCE & MARKETPLACE (Purple) - 12 Apps
  { id: 'subscription-store', name: 'Subscription Store', description: 'Discover premium services', category: 'commerce', icon: '🛍️', color: '#A55EEA', connections: ['digital-marketplace', 'deal-finder', 'payment-gateway'] },
  { id: 'digital-marketplace', name: 'Digital Marketplace', description: 'Buy and sell digital products', category: 'commerce', icon: '🏪', color: '#8854D0', connections: ['subscription-store', 'vendor-portal', 'shopping-cart'] },
  { id: 'deal-finder', name: 'Deal Finder', description: 'Discover the best deals', category: 'commerce', icon: '🏷️', color: '#7C4DFF', connections: ['subscription-store', 'price-tracker', 'recommendation-ai'] },
  { id: 'price-tracker', name: 'Price Tracker', description: 'Monitor product prices', category: 'commerce', icon: '📊', color: '#6C5CE7', connections: ['deal-finder', 'review-system', 'product-catalog'] },
  { id: 'review-system', name: 'Review System', description: 'Authentic user reviews', category: 'commerce', icon: '⭐', color: '#5F3DC4', connections: ['price-tracker', 'recommendation-ai', 'customer-support'] },
  { id: 'recommendation-ai', name: 'Recommendation AI', description: 'Personalized suggestions', category: 'commerce', icon: '🎯', color: '#7048E8', connections: ['deal-finder', 'review-system', 'inventory-system'] },
  { id: 'vendor-portal', name: 'Vendor Portal', description: 'Manage products and orders', category: 'commerce', icon: '🏢', color: '#5C7CFA', connections: ['digital-marketplace', 'inventory-system', 'order-manager'] },
  { id: 'inventory-system', name: 'Inventory System', description: 'Track stock and suppliers', category: 'commerce', icon: '📦', color: '#4C6EF5', connections: ['vendor-portal', 'recommendation-ai', 'product-catalog'] },
  { id: 'product-catalog', name: 'Product Catalog', description: 'Browse product information', category: 'commerce', icon: '📖', color: '#339AF0', connections: ['price-tracker', 'inventory-system', 'shopping-cart'] },
  { id: 'shopping-cart', name: 'Shopping Cart', description: 'Seamless checkout experience', category: 'commerce', icon: '🛒', color: '#228BE6', connections: ['digital-marketplace', 'product-catalog', 'order-manager'] },
  { id: 'order-manager', name: 'Order Manager', description: 'Track orders and returns', category: 'commerce', icon: '📋', color: '#1C7ED6', connections: ['vendor-portal', 'shopping-cart', 'customer-support'] },
  { id: 'customer-support', name: 'Customer Support', description: '24/7 assistance', category: 'commerce', icon: '🎧', color: '#1971C2', connections: ['review-system', 'order-manager', 'payment-gateway'] },

  // 💰 FINANCE & ANALYTICS (Green/Teal) - 7 Apps
  { id: 'data-analyzer', name: 'Data Analyzer', description: 'Transform data into insights', category: 'finance', icon: '🔍', color: '#51CF66', connections: ['investment-hub', 'budget-tracker', 'savings-manager'] },
  { id: 'investment-hub', name: 'Investment Hub', description: 'Manage your portfolio', category: 'finance', icon: '📈', color: '#40C057', connections: ['data-analyzer', 'crypto-wallet', 'digital-wallet'] },
  { id: 'budget-tracker', name: 'Budget Tracker', description: 'Intelligent spending analysis', category: 'finance', icon: '📒', color: '#37B24D', connections: ['data-analyzer', 'savings-manager', 'payment-gateway'] },
  { id: 'savings-manager', name: 'Savings Manager', description: 'Set and achieve financial goals', category: 'finance', icon: '🐷', color: '#2F9E44', connections: ['data-analyzer', 'budget-tracker', 'payment-gateway'] },
  { id: 'payment-gateway', name: 'Payment Gateway', description: 'Secure payment processing', category: 'finance', icon: '🏦', color: '#27AE60', connections: ['budget-tracker', 'savings-manager', 'crypto-wallet'] },
  { id: 'crypto-wallet', name: 'Crypto Wallet', description: 'Manage cryptocurrencies', category: 'finance', icon: '💎', color: '#219A52', connections: ['investment-hub', 'payment-gateway', 'digital-wallet'] },
  { id: 'digital-wallet', name: 'Digital Wallet', description: 'All payment methods in one place', category: 'finance', icon: '💳', color: '#1E874B', connections: ['investment-hub', 'crypto-wallet', 'system-monitor'] },

  // ⚙️ OS & SYSTEM (Blue) - 10 Apps
  { id: 'os-kernel', name: 'OS Kernel', description: 'Powerful system core', category: 'system', icon: '⚙️', color: '#339AF0', connections: ['window-manager', 'security-layer', 'process-manager'] },
  { id: 'window-manager', name: 'Window Manager', description: 'Multi-window interface', category: 'system', icon: '🪟', color: '#228BE6', connections: ['os-kernel', 'file-system', 'system-monitor'] },
  { id: 'security-layer', name: 'Security Layer', description: 'Enterprise-grade protection', category: 'system', icon: '🛡️', color: '#1C7ED6', connections: ['os-kernel', 'process-manager', 'network-stack'] },
  { id: 'process-manager', name: 'Process Manager', description: 'System performance monitor', category: 'system', icon: '🔧', color: '#1971C2', connections: ['os-kernel', 'security-layer', 'memory-manager'] },
  { id: 'file-system', name: 'File System', description: 'Intelligent file organization', category: 'system', icon: '📁', color: '#1864AB', connections: ['window-manager', 'task-scheduler', 'boot-loader'] },
  { id: 'network-stack', name: 'Network Stack', description: 'Lightning-fast connectivity', category: 'system', icon: '🌐', color: '#1742A1', connections: ['security-layer', 'memory-manager', 'system-monitor'] },
  { id: 'task-scheduler', name: 'Task Scheduler', description: 'Automate repetitive tasks', category: 'system', icon: '📅', color: '#152C7B', connections: ['file-system', 'system-monitor', 'notes'] },
  { id: 'memory-manager', name: 'Memory Manager', description: 'Efficient memory allocation', category: 'system', icon: '💾', color: '#141E61', connections: ['process-manager', 'network-stack', 'system-monitor'] },
  { id: 'boot-loader', name: 'Boot Loader', description: 'Lightning-fast startup', category: 'system', icon: '🚀', color: '#122F5E', connections: ['file-system', 'system-monitor', 'digital-wallet'] },
  { id: 'system-monitor', name: 'System Monitor', description: 'Real-time health monitoring', category: 'system', icon: '📺', color: '#0F1B3C', connections: ['window-manager', 'network-stack', 'memory-manager', 'boot-loader', 'digital-wallet'] },

  // 🎬 MEDIA & CONTENT (Orange/Yellow) - 13 Apps
  { id: 'music-player', name: 'Music Player', description: 'Immersive audio experience', category: 'media', icon: '🎵', color: '#FF9500', connections: ['photo-gallery', 'video-editor', 'radio-tuner'] },
  { id: 'photo-gallery', name: 'Photo Gallery', description: 'Organize and share memories', category: 'media', icon: '📸', color: '#FF8C00', connections: ['music-player', 'video-editor', 'live-streamer'] },
  { id: 'video-editor', name: 'Video Editor', description: 'Professional video editing', category: 'media', icon: '🎬', color: '#FF8200', connections: ['music-player', 'photo-gallery', 'game-center'] },
  { id: 'game-center', name: 'Game Center', description: 'Discover and play games', category: 'media', icon: '🎮', color: '#FF7800', connections: ['video-editor', 'live-streamer', 'ebook-reader'] },
  { id: 'live-streamer', name: 'Live Streamer', description: 'Broadcast to the world', category: 'media', icon: '📡', color: '#FF6E00', connections: ['photo-gallery', 'game-center', 'radio-tuner'] },
  { id: 'ebook-reader', name: 'E-book Reader', description: 'Immersive reading experience', category: 'media', icon: '📚', color: '#FF6400', connections: ['game-center', 'radio-tuner', 'reminders'] },
  { id: 'radio-tuner', name: 'Radio Tuner', description: 'Global radio stations', category: 'media', icon: '📻', color: '#FF5A00', connections: ['music-player', 'live-streamer', 'ebook-reader'] },
  { id: 'password-manager', name: 'Password Manager', description: 'Secure password storage', category: 'media', icon: '🔑', color: '#FF5000', connections: ['barcode-scanner', 'reminders', 'calculator'] },
  { id: 'barcode-scanner', name: 'Barcode Scanner', description: 'Product information instantly', category: 'media', icon: '📋', color: '#FF4600', connections: ['password-manager', 'unit-converter', 'color-picker'] },
  { id: 'reminders', name: 'Reminders', description: 'Smart task management', category: 'media', icon: '📝', color: '#FF3C00', connections: ['password-manager', 'ebook-reader', 'calendar'] },
  { id: 'calculator', name: 'Calculator', description: 'Advanced calculations', category: 'media', icon: '🧮', color: '#FF3200', connections: ['password-manager', 'unit-converter', 'notes'] },
  { id: 'unit-converter', name: 'Unit Converter', description: 'Convert any units', category: 'media', icon: '⚖️', color: '#FF2800', connections: ['barcode-scanner', 'calculator', 'color-picker'] },
  { id: 'color-picker', name: 'Color Picker', description: 'Professional color tools', category: 'media', icon: '🎨', color: '#FF1E00', connections: ['barcode-scanner', 'unit-converter', 'notes'] },

  // 🛠️ UTILITIES & TOOLS (Cyan/Blue) - 5 Apps
  { id: 'weather-app', name: 'Weather App', description: 'Accurate weather forecasts', category: 'utility', icon: '🌤️', color: '#74C0FC', connections: ['calendar', 'transit', 'notes'] },
  { id: 'calendar', name: 'Calendar', description: 'Intelligent scheduling', category: 'utility', icon: '📅', color: '#4DABF7', connections: ['weather-app', 'event-planner', 'reminders'] },
  { id: 'transit', name: 'Transit', description: 'Real-time transport info', category: 'utility', icon: '🚌', color: '#339AF0', connections: ['weather-app', 'notes', 'status-update'] },
  { id: 'notes', name: 'Notes', description: 'Capture ideas instantly', category: 'utility', icon: '📝', color: '#228BE6', connections: ['weather-app', 'transit', 'calculator'] },
  { id: 'status-update', name: 'Status Update', description: 'Keep network informed', category: 'utility', icon: '📢', color: '#1C7ED6', connections: ['transit', 'notes', 'calendar'] },
];

export default function RevolutionaryLandingCSS() {
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Initialize floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.1,
    }));
    setParticles(newParticles);
  }, []);

  // Create spiral positioning for apps
  const getAppPosition = (index: number, total: number) => {
    const categories = ['social', 'commerce', 'finance', 'system', 'media', 'utility'];
    const categoryIndex = categories.indexOf(DORCE_APPS[index].category);
    const appsInCategory = DORCE_APPS.filter(app => app.category === DORCE_APPS[index].category);
    const appIndexInCategory = appsInCategory.findIndex(app => app.id === DORCE_APPS[index].id);
    
    const radius = 200 + categoryIndex * 60;
    const angle = (appIndexInCategory / appsInCategory.length) * 360 + (categoryIndex * 60);
    const radian = (angle * Math.PI) / 180;
    
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white opacity-20 animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        ></div>
      ))}

      {/* Revolutionary Central Core */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
        style={{
          transform: `translate(-50%, -50%) translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.02}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.02}px)`,
        }}
      >
        <div className="relative">
          {/* Multi-layer glow effect */}
          <div className="absolute inset-0 bg-cyan-400 rounded-full filter blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-0 bg-blue-500 rounded-full filter blur-2xl opacity-40 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-purple-600 rounded-full filter blur-xl opacity-30 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
          
          {/* Main core with revolutionary animation */}
          <div className="relative w-40 h-40 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center text-5xl animate-spin" style={{ animationDuration: '30s' }}>
            <div className="absolute inset-2 bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500 rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
            <div className="relative z-10 animate-bounce" style={{ animationDuration: '4s' }}>🧠</div>
          </div>
          
          {/* Orbital rings */}
          <div className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
          <div className="absolute inset-0 border border-blue-500 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
          <div className="absolute inset-0 border border-purple-600 rounded-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}></div>
        </div>
      </div>

      {/* App Nodes */}
      {DORCE_APPS.map((app, index) => {
        const position = getAppPosition(index, DORCE_APPS.length);
        return (
          <div
            key={app.id}
            className="absolute z-20 cursor-pointer transition-all duration-300 hover:scale-125"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
            }}
            onClick={() => setSelectedApp(app)}
          >
            <div className="relative group">
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full filter blur-xl opacity-60 animate-pulse"
                style={{ 
                  backgroundColor: app.color,
                  width: '60px',
                  height: '60px',
                  transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.01}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.01}px)`
                }}
              ></div>
              
              {/* Main node */}
              <div
                className="relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-300 group-hover:scale-110 animate-neural-pulse"
                style={{ 
                  backgroundColor: app.color,
                  boxShadow: `0 0 20px ${app.color}50`,
                  color: app.color,
                }}
              >
                {app.icon}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Connection Lines - Rendered separately to avoid positioning issues */}
      {DORCE_APPS.map((app, index) => {
        const position = getAppPosition(index, DORCE_APPS.length);
        return app.connections.map((connectionId) => {
          const targetApp = DORCE_APPS.find(a => a.id === connectionId);
          if (!targetApp) return null;
          const targetIndex = DORCE_APPS.indexOf(targetApp);
          const targetPosition = getAppPosition(targetIndex, DORCE_APPS.length);
          
          const distance = Math.sqrt(Math.pow(targetPosition.x - position.x, 2) + Math.pow(targetPosition.y - position.y, 2));
          const angle = Math.atan2(targetPosition.y - position.y, targetPosition.x - position.x) * (180 / Math.PI);
          
          return (
            <div
              key={`${app.id}-${connectionId}`}
              className="absolute top-1/2 left-1/2 origin-left h-1 bg-gradient-to-r opacity-40 animate-spider-web z-10 energy-flow"
              style={{
                width: `${distance}px`,
                backgroundImage: `linear-gradient(to right, ${app.color}80, ${targetApp.color}80)`,
                left: '50%',
                top: '50%',
                transformOrigin: '0 50%',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) rotate(${angle}deg)`,
                animationDelay: `${index * 0.1}s`,
              }}
            ></div>
          );
        });
      }).flat()}

      {/* Revolutionary Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-8">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              DORCE AI
            </h1>
            <p className="text-gray-300 mt-3 text-xl font-light">The Revolutionary Operating System for Human Connection</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Started
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="px-8 py-4 border-2 border-gray-600 text-white rounded-full font-semibold hover:bg-gray-800 hover:border-gray-500 transition-all duration-300"
            >
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Advanced App Details Panel */}
      {selectedApp && (
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 z-40 bg-gray-900 bg-opacity-95 backdrop-blur-xl rounded-3xl p-10 max-w-lg border border-gray-600 shadow-2xl">
          <button 
            onClick={() => setSelectedApp(null)}
            className="absolute top-6 right-6 text-gray-400 hover:text-white text-3xl font-bold"
          >
            ×
          </button>
          <div className="text-center mb-8">
            <div className="text-7xl mb-6 transform hover:scale-110 transition-transform">{selectedApp.icon}</div>
            <h3 className="text-3xl font-bold text-white mb-3">{selectedApp.name}</h3>
            <span className="inline-block px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: selectedApp.color + '30', color: selectedApp.color }}>
              {selectedApp.category.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-300 text-center mb-8 text-lg leading-relaxed">
            {selectedApp.description}
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setSelectedApp(null);
                router.push('/dashboard');
              }}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
            >
              Launch App
            </button>
            <button 
              onClick={() => setSelectedApp(null)}
              className="px-6 py-4 border-2 border-gray-600 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 hover:border-gray-500 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Revolutionary Navigation System */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-xl rounded-full px-10 py-5 border border-gray-700 shadow-2xl">
          <div className="flex items-center gap-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              DORCE AI
            </div>
            <nav className="flex gap-8">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white transition-all duration-300 font-medium text-lg hover:scale-110 transform"
              >
                Dashboard
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="text-gray-300 hover:text-white transition-all duration-300 font-medium text-lg hover:scale-110 transform"
              >
                Login
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="text-gray-300 hover:text-white transition-all duration-300 font-medium text-lg hover:scale-110 transform"
              >
                Register
              </button>
            </nav>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
            >
              Enter OS
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Quick Access Panel */}
      <div className="absolute top-40 right-8 z-30">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-xl rounded-3xl p-8 border border-gray-700 shadow-2xl max-w-sm">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Access</h3>
          <div className="space-y-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="text-3xl">📊</span>
              <span className="text-gray-300 font-medium">Dashboard</span>
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="text-3xl">🔐</span>
              <span className="text-gray-300 font-medium">Login</span>
            </button>
            <button 
              onClick={() => router.push('/register')}
              className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="text-3xl">📝</span>
              <span className="text-gray-300 font-medium">Register</span>
            </button>
            <div className="border-t border-gray-700 pt-6 mt-6">
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                Explore Full OS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Revolutionary Instructions */}
      <div className="absolute bottom-8 left-8 z-30 text-white">
        <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-xl p-6 max-w-md">
          <h4 className="font-semibold mb-4 text-xl">🎮 Explore the Neural Network</h4>
          <ul className="text-sm text-gray-300 space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-blue-400">🖱️</span>
              <span>Move your mouse to influence the network</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-purple-400">📱</span>
              <span>69 apps organized by category and color</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">👆</span>
              <span>Click any app to see details</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-yellow-400">🚀</span>
              <span>Use navigation to access OS features</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Revolutionary Stats Dashboard */}
      <div className="absolute bottom-8 right-8 z-30 text-white">
        <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-xl p-6">
          <h4 className="font-semibold mb-4 text-lg">🧠 Network Stats</h4>
          <div className="text-sm text-gray-300 space-y-3">
            <div className="flex justify-between items-center">
              <span>Connected Apps:</span>
              <span className="font-bold text-blue-400 text-lg">69</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Neural Connections:</span>
              <span className="font-bold text-purple-400 text-lg">500+</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Network Status:</span>
              <span className="font-bold text-green-400 text-lg">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        @keyframes energy-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes neural-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px currentColor;
          }
          50% { 
            transform: scale(1.1);
            box-shadow: 0 0 40px currentColor, 0 0 80px currentColor;
          }
        }
        
        @keyframes spider-web-glow {
          0%, 100% { 
            opacity: 0.3;
            filter: blur(1px);
          }
          50% { 
            opacity: 0.8;
            filter: blur(0px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-neural-pulse {
          animation: neural-pulse 2.5s ease-in-out infinite;
        }
        
        .animate-spider-web {
          animation: spider-web-glow 3s ease-in-out infinite;
        }
        
        .energy-flow::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: energy-flow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}