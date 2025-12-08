'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

interface AppNode {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  position: THREE.Vector3;
  originalPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  mass: number;
  color: string;
  connections: string[];
}

interface FluidParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: THREE.Color;
}

const DORCE_APPS: Omit<AppNode, 'position' | 'originalPosition' | 'velocity'>[] = [
  // Social & Communication (Red/Pink)
  { id: 'community', name: 'Community Forums', description: 'Connect with like-minded individuals and build meaningful relationships through discussion', category: 'social', icon: '💬', color: '#FF6B6B', connections: ['social-feed', 'event-planner'], mass: 1.0 },
  { id: 'social-feed', name: 'Social Feed', description: 'Stay updated with your network\'s activities and share your moments', category: 'social', icon: '📱', color: '#FF8E8E', connections: ['video-calls', 'chat-messenger'], mass: 1.0 },
  { id: 'video-calls', name: 'Video Calls', description: 'Crystal-clear video conversations with anyone, anywhere in the world', category: 'social', icon: '📹', color: '#FF4757', connections: ['voice-messages'], mass: 1.0 },
  { id: 'chat-messenger', name: 'Chat Messenger', description: 'Instant messaging with end-to-end encryption for private conversations', category: 'social', icon: '💭', color: '#FF3838', connections: ['group-messenger'], mass: 1.0 },
  { id: 'voice-messages', name: 'Voice Messages', description: 'Send quick voice notes when text isn\'t enough to express yourself', category: 'social', icon: '🎤', color: '#FF6B9D', connections: ['file-sharing'], mass: 1.0 },
  { id: 'group-messenger', name: 'Group Messenger', description: 'Create communities and collaborate with teams in organized spaces', category: 'social', icon: '👥', color: '#FF8E53', connections: ['event-planner'], mass: 1.0 },
  { id: 'file-sharing', name: 'File Sharing', description: 'Share any file type securely with advanced encryption and access controls', category: 'social', icon: '📁', color: '#FF9FF3', connections: ['community'], mass: 1.0 },
  { id: 'event-planner', name: 'Event Planner', description: 'Organize and manage events from small gatherings to large conferences', category: 'social', icon: '🗓️', color: '#FF6B9D', connections: ['community'], mass: 1.0 },

  // Commerce & Marketplace (Purple)
  { id: 'subscription-store', name: 'Subscription Store', description: 'Discover and subscribe to premium services tailored to your needs', category: 'commerce', icon: '🛍️', color: '#A55EEA', connections: ['digital-marketplace', 'deal-finder'], mass: 1.0 },
  { id: 'digital-marketplace', name: 'Digital Marketplace', description: 'Buy and sell digital products with secure transactions and instant delivery', category: 'commerce', icon: '🏪', color: '#8854D0', connections: ['product-catalog', 'vendor-portal'], mass: 1.0 },
  { id: 'deal-finder', name: 'Deal Finder', description: 'Automatically discover the best deals and discounts across the internet', category: 'commerce', icon: '🏷️', color: '#7C4DFF', connections: ['price-tracker', 'recommendation-ai'], mass: 1.0 },
  { id: 'price-tracker', name: 'Price Tracker', description: 'Monitor product prices and get notified when they drop to your target', category: 'commerce', icon: '📊', color: '#6C5CE7', connections: ['review-system'], mass: 1.0 },
  { id: 'review-system', name: 'Review System', description: 'Make informed decisions with authentic user reviews and ratings', category: 'commerce', icon: '⭐', color: '#5F3DC4', connections: ['shopping-cart'], mass: 1.0 },
  { id: 'recommendation-ai', name: 'Recommendation AI', description: 'Get personalized suggestions powered by advanced machine learning', category: 'commerce', icon: '🎯', color: '#7048E8', connections: ['inventory-system'], mass: 1.0 },
  { id: 'vendor-portal', name: 'Vendor Portal', description: 'Manage your products, orders, and customer relationships in one place', category: 'commerce', icon: '🏢', color: '#5C7CFA', connections: ['inventory-system', 'customer-support'], mass: 1.0 },
  { id: 'inventory-system', name: 'Inventory System', description: 'Track stock levels, manage suppliers, and optimize your supply chain', category: 'commerce', icon: '📦', color: '#4C6EF5', connections: ['order-manager'], mass: 1.0 },
  { id: 'product-catalog', name: 'Product Catalog', description: 'Browse comprehensive product information with rich media and details', category: 'commerce', icon: '📖', color: '#339AF0', connections: ['shopping-cart'], mass: 1.0 },
  { id: 'shopping-cart', name: 'Shopping Cart', description: 'Seamless checkout experience with multiple payment options', category: 'commerce', icon: '🛒', color: '#228BE6', connections: ['order-manager'], mass: 1.0 },
  { id: 'order-manager', name: 'Order Manager', description: 'Track orders, manage returns, and handle customer inquiries efficiently', category: 'commerce', icon: '📋', color: '#1C7ED6', connections: ['customer-support'], mass: 1.0 },
  { id: 'customer-support', name: 'Customer Support', description: '24/7 assistance with AI-powered help and human experts when needed', category: 'commerce', icon: '🎧', color: '#1971C2', connections: ['insurance-portal'], mass: 1.0 },
  { id: 'insurance-portal', name: 'Insurance Portal', description: 'Compare and purchase insurance plans with transparent pricing', category: 'commerce', icon: '🛡️', color: '#1864AB', connections: ['subscription-store'], mass: 1.0 },

  // Finance & Analytics (Green/Teal)
  { id: 'data-analyzer', name: 'Data Analyzer', description: 'Transform raw data into actionable insights with powerful analytics', category: 'finance', icon: '🔍', color: '#51CF66', connections: ['investment-hub', 'budget-tracker'], mass: 1.0 },
  { id: 'investment-hub', name: 'Investment Hub', description: 'Manage your portfolio and make informed investment decisions', category: 'finance', icon: '📈', color: '#40C057', connections: ['payment-gateway', 'crypto-wallet'], mass: 1.0 },
  { id: 'budget-tracker', name: 'Budget Tracker', description: 'Take control of your finances with intelligent spending analysis', category: 'finance', icon: '📒', color: '#37B24D', connections: ['savings-manager', 'digital-wallet'], mass: 1.0 },
  { id: 'savings-manager', name: 'Savings Manager', description: 'Set financial goals and watch your savings grow with automated tools', category: 'finance', icon: '🐷', color: '#2F9E44', connections: ['loan-platform'], mass: 1.0 },
  { id: 'payment-gateway', name: 'Payment Gateway', description: 'Secure payment processing with fraud protection and instant confirmation', category: 'finance', icon: '🏦', color: '#27AE60', connections: ['crypto-wallet'], mass: 1.0 },
  { id: 'crypto-wallet', name: 'Crypto Wallet', description: 'Manage cryptocurrencies with military-grade security and easy transactions', category: 'finance', icon: '💎', color: '#219A52', connections: ['digital-wallet'], mass: 1.0 },
  { id: 'digital-wallet', name: 'Digital Wallet', description: 'All your payment methods in one secure, convenient place', category: 'finance', icon: '💳', color: '#1E874B', connections: ['loan-platform'], mass: 1.0 },
  { id: 'loan-platform', name: 'Loan Platform', description: 'Access competitive loan rates and manage your borrowing intelligently', category: 'finance', icon: '🏛️', color: '#1A7431', connections: ['data-analyzer'], mass: 1.0 },

  // OS & System (Blue)
  { id: 'os-kernel', name: 'OS Kernel', description: 'The powerful core that orchestrates all system operations seamlessly', category: 'system', icon: '⚙️', color: '#339AF0', connections: ['window-manager', 'process-manager'], mass: 1.0 },
  { id: 'window-manager', name: 'Window Manager', description: 'Intuitive multi-window interface for efficient multitasking and organization', category: 'system', icon: '🪟', color: '#228BE6', connections: ['security-layer', 'file-system'], mass: 1.0 },
  { id: 'process-manager', name: 'Process Manager', description: 'Monitor and optimize system performance with real-time insights', category: 'system', icon: '🔧', color: '#1C7ED6', connections: ['network-stack', 'boot-loader'], mass: 1.0 },
  { id: 'security-layer', name: 'Security Layer', description: 'Enterprise-grade protection with advanced encryption and threat detection', category: 'system', icon: '🛡️', color: '#1971C2', connections: ['file-system', 'memory-manager'], mass: 1.0 },
  { id: 'file-system', name: 'File System', description: 'Intelligent file organization with smart categorization and search', category: 'system', icon: '📁', color: '#1864AB', connections: ['task-scheduler'], mass: 1.0 },
  { id: 'network-stack', name: 'Network Stack', description: 'Lightning-fast connectivity with automatic optimization', category: 'system', icon: '🌐', color: '#1742A1', connections: ['system-monitor'], mass: 1.0 },
  { id: 'boot-loader', name: 'Boot Loader', description: 'Lightning-fast system startup with intelligent resource allocation', category: 'system', icon: '🚀', color: '#152C7B', connections: ['memory-manager'], mass: 1.0 },
  { id: 'memory-manager', name: 'Memory Manager', description: 'Efficient memory allocation for optimal performance across all apps', category: 'system', icon: '💾', color: '#141E61', connections: ['task-scheduler'], mass: 1.0 },
  { id: 'task-scheduler', name: 'Task Scheduler', description: 'Automate repetitive tasks and optimize your workflow efficiency', category: 'system', icon: '📅', color: '#122F5E', connections: ['system-monitor'], mass: 1.0 },
  { id: 'system-monitor', name: 'System Monitor', description: 'Real-time system health monitoring with predictive maintenance alerts', category: 'system', icon: '📺', color: '#0F1B3C', connections: ['os-kernel'], mass: 1.0 },

  // Media & Content (Orange/Yellow)
  { id: 'music-player', name: 'Music Player', description: 'Immersive audio experience with intelligent playlist curation', category: 'media', icon: '🎵', color: '#FF9500', connections: ['photo-gallery', 'video-editor'], mass: 1.0 },
  { id: 'photo-gallery', name: 'Photo Gallery', description: 'Organize, edit, and share your visual memories with AI enhancement', category: 'media', icon: '📸', color: '#FF8C00', connections: ['video-editor', 'live-streamer'], mass: 1.0 },
  { id: 'video-editor', name: 'Video Editor', description: 'Professional video editing with AI-powered tools and effects', category: 'media', icon: '🎬', color: '#FF8200', connections: ['game-center', 'ebook-reader'], mass: 1.0 },
  { id: 'game-center', name: 'Game Center', description: 'Discover and play games with social features and achievements', category: 'media', icon: '🎮', color: '#FF7800', connections: ['radio-tuner'], mass: 1.0 },
  { id: 'live-streamer', name: 'Live Streamer', description: 'Broadcast your content to the world with professional quality', category: 'media', icon: '📡', color: '#FF6E00', connections: ['password-manager'], mass: 1.0 },
  { id: 'ebook-reader', name: 'E-book Reader', description: 'Immersive reading experience with smart annotations and sync', category: 'media', icon: '📚', color: '#FF6400', connections: ['barcode-scanner'], mass: 1.0 },
  { id: 'radio-tuner', name: 'Radio Tuner', description: 'Access global radio stations with crystal-clear digital quality', category: 'media', icon: '📻', color: '#FF5A00', connections: ['password-manager'], mass: 1.0 },
  { id: 'password-manager', name: 'Password Manager', description: 'Secure password storage with biometric authentication', category: 'media', icon: '🔑', color: '#FF5000', connections: ['barcode-scanner'], mass: 1.0 },
  { id: 'barcode-scanner', name: 'Barcode Scanner', description: 'Instant product information with price comparison and reviews', category: 'media', icon: '📋', color: '#FF4600', connections: ['reminders'], mass: 1.0 },
  { id: 'reminders', name: 'Reminders', description: 'Smart task management with location-based notifications', category: 'media', icon: '📝', color: '#FF3C00', connections: ['calculator'], mass: 1.0 },
  { id: 'calculator', name: 'Calculator', description: 'Advanced calculations with unit conversions and history', category: 'media', icon: '🧮', color: '#FF3200', connections: ['unit-converter'], mass: 1.0 },
  { id: 'unit-converter', name: 'Unit Converter', description: 'Convert between any units with real-time calculations', category: 'media', icon: '⚖️', color: '#FF2800', connections: ['color-picker'], mass: 1.0 },
  { id: 'color-picker', name: 'Color Picker', description: 'Professional color tools with palette generation and harmony', category: 'media', icon: '🎨', color: '#FF1E00', connections: ['music-player'], mass: 1.0 },

  // Utilities & Tools (Cyan/Blue)
  { id: 'weather-app', name: 'Weather App', description: 'Accurate weather forecasts with hyper-local precision and alerts', category: 'utility', icon: '🌤️', color: '#74C0FC', connections: ['calendar', 'transit'], mass: 1.0 },
  { id: 'calendar', name: 'Calendar', description: 'Intelligent scheduling with conflict resolution and smart suggestions', category: 'utility', icon: '📅', color: '#4DABF7', connections: ['transit', 'notes'], mass: 1.0 },
  { id: 'transit', name: 'Transit', description: 'Real-time public transport information with optimal route planning', category: 'utility', icon: '🚌', color: '#339AF0', connections: ['notes', 'status-update'], mass: 1.0 },
  { id: 'notes', name: 'Notes', description: 'Capture ideas instantly with rich formatting and organization', category: 'utility', icon: '📝', color: '#228BE6', connections: ['status-update'], mass: 1.0 },
  { id: 'status-update', name: 'Status Update', description: 'Keep your network informed about your availability and activities', category: 'utility', icon: '📢', color: '#1C7ED6', connections: ['weather-app'], mass: 1.0 }
];

