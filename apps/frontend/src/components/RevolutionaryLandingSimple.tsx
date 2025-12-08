'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AppNode {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  connections: string[];
  x: number;
  y: number;
  size: number;
  pulse: number;
}

// Complete 69 Dorce.ai Apps - Optimized for Performance
const DORCE_APPS: AppNode[] = [
  // 🌐 SOCIAL & COMMUNICATION (Red/Pink) - 8 Apps
  { id: 'community', name: 'Community Forums', description: 'Connect with like-minded individuals', category: 'social', icon: '💬', color: '#FF6B6B', connections: ['social-feed', 'event-planner'], x: 0, y: 0, size: 40, pulse: 0 },
  { id: 'social-feed', name: 'Social Feed', description: 'Stay updated with your network', category: 'social', icon: '📱', color: '#FF8E8E', connections: ['video-calls', 'community'], x: 0, y: 0, size: 35, pulse: 0 },
  { id: 'video-calls', name: 'Video Calls', description: 'Crystal-clear video conversations', category: 'social', icon: '📹', color: '#FF4757', connections: ['chat-messenger', 'social-feed'], x: 0, y: 0, size: 38, pulse: 0 },
  { id: 'chat-messenger', name: 'Chat Messenger', description: 'Instant messaging with encryption', category: 'social', icon: '💭', color: '#FF3838', connections: ['voice-messages', 'video-calls'], x: 0, y: 0, size: 36, pulse: 0 },
  { id: 'voice-messages', name: 'Voice Messages', description: 'Send quick voice notes', category: 'social', icon: '🎤', color: '#FF6B9D', connections: ['group-messenger', 'chat-messenger'], x: 0, y: 0, size: 32, pulse: 0 },
  { id: 'group-messenger', name: 'Group Messenger', description: 'Create communities and collaborate', category: 'social', icon: '👥', color: '#FF8E53', connections: ['file-sharing', 'voice-messages'], x: 0, y: 0, size: 37, pulse: 0 },
  { id: 'file-sharing', name: 'File Sharing', description: 'Share files securely', category: 'social', icon: '📁', color: '#FF9FF3', connections: ['event-planner', 'group-messenger'], x: 0, y: 0, size: 34, pulse: 0 },
  { id: 'event-planner', name: 'Event Planner', description: 'Organize and manage events', category: 'social', icon: '🗓️', color: '#FF6B9D', connections: ['community', 'file-sharing'], x: 0, y: 0, size: 39, pulse: 0 },

  // 🛍️ COMMERCE & MARKETPLACE (Purple) - 12 Apps
  { id: 'subscription-store', name: 'Subscription Store', description: 'Discover premium services', category: 'commerce', icon: '🛍️', color: '#A55EEA', connections: ['digital-marketplace', 'deal-finder'], x: 0, y: 0, size: 42, pulse: 0 },
  { id: 'digital-marketplace', name: 'Digital Marketplace', description: 'Buy and sell digital products', category: 'commerce', icon: '🏪', color: '#8854D0', connections: ['product-catalog', 'subscription-store'], x: 0, y: 0, size: 40, pulse: 0 },
  { id: 'deal-finder', name: 'Deal Finder', description: 'Discover the best deals', category: 'commerce', icon: '🏷️', color: '#7C4DFF', connections: ['price-tracker', 'digital-marketplace'], x: 0, y: 0, size: 36, pulse: 0 },
  { id: 'price-tracker', name: 'Price Tracker', description: 'Monitor product prices', category: 'commerce', icon: '📊', color: '#6C5CE7', connections: ['review-system', 'deal-finder'], x: 0, y: 0, size: 34, pulse: 0 },
  { id: 'review-system', name: 'Review System', description: 'Authentic user reviews', category: 'commerce', icon: '⭐', color: '#5F3DC4', connections: ['shopping-cart', 'price-tracker'], x: 0, y: 0, size: 33, pulse: 0 },
  { id: 'recommendation-ai', name: 'Recommendation AI', description: 'Personalized suggestions', category: 'commerce', icon: '🎯', color: '#7048E8', connections: ['inventory-system', 'review-system'], x: 0, y: 0, size: 35, pulse: 0 },
  { id: 'vendor-portal', name: 'Vendor Portal', description: 'Manage products and orders', category: 'commerce', icon: '🏢', color: '#5C7CFA', connections: ['customer-support', 'inventory-system'], x: 0, y: 0, size: 38, pulse: 0 },
  { id: 'inventory-system', name: 'Inventory System', description: 'Track stock and suppliers', category: 'commerce', icon: '📦', color: '#4C6EF5', connections: ['order-manager', 'vendor-portal'], x: 0, y: 0, size: 37, pulse: 0 },
  { id: 'product-catalog', name: 'Product Catalog', description: 'Browse product information', category: 'commerce', icon: '📖', color: '#339AF0', connections: ['shopping-cart', 'inventory-system'], x: 0, y: 0, size: 35, pulse: 0 },
  { id: 'shopping-cart', name: 'Shopping Cart', description: 'Seamless checkout experience', category: 'commerce', icon: '🛒', color: '#228BE6', connections: ['order-manager', 'product-catalog'], x: 0, y: 0, size: 39, pulse: 0 },
  { id: 'order-manager', name: 'Order Manager', description: 'Track orders and returns', category: 'commerce', icon: '📋', color: '#1C7ED6', connections: ['customer-support', 'shopping-cart'], x: 0, y: 0, size: 36, pulse: 0 },
  { id: 'customer-support', name: 'Customer Support', description: '24/7 assistance', category: 'commerce', icon: '🎧', color: '#1971C2', connections: ['subscription-store', 'order-manager'], x: 0, y: 0, size: 40, pulse: 0 },

  // 💰 FINANCE & ANALYTICS (Green/Teal) - 7 Apps
  { id: 'data-analyzer', name: 'Data Analyzer', description: 'Transform data into insights', category: 'finance', icon: '🔍', color: '#51CF66', connections: ['investment-hub', 'budget-tracker'], x: 0, y: 0, size: 38, pulse: 0 },
  { id: 'investment-hub', name: 'Investment Hub', description: 'Manage your portfolio', category: 'finance', icon: '📈', color: '#40C057', connections: ['payment-gateway', 'data-analyzer'], x: 0, y: 0, size: 40, pulse: 0 },
  { id: 'budget-tracker', name: 'Budget Tracker', description: 'Intelligent spending analysis', category: 'finance', icon: '📒', color: '#37B24D', connections: ['savings-manager', 'investment-hub'], x: 0, y: 0, size: 36, pulse: 0 },
  { id: 'savings-manager', name: 'Savings Manager', description: 'Set and achieve financial goals', category: 'finance', icon: '🐷', color: '#2F9E44', connections: ['digital-wallet', 'budget-tracker'], x: 0, y: 0, size: 34, pulse: 0 },
  { id: 'payment-gateway', name: 'Payment Gateway', description: 'Secure payment processing', category: 'finance', icon: '🏦', color: '#27AE60', connections: ['crypto-wallet', 'investment-hub'], x: 0, y: 0, size: 39, pulse: 0 },
  { id: 'crypto-wallet', name: 'Crypto Wallet', description: 'Manage cryptocurrencies', category: 'finance', icon: '💎', color: '#219A52', connections: ['digital-wallet', 'payment-gateway'], x: 0, y: 0, size: 37, pulse: 0 },
  { id: 'digital-wallet', name: 'Digital Wallet', description: 'All payment methods in one place', category: 'finance', icon: '💳', color: '#1E874B', connections: ['savings-manager', 'crypto-wallet'], x: 0, y: 0, size: 38, pulse: 0 },

  // ⚙️ OS & SYSTEM (Blue) - 10 Apps
  { id: 'os-kernel', name: 'OS Kernel', description: 'Powerful system core', category: 'system', icon: '⚙️', color: '#339AF0', connections: ['window-manager', 'security-layer'], x: 0, y: 0, size: 45, pulse: 0 },
  { id: 'window-manager', name: 'Window Manager', description: 'Multi-window interface', category: 'system', icon: '🪟', color: '#228BE6', connections: ['file-system', 'os-kernel'], x: 0, y: 0, size: 38, pulse: 0 },
  { id: 'security-layer', name: 'Security Layer', description: 'Enterprise-grade protection', category: 'system', icon: '🛡️', color: '#1C7ED6', connections: ['process-manager', 'window-manager'], x: 0, y: 0, size: 41, pulse: 0 },
  { id: 'process-manager', name: 'Process Manager', description: 'System performance monitor', category: 'system', icon: '🔧', color: '#1971C2', connections: ['network-stack', 'security-layer'], x: 0, y: 0, size: 36, pulse: 0 },
  { id: 'file-system', name: 'File System', description: 'Intelligent file organization', category: 'system', icon: '📁', color: '#1864AB', connections: ['task-scheduler', 'window-manager'], x: 0, y: 0, size: 37, pulse: 0 },
  { id: 'network-stack', name: 'Network Stack', description: 'Lightning-fast connectivity', category: 'system', icon: '🌐', color: '#1742A1', connections: ['system-monitor', 'process-manager'], x: 0, y: 0, size: 35, pulse: 0 },
  { id: 'task-scheduler', name: 'Task Scheduler', description: 'Automate repetitive tasks', category: 'system', icon: '📅', color: '#152C7B', connections: ['memory-manager', 'file-system'], x: 0, y: 0, size: 34, pulse: 0 },
  { id: 'memory-manager', name: 'Memory Manager', description: 'Efficient memory allocation', category: 'system', icon: '💾', color: '#141E61', connections: ['boot-loader', 'task-scheduler'], x: 0, y: 0, size: 33, pulse: 0 },
  { id: 'boot-loader', name: 'Boot Loader', description: 'Lightning-fast startup', category: 'system', icon: '🚀', color: '#122F5E', connections: ['system-monitor', 'memory-manager'], x: 0, y: 0, size: 36, pulse: 0 },
  { id: 'system-monitor', name: 'System Monitor', description: 'Real-time health monitoring', category: 'system', icon: '📺', color: '#0F1B3C', connections: ['os-kernel', 'network-stack'], x: 0, y: 0, size: 39, pulse: 0 },

  // 🎬 MEDIA & CONTENT (Orange/Yellow) - 13 Apps
  { id: 'music-player', name: 'Music Player', description: 'Immersive audio experience', category: 'media', icon: '🎵', color: '#FF9500', connections: ['photo-gallery', 'video-editor'], x: 0, y: 0, size: 37, pulse: 0 },
  { id: 'photo-gallery', name: 'Photo Gallery', description: 'Organize and share memories', category: 'media', icon: '📸', color: '#FF8C00', connections: ['video-editor', 'music-player'], x: 0, y: 0, size: 38, pulse: 0 },
  { id: 'video-editor', name: 'Video Editor', description: 'Professional video editing', category: 'media', icon: '🎬', color: '#FF8200', connections: ['game-center', 'photo-gallery'], x: 0, y: 0, size: 40, pulse: 0 },
  { id: 'game-center', name: 'Game Center', description: 'Discover and play games', category: 'media', icon: '🎮', color: '#FF7800', connections: ['live-streamer', 'video-editor'], x: 0, y: 0, size: 36, pulse: 0 },
  { id: 'live-streamer', name: 'Live Streamer', description: 'Broadcast to the world', category: 'media', icon: '📡', color: '#FF6E00', connections: ['radio-tuner', 'game-center'], x: 0, y: 0, size: 38, pulse: 0 },
  { id: 'ebook-reader', name: 'E-book Reader', description: 'Immersive reading experience', category: 'media', icon: '📚', color: '#FF6400', connections: ['password-manager', 'video-editor'], x: 0, y: 0, size: 34, pulse: 0 },
  { id: 'radio-tuner', name: 'Radio Tuner', description: 'Global radio stations', category: 'media', icon: '📻', color: '#FF5A00', connections: ['password-manager', 'live-streamer'], x: 0, y: 0, size: 35, pulse: 0 },
  { id: 'password-manager', name: 'Password Manager', description: 'Secure password storage', category: 'media', icon: '🔑', color: '#FF5000', connections: ['barcode-scanner', 'radio-tuner'], x: 0, y: 0, size: 33, pulse: 0 },
  { id: 'barcode-scanner', name: 'Barcode Scanner', description: 'Product information instantly', category: 'media', icon: '📋', color: '#FF4600', connections: ['reminders', 'password-manager'], x: 0, y: 0, size: 32, pulse: 0 },
  { id: 'reminders', name: 'Reminders', description: 'Smart task management', category: 'media', icon: '📝', color: '#FF3C00', connections: ['calculator', 'barcode-scanner'], x: 0, y: 0, size: 31, pulse: 0 },
  { id: 'calculator', name: 'Calculator', description: 'Advanced calculations', category: 'media', icon: '🧮', color: '#FF3200', connections: ['unit-converter', 'reminders'], x: 0, y: 0, size: 30, pulse: 0 },
  { id: 'unit-converter', name: 'Unit Converter', description: 'Convert any units', category: 'media', icon: '⚖️', color: '#FF2800', connections: ['color-picker', 'calculator'], x: 0, y: 0, size: 29, pulse: 0 },
  { id: 'color-picker', name: 'Color Picker', description: 'Professional color tools', category: 'media', icon: '🎨', color: '#FF1E00', connections: ['music-player', 'unit-converter'], x: 0, y: 0, size: 28, pulse: 0 },

  // 🛠️ UTILITIES & TOOLS (Cyan/Blue) - 5 Apps
  { id: 'weather-app', name: 'Weather App', description: 'Accurate weather forecasts', category: 'utility', icon: '🌤️', color: '#74C0FC', connections: ['calendar', 'transit'], x: 0, y: 0, size: 35, pulse: 0 },
  { id: 'calendar', name: 'Calendar', description: 'Intelligent scheduling', category: 'utility', icon: '📅', color: '#4DABF7', connections: ['notes', 'weather-app'], x: 0, y: 0, size: 37, pulse: 0 },
  { id: 'transit', name: 'Transit', description: 'Real-time transport info', category: 'utility', icon: '🚌', color: '#339AF0', connections: ['status-update', 'calendar'], x: 0, y: 0, size: 34, pulse: 0 },
  { id: 'notes', name: 'Notes', description: 'Capture ideas instantly', category: 'utility', icon: '📝', color: '#228BE6', connections: ['status-update', 'transit'], x: 0, y: 0, size: 33, pulse: 0 },
  { id: 'status-update', name: 'Status Update', description: 'Keep network informed', category: 'utility', icon: '📢', color: '#1C7ED6', connections: ['weather-app', 'notes'], x: 0, y: 0, size: 32, pulse: 0 }
];