export default function RevolutionaryLanding() {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const nodesRef = useRef<AppNode[]>([]);
  const particlesRef = useRef<FluidParticle[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppNode | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const fluidFieldRef = useRef<THREE.Vector3[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 50);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: window.innerWidth > 768, // Disable antialiasing on mobile for performance
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = window.innerWidth > 768; // Disable shadows on mobile
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create fluid field
    createFluidField();

    // Create app nodes
    createAppNodes();

    // Create fluid particles
    createFluidParticles();

    // Create neural connections
    createNeuralConnections();

    // Create central core
    createCentralCore();

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      timeRef.current += 0.016;
      
      updateFluidDynamics();
      updateParticles();
      updateNodes();
      updateNeuralConnections();
      updateCentralCore();
      
      // Camera movement
      const time = timeRef.current * 0.1;
      camera.position.x = Math.sin(time) * 3;
      camera.position.y = Math.cos(time * 0.7) * 2;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();
    setIsLoaded(true);

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const createFluidField = () => {
    const fieldSize = 32;
    for (let i = 0; i < fieldSize * fieldSize * fieldSize; i++) {
      fluidFieldRef.current.push(new THREE.Vector3(0, 0, 0));
    }
  };

  const createAppNodes = () => {
    const nodes: AppNode[] = [];
    const radius = 25;
    const categories = ['social', 'commerce', 'finance', 'system', 'media', 'utility'];
    
    DORCE_APPS.forEach((app, index) => {
      const categoryIndex = categories.indexOf(app.category);
      const angle = (categoryIndex / categories.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const height = (Math.random() - 0.5) * 20;
      
      const position = new THREE.Vector3(
        Math.cos(angle) * radius + (Math.random() - 0.5) * 10,
        height,
        Math.sin(angle) * radius + (Math.random() - 0.5) * 10
      );

      nodes.push({
        ...app,
        position: position.clone(),
        originalPosition: position.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        mass: 1 + Math.random() * 2,
        connections: app.connections
      });
    });

    nodesRef.current = nodes;

    // Create node meshes
    nodes.forEach(node => {
      const geometry = new THREE.SphereGeometry(1.5, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.8,
        emissive: node.color,
        emissiveIntensity: 0.2
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(node.position);
      mesh.userData = { nodeId: node.id };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      if (sceneRef.current) {
        sceneRef.current.add(mesh);
      }
    });
  };

  const createFluidParticles = () => {
    const particles: FluidParticle[] = [];
    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? 800 : 2000; // Reduce particles on mobile for performance
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 200,
        size: Math.random() * 3 + 1,
        opacity: Math.random(),
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
      });
    }
    
    particlesRef.current = particles;

    // Create particle system
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    particles.forEach((particle, i) => {
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      colors[i * 3] = particle.color.r;
      colors[i * 3 + 1] = particle.color.g;
      colors[i * 3 + 2] = particle.color.b;
      
      sizes[i] = particle.size;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: isMobile ? 1.5 : 2, // Smaller particles on mobile
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(geometry, material);
    if (sceneRef.current) {
      sceneRef.current.add(points);
    }
  };

  const createNeuralConnections = () => {
    if (!sceneRef.current) return;
    
    nodesRef.current.forEach(node => {
      node.connections.forEach(connectionId => {
        const targetNode = nodesRef.current.find(n => n.id === connectionId);
        if (targetNode) {
          const curve = new THREE.QuadraticBezierCurve3(
            node.position,
            new THREE.Vector3(
              (node.position.x + targetNode.position.x) / 2,
              (node.position.y + targetNode.position.y) / 2 + 5,
              (node.position.z + targetNode.position.z) / 2
            ),
            targetNode.position
          );
          
          const points = curve.getPoints(50);
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          
          const material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.3
          });
          
          const line = new THREE.Line(geometry, material);
          line.userData = { source: node.id, target: connectionId };
          sceneRef.current!.add(line);
        }
      });
    });
  };

  const createCentralCore = () => {
    if (!sceneRef.current) return;
    
    const geometry = new THREE.IcosahedronGeometry(3, 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.8,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.5,
      wireframe: true
    });
    
    const core = new THREE.Mesh(geometry, material);
    core.userData = { isCore: true };
    sceneRef.current.add(core);
  };

  const updateFluidDynamics = () => {
    const time = timeRef.current;
    const mouse = mouseRef.current;
    
    // Update fluid field with Perlin noise and mouse interaction
    fluidFieldRef.current.forEach((field, index) => {
      const x = (index % 32) / 32 * 2 - 1;
      const y = (Math.floor(index / 32) % 32) / 32 * 2 - 1;
      const z = Math.floor(index / (32 * 32)) / 32 * 2 - 1;
      
      field.set(
        Math.sin(time + x * 3) * 0.5 + mouse.x * 0.3,
        Math.cos(time * 0.7 + y * 2) * 0.5 + mouse.y * 0.3,
        Math.sin(time * 0.5 + z * 4) * 0.2
      );
    });
  };

  const updateParticles = () => {
    if (!sceneRef.current) return;
    
    const particles = particlesRef.current;
    const points = sceneRef.current.children.find(child => child instanceof THREE.Points) as THREE.Points;
    if (!points) return;
    
    const positions = points.geometry.attributes.position.array as Float32Array;
    const colors = points.geometry.attributes.color.array as Float32Array;
    
    particles.forEach((particle, i) => {
      // Apply fluid dynamics
      const fieldIndex = Math.floor((particle.position.x + 50) / 100 * 32) +
                        Math.floor((particle.position.y + 50) / 100 * 32) * 32 +
                        Math.floor((particle.position.z + 50) / 100 * 32) * 32 * 32;
      
      if (fluidFieldRef.current[fieldIndex]) {
        particle.velocity.add(fluidFieldRef.current[fieldIndex].clone().multiplyScalar(0.1));
      }
      
      // Mouse attraction/repulsion
      const mouseWorld = new THREE.Vector3(mouseRef.current.x * 30, mouseRef.current.y * 30, 0);
      const distToMouse = particle.position.distanceTo(mouseWorld);
      if (distToMouse < 20) {
        const force = particle.position.clone().sub(mouseWorld).normalize().multiplyScalar(0.5 / (distToMouse + 1));
        particle.velocity.add(force);
      }
      
      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(0.1));
      particle.velocity.multiplyScalar(0.98); // Damping
      
      // Boundary conditions
      if (Math.abs(particle.position.x) > 50) particle.velocity.x *= -0.8;
      if (Math.abs(particle.position.y) > 50) particle.velocity.y *= -0.8;
      if (Math.abs(particle.position.z) > 50) particle.velocity.z *= -0.8;
      
      // Update life
      particle.life++;
      if (particle.life > particle.maxLife) {
        particle.life = 0;
        particle.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        );
        particle.velocity.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
      }
      
      // Update opacity based on life
      particle.opacity = Math.sin(particle.life / particle.maxLife * Math.PI) * 0.8;
      
      // Update geometry
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      const intensity = particle.opacity;
      colors[i * 3] = particle.color.r * intensity;
      colors[i * 3 + 1] = particle.color.g * intensity;
      colors[i * 3 + 2] = particle.color.b * intensity;
    });
    
    points.geometry.attributes.position.needsUpdate = true;
    points.geometry.attributes.color.needsUpdate = true;
  };

  const updateNodes = () => {
    if (!sceneRef.current) return;
    
    const time = timeRef.current;
    const mouse = mouseRef.current;
    
    nodesRef.current.forEach((node, index) => {
      const mesh = sceneRef.current!.children.find(child => 
        child instanceof THREE.Mesh && child.userData.nodeId === node.id
      ) as THREE.Mesh;
      
      if (!mesh) return;
      
      // Organic floating motion
      const floatX = Math.sin(time + index * 0.5) * 2;
      const floatY = Math.cos(time * 0.7 + index * 0.3) * 1.5;
      const floatZ = Math.sin(time * 0.5 + index * 0.7) * 1;
      
      node.position.set(
        node.originalPosition.x + floatX,
        node.originalPosition.y + floatY,
        node.originalPosition.z + floatZ
      );
      
      // Mouse interaction
      const mouseWorld = new THREE.Vector3(mouse.x * 30, mouse.y * 30, 0);
      const distToMouse = node.position.distanceTo(mouseWorld);
      
      if (distToMouse < 15) {
        const attraction = mouseWorld.clone().sub(node.position).normalize().multiplyScalar(0.1);
        node.position.add(attraction);
        
        // Scale effect
        const scale = 1 + (15 - distToMouse) / 30;
        mesh.scale.setScalar(scale);
      } else {
        mesh.scale.setScalar(1);
      }
      
      mesh.position.copy(node.position);
      
      // Rotation
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.007;
      
      // Material effects
      const material = mesh.material as THREE.MeshPhongMaterial;
      const intensity = 0.2 + Math.sin(time + index) * 0.1;
      material.emissiveIntensity = intensity;
    });
  };

  const updateNeuralConnections = () => {
    if (!sceneRef.current) return;
    
    const time = timeRef.current;
    
    sceneRef.current.children.forEach(child => {
      if (child instanceof THREE.Line && child.userData.source) {
        const material = child.material as THREE.LineBasicMaterial;
        const pulse = Math.sin(time * 2 + child.userData.source.length) * 0.3 + 0.3;
        material.opacity = pulse;
      }
    });
  };

  const updateCentralCore = () => {
    if (!sceneRef.current) return;
    
    const core = sceneRef.current.children.find(child => 
      child instanceof THREE.Mesh && child.userData.isCore
    ) as THREE.Mesh;
    
    if (!core) return;
    
    const time = timeRef.current;
    
    // Complex rotation
    core.rotation.x = time * 0.5;
    core.rotation.y = time * 0.3;
    core.rotation.z = time * 0.2;
    
    // Pulsing scale
    const scale = 1 + Math.sin(time * 3) * 0.2;
    core.scale.setScalar(scale);
    
    // Material effects
    const material = core.material as THREE.MeshPhongMaterial;
    const intensity = 0.5 + Math.sin(time * 4) * 0.3;
    material.emissiveIntensity = intensity;
    
    // Color shifting
    const hue = (time * 0.1) % 1;
    material.color.setHSL(hue, 0.8, 0.6);
    material.emissive.setHSL(hue, 0.8, 0.3);
  };

  const handleAppClick = (appId: string) => {
    const app = nodesRef.current.find(node => node.id === appId);
    if (app) {
      setSelectedApp(app);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-8">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              DORCE AI
            </h1>
            <p className="text-gray-300 mt-1 sm:mt-2 text-sm sm:text-base">The Operating System for Human Connection</p>
          </div>
          <div className="hidden sm:flex gap-2 sm:gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              Get Started
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="px-3 sm:px-6 py-2 sm:py-3 border border-gray-600 text-white rounded-full font-semibold hover:bg-gray-800 transition-all duration-300 text-sm sm:text-base"
            >
              Login
            </button>
          </div>
          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm"
            >
              Enter
            </button>
          </div>
        </div>
      </div>

      {/* App Details Panel */}
      {selectedApp && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-gray-900 bg-opacity-95 backdrop-blur-lg rounded-2xl p-4 sm:p-8 max-w-xs sm:max-w-md border border-gray-700 mx-4">
          <button 
            onClick={() => setSelectedApp(null)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-white text-xl sm:text-2xl"
          >
            ×
          </button>
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">{selectedApp.icon}</div>
            <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">{selectedApp.name}</h3>
            <span className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: selectedApp.color + '20', color: selectedApp.color }}>
              {selectedApp.category}
            </span>
          </div>
          <p className="text-gray-300 text-center mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
            {selectedApp.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              onClick={() => {
                setSelectedApp(null);
                router.push('/dashboard');
              }}
              className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm sm:text-base"
            >
              Launch App
            </button>
            <button 
              onClick={() => setSelectedApp(null)}
              className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {!isLoaded && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">⚡</div>
            <h2 className="text-2xl font-bold text-white mb-2">Initializing Neural Network</h2>
            <p className="text-gray-400">Connecting 69 apps in perfect harmony...</p>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="absolute top-16 sm:top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-lg rounded-full px-4 sm:px-8 py-2 sm:py-4 border border-gray-700">
          <div className="flex items-center gap-2 sm:gap-8">
            <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DORCE AI
            </div>
            <nav className="hidden sm:flex gap-4 sm:gap-6">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Dashboard
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Login
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Register
              </button>
            </nav>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm"
            >
              Enter OS
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Panel */}
      <div className="absolute top-32 sm:top-32 right-4 sm:right-8 z-20 hidden sm:block">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-gray-700 max-w-xs">
          <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-4">Quick Access</h3>
          <div className="space-y-2 sm:space-y-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              <span className="text-lg sm:text-xl">📊</span>
              <span className="text-gray-300">Dashboard</span>
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              <span className="text-lg sm:text-xl">🔐</span>
              <span className="text-gray-300">Login</span>
            </button>
            <button 
              onClick={() => router.push('/register')}
              className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              <span className="text-lg sm:text-xl">📝</span>
              <span className="text-gray-300">Register</span>
            </button>
            <div className="border-t border-gray-700 pt-2 sm:pt-3 mt-2 sm:mt-3">
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm"
              >
                Explore Full OS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-10 text-white">
        <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-lg p-3 sm:p-4 max-w-xs sm:max-w-sm">
          <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">How to Explore</h4>
          <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
            <li>• Move your mouse to influence the particle flow</li>
            <li>• Apps are organized by category and color</li>
            <li>• Click on any app to learn more</li>
            <li>• Use navigation to access full OS features</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 z-10 text-white">
        <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-300">
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>Connected Apps:</span>
              <span className="font-bold text-blue-400">69</span>
            </div>
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>Neural Connections:</span>
              <span className="font-bold text-purple-400">500+</span>
            </div>
            <div className="flex justify-between">
              <span>Fluid Particles:</span>
              <span className="font-bold text-green-400">2,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}