export default function RevolutionaryLandingSimple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<AppNode | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const animationRef = useRef<number>();
  const nodesRef = useRef<AppNode[]>(DORCE_APPS.map(app => ({ ...app })));
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeNodePositions();
    };

    // Initialize node positions in a beautiful spiral pattern
    const initializeNodePositions = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const categories = ['social', 'commerce', 'finance', 'system', 'media', 'utility'];
      
      nodesRef.current.forEach((node, index) => {
        const categoryIndex = categories.indexOf(node.category);
        const appsInCategory = nodesRef.current.filter(n => n.category === node.category);
        const appIndexInCategory = appsInCategory.indexOf(node);
        
        // Create spiral pattern
        const spiralRadius = 150 + categoryIndex * 80;
        const angle = (appIndexInCategory / appsInCategory.length) * Math.PI * 2 + (categoryIndex * 0.5);
        
        node.x = centerX + Math.cos(angle) * spiralRadius;
        node.y = centerY + Math.sin(angle) * spiralRadius;
      });
    };

    // Animation loop
    const animate = () => {
      timeRef.current += 0.02;
      
      // Clear canvas with gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(1, '#000000');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections first (behind nodes)
      drawConnections(ctx);
      
      // Draw nodes
      drawNodes(ctx);
      
      // Draw center core
      drawCenterCore(ctx);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    const drawConnections = (ctx: CanvasRenderingContext2D) => {
      nodesRef.current.forEach(node => {
        node.connections.forEach(connectionId => {
          const targetNode = nodesRef.current.find(n => n.id === connectionId);
          if (targetNode) {
            // Create pulsing effect
            const pulse = Math.sin(timeRef.current * 3 + node.x * 0.01) * 0.3 + 0.7;
            
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.strokeStyle = node.color + Math.floor(pulse * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 2 * pulse;
            ctx.stroke();
          }
        });
      });
    };

    const drawNodes = (ctx: CanvasRenderingContext2D) => {
      nodesRef.current.forEach(node => {
        // Add floating animation
        const floatX = Math.sin(timeRef.current + node.x * 0.01) * 10;
        const floatY = Math.cos(timeRef.current * 0.7 + node.y * 0.01) * 8;
        
        const currentX = node.x + floatX;
        const currentY = node.y + floatY;
        
        // Mouse interaction
        const mouseDistance = Math.sqrt(
          Math.pow(mouseRef.current.x - currentX, 2) + 
          Math.pow(mouseRef.current.y - currentY, 2)
        );
        
        const mouseInfluence = Math.max(0, 1 - mouseDistance / 200);
        const scale = 1 + mouseInfluence * 0.3;
        
        // Draw node glow
        const glowSize = node.size * scale * 1.5;
        const glowGradient = ctx.createRadialGradient(
          currentX, currentY, 0,
          currentX, currentY, glowSize
        );
        glowGradient.addColorStop(0, node.color + '80');
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw node
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(currentX, currentY, node.size * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw icon
        ctx.font = `${node.size * scale * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(node.icon, currentX, currentY);
      });
    };

    const drawCenterCore = (ctx: CanvasRenderingContext2D) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Pulsing core
      const pulse = Math.sin(timeRef.current * 4) * 0.2 + 1;
      const coreSize = 60 * pulse;
      
      // Core glow
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize * 2
      );
      coreGradient.addColorStop(0, '#00d4ff');
      coreGradient.addColorStop(0.5, '#00d4ff80');
      coreGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Core
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Core icon
      ctx.font = `${coreSize * 0.8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText('🧠', centerX, centerY);
    };

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    // Click handling
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Check if clicked on a node
      nodesRef.current.forEach(node => {
        const distance = Math.sqrt(
          Math.pow(clickX - node.x, 2) + Math.pow(clickY - node.y, 2)
        );
        
        if (distance < node.size) {
          setSelectedApp(node);
        }
      });
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    setIsLoaded(true);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 cursor-pointer"
        style={{ background: 'radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)' }}
      />
      
      {/* Revolutionary Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-8">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              DORCE AI
            </h1>
            <p className="text-gray-300 mt-2 text-lg">The Operating System for Human Connection</p>
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
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 z-20 bg-gray-900 bg-opacity-95 backdrop-blur-xl rounded-3xl p-10 max-w-lg border border-gray-600 shadow-2xl">
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
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
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
      <div className="absolute top-40 right-8 z-20">
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
      <div className="absolute bottom-8 left-8 z-10 text-white">
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
      <div className="absolute bottom-8 right-8 z-10 text-white">
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

      {/* Loading Screen */}
      {!isLoaded && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-8 animate-pulse">🧠</div>
            <h2 className="text-4xl font-bold text-white mb-4">Initializing Neural Network</h2>
            <p className="text-gray-400 text-xl mb-8">Connecting 69 apps in perfect harmony...</p>
            <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}