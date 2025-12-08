'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  mesh?: THREE.Mesh;
  pulsePhase: number;
}

interface FluidParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: THREE.Color;
  originalColor: THREE.Color;
}

interface NeuralConnection {
  source: string;
  target: string;
  line: THREE.Line;
  pulsePhase: number;
  energy: number;
}

// Complete 69 Dorce.ai Apps - Systematically Organized
const DORCE_APPS: Omit<AppNode, 'position' | 'originalPosition' | 'velocity' | 'mesh' | 'pulsePhase' | 'mass'>[] = [
  // 🌐 SOCIAL & COMMUNICATION (Red/Pink) - 8 Apps
  { id: 'community', name: 'Community Forums', description: 'Connect with like-minded individuals and build meaningful relationships through discussion', category: 'social', icon: '💬', color: '#FF6B6B', connections: ['social-feed', 'event-planner', 'file-sharing'] },
  { id: 'social-feed', name: 'Social Feed', description: 'Stay updated with your network\'s activities and share your moments', category: 'social', icon: '📱', color: '#FF8E8E', connections: ['video-calls', 'chat-messenger', 'community'] },
  { id: 'video-calls', name: 'Video Calls', description: 'Crystal-clear video conversations with anyone, anywhere in the world', category: 'social', icon: '📹', color: '#FF4757', connections: ['voice-messages', 'group-messenger'] },
  { id: 'chat-messenger', name: 'Chat Messenger', description: 'Instant messaging with end-to-end encryption for private conversations', category: 'social', icon: '💭', color: '#FF3838', connections: ['group-messenger', 'voice-messages'] },
  { id: 'voice-messages', name: 'Voice Messages', description: 'Send quick voice notes when text isn\'t enough to express yourself', category: 'social', icon: '🎤', color: '#FF6B9D', connections: ['file-sharing'] },
  { id: 'group-messenger', name: 'Group Messenger', description: 'Create communities and collaborate with teams in organized spaces', category: 'social', icon: '👥', color: '#FF8E53', connections: ['event-planner', 'file-sharing'] },
  { id: 'file-sharing', name: 'File Sharing', description: 'Share any file type securely with advanced encryption and access controls', category: 'social', icon: '📁', color: '#FF9FF3', connections: ['community', 'event-planner'] },
  { id: 'event-planner', name: 'Event Planner', description: 'Organize and manage events from small gatherings to large conferences', category: 'social', icon: '🗓️', color: '#FF6B9D', connections: ['community', 'group-messenger'] },

  // 🛍️ COMMERCE & MARKETPLACE (Purple) - 12 Apps
  { id: 'subscription-store', name: 'Subscription Store', description: 'Discover and subscribe to premium services tailored to your needs', category: 'commerce', icon: '🛍️', color: '#A55EEA', connections: ['digital-marketplace', 'deal-finder', 'insurance-portal'] },
  { id: 'digital-marketplace', name: 'Digital Marketplace', description: 'Buy and sell digital products with secure transactions and instant delivery', category: 'commerce', icon: '🏪', color: '#8854D0', connections: ['product-catalog', 'vendor-portal', 'subscription-store'] },
  { id: 'deal-finder', name: 'Deal Finder', description: 'Automatically discover the best deals and discounts across the internet', category: 'commerce', icon: '🏷️', color: '#7C4DFF', connections: ['price-tracker', 'recommendation-ai', 'digital-marketplace'] },
  { id: 'price-tracker', name: 'Price Tracker', description: 'Monitor product prices and get notified when they drop to your target', category: 'commerce', icon: '📊', color: '#6C5CE7', connections: ['review-system', 'deal-finder'] },
  { id: 'review-system', name: 'Review System', description: 'Make informed decisions with authentic user reviews and ratings', category: 'commerce', icon: '⭐', color: '#5F3DC4', connections: ['shopping-cart', 'price-tracker'] },
  { id: 'recommendation-ai', name: 'Recommendation AI', description: 'Get personalized suggestions powered by advanced machine learning', category: 'commerce', icon: '🎯', color: '#7048E8', connections: ['inventory-system', 'deal-finder'] },
  { id: 'vendor-portal', name: 'Vendor Portal', description: 'Manage your products, orders, and customer relationships in one place', category: 'commerce', icon: '🏢', color: '#5C7CFA', connections: ['inventory-system', 'customer-support', 'digital-marketplace'] },
  { id: 'inventory-system', name: 'Inventory System', description: 'Track stock levels, manage suppliers, and optimize your supply chain', category: 'commerce', icon: '📦', color: '#4C6EF5', connections: ['order-manager', 'vendor-portal', 'recommendation-ai'] },
  { id: 'product-catalog', name: 'Product Catalog', description: 'Browse comprehensive product information with rich media and details', category: 'commerce', icon: '📖', color: '#339AF0', connections: ['shopping-cart', 'digital-marketplace'] },
  { id: 'shopping-cart', name: 'Shopping Cart', description: 'Seamless checkout experience with multiple payment options', category: 'commerce', icon: '🛒', color: '#228BE6', connections: ['order-manager', 'product-catalog', 'review-system'] },
  { id: 'order-manager', name: 'Order Manager', description: 'Track orders, manage returns, and handle customer inquiries efficiently', category: 'commerce', icon: '📋', color: '#1C7ED6', connections: ['customer-support', 'shopping-cart', 'inventory-system'] },
  { id: 'customer-support', name: 'Customer Support', description: '24/7 assistance with AI-powered help and human experts when needed', category: 'commerce', icon: '🎧', color: '#1971C2', connections: ['insurance-portal', 'order-manager', 'vendor-portal'] },
  { id: 'insurance-portal', name: 'Insurance Portal', description: 'Compare and purchase insurance plans with transparent pricing', category: 'commerce', icon: '🛡️', color: '#1864AB', connections: ['subscription-store', 'customer-support'] },

  // 💰 FINANCE & ANALYTICS (Green/Teal) - 7 Apps
  { id: 'data-analyzer', name: 'Data Analyzer', description: 'Transform raw data into actionable insights with powerful analytics', category: 'finance', icon: '🔍', color: '#51CF66', connections: ['investment-hub', 'budget-tracker', 'loan-platform'] },
  { id: 'investment-hub', name: 'Investment Hub', description: 'Manage your portfolio and make informed investment decisions', category: 'finance', icon: '📈', color: '#40C057', connections: ['payment-gateway', 'crypto-wallet', 'data-analyzer'] },
  { id: 'budget-tracker', name: 'Budget Tracker', description: 'Take control of your finances with intelligent spending analysis', category: 'finance', icon: '📒', color: '#37B24D', connections: ['savings-manager', 'digital-wallet', 'data-analyzer'] },
  { id: 'savings-manager', name: 'Savings Manager', description: 'Set financial goals and watch your savings grow with automated tools', category: 'finance', icon: '🐷', color: '#2F9E44', connections: ['loan-platform', 'budget-tracker'] },
  { id: 'payment-gateway', name: 'Payment Gateway', description: 'Secure payment processing with fraud protection and instant confirmation', category: 'finance', icon: '🏦', color: '#27AE60', connections: ['crypto-wallet', 'investment-hub'] },
  { id: 'crypto-wallet', name: 'Crypto Wallet', description: 'Manage cryptocurrencies with military-grade security and easy transactions', category: 'finance', icon: '💎', color: '#219A52', connections: ['digital-wallet', 'payment-gateway'] },
  { id: 'digital-wallet', name: 'Digital Wallet', description: 'All your payment methods in one secure, convenient place', category: 'finance', icon: '💳', color: '#1E874B', connections: ['loan-platform', 'crypto-wallet', 'budget-tracker'] },
  { id: 'loan-platform', name: 'Loan Platform', description: 'Access competitive loan rates and manage your borrowing intelligently', category: 'finance', icon: '🏛️', color: '#1A7431', connections: ['data-analyzer', 'digital-wallet'] },

  // ⚙️ OS & SYSTEM (Blue) - 10 Apps
  { id: 'os-kernel', name: 'OS Kernel', description: 'The powerful core that orchestrates all system operations seamlessly', category: 'system', icon: '⚙️', color: '#339AF0', connections: ['window-manager', 'process-manager', 'security-layer'] },
  { id: 'window-manager', name: 'Window Manager', description: 'Intuitive multi-window interface for efficient multitasking and organization', category: 'system', icon: '🪟', color: '#228BE6', connections: ['security-layer', 'file-system', 'os-kernel'] },
  { id: 'process-manager', name: 'Process Manager', description: 'Monitor and optimize system performance with real-time insights', category: 'system', icon: '🔧', color: '#1C7ED6', connections: ['network-stack', 'boot-loader', 'os-kernel'] },
  { id: 'security-layer', name: 'Security Layer', description: 'Enterprise-grade protection with advanced encryption and threat detection', category: 'system', icon: '🛡️', color: '#1971C2', connections: ['file-system', 'memory-manager', 'window-manager'] },
  { id: 'file-system', name: 'File System', description: 'Intelligent file organization with smart categorization and search', category: 'system', icon: '📁', color: '#1864AB', connections: ['task-scheduler', 'security-layer', 'window-manager'] },
  { id: 'network-stack', name: 'Network Stack', description: 'Lightning-fast connectivity with automatic optimization', category: 'system', icon: '🌐', color: '#1742A1', connections: ['system-monitor', 'process-manager'] },
  { id: 'boot-loader', name: 'Boot Loader', description: 'Lightning-fast system startup with intelligent resource allocation', category: 'system', icon: '🚀', color: '#152C7B', connections: ['memory-manager', 'process-manager'] },
  { id: 'memory-manager', name: 'Memory Manager', description: 'Efficient memory allocation for optimal performance across all apps', category: 'system', icon: '💾', color: '#141E61', connections: ['task-scheduler', 'security-layer', 'boot-loader'] },
  { id: 'task-scheduler', name: 'Task Scheduler', description: 'Automate repetitive tasks and optimize your workflow efficiency', category: 'system', icon: '📅', color: '#122F5E', connections: ['system-monitor', 'file-system', 'memory-manager'] },
  { id: 'system-monitor', name: 'System Monitor', description: 'Real-time system health monitoring with predictive maintenance alerts', category: 'system', icon: '📺', color: '#0F1B3C', connections: ['os-kernel', 'network-stack', 'task-scheduler'] },

  // 🎬 MEDIA & CONTENT (Orange/Yellow) - 13 Apps
  { id: 'music-player', name: 'Music Player', description: 'Immersive audio experience with intelligent playlist curation', category: 'media', icon: '🎵', color: '#FF9500', connections: ['photo-gallery', 'video-editor', 'radio-tuner'] },
  { id: 'photo-gallery', name: 'Photo Gallery', description: 'Organize, edit, and share your visual memories with AI enhancement', category: 'media', icon: '📸', color: '#FF8C00', connections: ['video-editor', 'live-streamer', 'music-player'] },
  { id: 'video-editor', name: 'Video Editor', description: 'Professional video editing with AI-powered tools and effects', category: 'media', icon: '🎬', color: '#FF8200', connections: ['game-center', 'ebook-reader', 'photo-gallery'] },
  { id: 'game-center', name: 'Game Center', description: 'Discover and play games with social features and achievements', category: 'media', icon: '🎮', color: '#FF7800', connections: ['radio-tuner', 'live-streamer', 'video-editor'] },
  { id: 'live-streamer', name: 'Live Streamer', description: 'Broadcast your content to the world with professional quality', category: 'media', icon: '📡', color: '#FF6E00', connections: ['password-manager', 'photo-gallery', 'game-center'] },
  { id: 'ebook-reader', name: 'E-book Reader', description: 'Immersive reading experience with smart annotations and sync', category: 'media', icon: '📚', color: '#FF6400', connections: ['barcode-scanner', 'video-editor'] },
  { id: 'radio-tuner', name: 'Radio Tuner', description: 'Access global radio stations with crystal-clear digital quality', category: 'media', icon: '📻', color: '#FF5A00', connections: ['password-manager', 'music-player', 'game-center'] },
  { id: 'password-manager', name: 'Password Manager', description: 'Secure password storage with biometric authentication', category: 'media', icon: '🔑', color: '#FF5000', connections: ['barcode-scanner', 'radio-tuner', 'live-streamer'] },
  { id: 'barcode-scanner', name: 'Barcode Scanner', description: 'Instant product information with price comparison and reviews', category: 'media', icon: '📋', color: '#FF4600', connections: ['reminders', 'ebook-reader', 'password-manager'] },
  { id: 'reminders', name: 'Reminders', description: 'Smart task management with location-based notifications', category: 'media', icon: '📝', color: '#FF3C00', connections: ['calculator', 'barcode-scanner'] },
  { id: 'calculator', name: 'Calculator', description: 'Advanced calculations with unit conversions and history', category: 'media', icon: '🧮', color: '#FF3200', connections: ['unit-converter', 'reminders'] },
  { id: 'unit-converter', name: 'Unit Converter', description: 'Convert between any units with real-time calculations', category: 'media', icon: '⚖️', color: '#FF2800', connections: ['color-picker', 'calculator'] },
  { id: 'color-picker', name: 'Color Picker', description: 'Professional color tools with palette generation and harmony', category: 'media', icon: '🎨', color: '#FF1E00', connections: ['music-player', 'unit-converter'] },

  // 🛠️ UTILITIES & TOOLS (Cyan/Blue) - 5 Apps
  { id: 'weather-app', name: 'Weather App', description: 'Accurate weather forecasts with hyper-local precision and alerts', category: 'utility', icon: '🌤️', color: '#74C0FC', connections: ['calendar', 'transit', 'status-update'] },
  { id: 'calendar', name: 'Calendar', description: 'Intelligent scheduling with conflict resolution and smart suggestions', category: 'utility', icon: '📅', color: '#4DABF7', connections: ['transit', 'notes', 'weather-app'] },
  { id: 'transit', name: 'Transit', description: 'Real-time public transport information with optimal route planning', category: 'utility', icon: '🚌', color: '#339AF0', connections: ['notes', 'status-update', 'calendar'] },
  { id: 'notes', name: 'Notes', description: 'Capture ideas instantly with rich formatting and organization', category: 'utility', icon: '📝', color: '#228BE6', connections: ['status-update', 'transit'] },
  { id: 'status-update', name: 'Status Update', description: 'Keep your network informed about your availability and activities', category: 'utility', icon: '📢', color: '#1C7ED6', connections: ['weather-app', 'notes'] }
];

export default function RevolutionaryLandingComplete() {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const nodesRef = useRef<AppNode[]>([]);
  const particlesRef = useRef<FluidParticle[]>([]);
  const connectionsRef = useRef<NeuralConnection[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppNode | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0, worldX: 0, worldY: 0 });
  const timeRef = useRef(0);
  const fluidFieldRef = useRef<THREE.Vector3[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const centralCoreRef = useRef<THREE.Mesh | null>(null);

  // System parameters for revolutionary experience
  const PARTICLE_COUNT = 3000;
  const FLUID_FIELD_SIZE = 40;
  const NEURAL_PULSE_SPEED = 0.02;
  const MOUSE_INFLUENCE_RADIUS = 25;
  const ORGANIC_MOTION_SCALE = 2.5;

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('🚀 Initializing Revolutionary 69-App Neural Network...');

    // Scene setup with atmospheric background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    sceneRef.current = scene;

    // Camera setup with dynamic positioning
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 60);
    cameraRef.current = camera;

    // Renderer setup with advanced features
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Advanced lighting system
    setupLighting(scene);

    // Create revolutionary systems
    createFluidField();
    createAppNodes();
    createFluidParticles();
    createNeuralConnections();
    createCentralCore();

    // Mouse interaction system
    setupMouseInteraction();

    // Start animation loop
    animate();
    setIsLoaded(true);

    console.log('✅ Revolutionary 69-App System Initialized!');

    // Cleanup
    return () => {
      cleanup();
    };
  }, []);

  const setupLighting = (scene: THREE.Scene) => {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // Dynamic directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Point lights for dramatic effect
    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.8, 100);
    pointLight1.position.set(0, 0, 30);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff6b6b, 0.6, 80);
    pointLight2.position.set(-30, 20, 20);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x51cf66, 0.6, 80);
    pointLight3.position.set(30, -20, 20);
    scene.add(pointLight3);
  };

  const createFluidField = () => {
    const fieldSize = FLUID_FIELD_SIZE;
    for (let i = 0; i < fieldSize * fieldSize * fieldSize; i++) {
      fluidFieldRef.current.push(new THREE.Vector3(0, 0, 0));
    }
  };

  const createAppNodes = () => {
    const nodes: AppNode[] = [];
    const radius = 35;
    const categories = ['social', 'commerce', 'finance', 'system', 'media', 'utility'];
    
    // Create nodes with organic positioning
    DORCE_APPS.forEach((app, index) => {
      const categoryIndex = categories.indexOf(app.category);
      const baseAngle = (categoryIndex / categories.length) * Math.PI * 2;
      const angleVariation = (Math.random() - 0.5) * 0.8;
      const angle = baseAngle + angleVariation;
      
      const heightVariation = (Math.random() - 0.5) * 25;
      const radiusVariation = radius + (Math.random() - 0.5) * 15;
      
      const position = new THREE.Vector3(
        Math.cos(angle) * radiusVariation,
        heightVariation,
        Math.sin(angle) * radiusVariation
      );

      const node: AppNode = {
        ...app,
        position: position.clone(),
        originalPosition: position.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        mass: 1 + Math.random() * 2,
        connections: app.connections,
        pulsePhase: Math.random() * Math.PI * 2
      };

      nodes.push(node);
    });

    nodesRef.current = nodes;

    // Create sophisticated node meshes
    nodes.forEach((node, index) => {
      createNodeMesh(node, index);
    });
  };

  const createNodeMesh = (node: AppNode, index: number) => {
    if (!sceneRef.current) return;

    // Create complex geometry based on category
    let geometry: THREE.BufferGeometry;
    
    switch (node.category) {
      case 'social':
        geometry = new THREE.SphereGeometry(2.5, 32, 32);
        break;
      case 'commerce':
        geometry = new THREE.BoxGeometry(4, 4, 4);
        break;
      case 'finance':
        geometry = new THREE.OctahedronGeometry(3);
        break;
      case 'system':
        geometry = new THREE.TetrahedronGeometry(3.5);
        break;
      case 'media':
        geometry = new THREE.CylinderGeometry(2, 2, 5, 16);
        break;
      default:
        geometry = new THREE.IcosahedronGeometry(3);
    }

    // Advanced material with emissive properties
    const material = new THREE.MeshPhongMaterial({
      color: node.color,
      transparent: true,
      opacity: 0.85,
      emissive: node.color,
      emissiveIntensity: 0.3,
      shininess: 100,
      specular: 0x444444
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(node.position);
    mesh.userData = { nodeId: node.id, originalColor: node.color };
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add pulsing effect
    mesh.userData.pulsePhase = node.pulsePhase;
    
    sceneRef.current.add(mesh);
    node.mesh = mesh;
  };

  const createFluidParticles = () => {
    const particles: FluidParticle[] = [];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 0.7, 0.6);
      
      particles.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 120
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        ),
        life: Math.random() * 200,
        maxLife: 150 + Math.random() * 300,
        size: Math.random() * 4 + 1,
        opacity: Math.random(),
        color: color,
        originalColor: color.clone()
      });
    }
    
    particlesRef.current = particles;

    // Create particle system with advanced rendering
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    
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
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const points = new THREE.Points(geometry, material);
    if (sceneRef.current) {
      sceneRef.current.add(points);
    }
  };

  const createNeuralConnections = () => {
    if (!sceneRef.current) return;
    
    const connections: NeuralConnection[] = [];
    
    nodesRef.current.forEach(node => {
      node.connections.forEach(connectionId => {
        const targetNode = nodesRef.current.find(n => n.id === connectionId);
        if (targetNode) {
          // Create curved connection with energy flow
          const midPoint = new THREE.Vector3(
            (node.position.x + targetNode.position.x) / 2,
            (node.position.y + targetNode.position.y) / 2 + 8,
            (node.position.z + targetNode.position.z) / 2
          );
          
          const curve = new THREE.QuadraticBezierCurve3(
            node.position,
            midPoint,
            targetNode.position
          );
          
          const points = curve.getPoints(100);
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          
          // Advanced line material with glow effect
          const material = new THREE.LineBasicMaterial({
            color: new THREE.Color().lerpColors(
              new THREE.Color(node.color),
              new THREE.Color(targetNode.color),
              0.5
            ),
            transparent: true,
            opacity: 0.4,
            linewidth: 3
          });
          
          const line = new THREE.Line(geometry, material);
          line.userData = { source: node.id, target: connectionId };
          
          const connection: NeuralConnection = {
            source: node.id,
            target: connectionId,
            line,
            pulsePhase: Math.random() * Math.PI * 2,
            energy: Math.random() * 0.5 + 0.5
          };
          
          sceneRef.current!.add(line);
          connections.push(connection);
        }
      });
    });
    
    connectionsRef.current = connections;
  };

  const createCentralCore = () => {
    if (!sceneRef.current) return;
    
    // Create complex central core
    const geometry = new THREE.IcosahedronGeometry(5, 3);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.7,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.8,
      wireframe: false,
      shininess: 200
    });
    
    const core = new THREE.Mesh(geometry, material);
    core.userData = { isCore: true, baseScale: 1 };
    core.castShadow = true;
    core.receiveShadow = true;
    
    sceneRef.current.add(core);
    centralCoreRef.current = core;
  };

  const setupMouseInteraction = () => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Convert to world coordinates
      const vector = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5);
      vector.unproject(cameraRef.current!);
      const dir = vector.sub(cameraRef.current!.position).normalize();
      const distance = -cameraRef.current!.position.z / dir.z;
      const pos = cameraRef.current!.position.clone().add(dir.multiplyScalar(distance));
      
      mouseRef.current.worldX = pos.x;
      mouseRef.current.worldY = pos.y;
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Click handling for app selection
    const handleClick = (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return;
      
      raycasterRef.current.setFromCamera(
        new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
        cameraRef.current
      );
      
      const intersects = raycasterRef.current.intersectObjects(
        sceneRef.current.children.filter(child => child.userData.nodeId)
      );
      
      if (intersects.length > 0) {
        const clickedNodeId = intersects[0].object.userData.nodeId;
        const node = nodesRef.current.find(n => n.id === clickedNodeId);
        if (node) {
          setSelectedApp(node);
        }
      }
    };

    window.addEventListener('click', handleClick);

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  };

  const animate = () => {
    timeRef.current += 0.016;
    
    updateFluidDynamics();
    updateParticles();
    updateNodes();
    updateNeuralConnections();
    updateCentralCore();
    updateCamera();
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    animationIdRef.current = requestAnimationFrame(animate);
  };

  const updateFluidDynamics = () => {
    const time = timeRef.current;
    const mouse = mouseRef.current;
    
    fluidFieldRef.current.forEach((field, index) => {
      const x = (index % FLUID_FIELD_SIZE) / FLUID_FIELD_SIZE * 2 - 1;
      const y = (Math.floor(index / FLUID_FIELD_SIZE) % FLUID_FIELD_SIZE) / FLUID_FIELD_SIZE * 2 - 1;
      const z = Math.floor(index / (FLUID_FIELD_SIZE * FLUID_FIELD_SIZE)) / FLUID_FIELD_SIZE * 2 - 1;
      
      // Complex fluid dynamics with Perlin noise and mouse interaction
      const noiseX = Math.sin(time * 0.5 + x * 4) * Math.cos(time * 0.3 + y * 3);
      const noiseY = Math.cos(time * 0.4 + y * 3) * Math.sin(time * 0.6 + z * 2);
      const noiseZ = Math.sin(time * 0.3 + z * 2) * Math.cos(time * 0.5 + x * 4);
      
      // Mouse influence on fluid field
      const mouseInfluence = Math.exp(-((x - mouse.worldX * 0.01) ** 2 + (y - mouse.worldY * 0.01) ** 2) * 10);
      
      field.set(
        noiseX * 0.8 + mouseInfluence * mouse.worldX * 0.02,
        noiseY * 0.8 + mouseInfluence * mouse.worldY * 0.02,
        noiseZ * 0.6 + Math.sin(time * 0.2) * 0.1
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
      const fieldX = Math.floor((particle.position.x + 60) / 120 * FLUID_FIELD_SIZE);
      const fieldY = Math.floor((particle.position.y + 60) / 120 * FLUID_FIELD_SIZE);
      const fieldZ = Math.floor((particle.position.z + 60) / 120 * FLUID_FIELD_SIZE);
      
      const fieldIndex = fieldX + fieldY * FLUID_FIELD_SIZE + fieldZ * FLUID_FIELD_SIZE * FLUID_FIELD_SIZE;
      
      if (fluidFieldRef.current[fieldIndex]) {
        particle.velocity.add(fluidFieldRef.current[fieldIndex].clone().multiplyScalar(0.15));
      }
      
      // Mouse attraction/repulsion with distance-based force
      const mouseWorld = new THREE.Vector3(mouseRef.current.worldX, mouseRef.current.worldY, 0);
      const distToMouse = particle.position.distanceTo(mouseWorld);
      
      if (distToMouse < MOUSE_INFLUENCE_RADIUS) {
        const attractionForce = 0.3;
        const force = mouseWorld.clone().sub(particle.position).normalize().multiplyScalar(attractionForce / (distToMouse + 1));
        particle.velocity.add(force);
      }
      
      // Update position with velocity damping
      particle.position.add(particle.velocity.clone().multiplyScalar(0.12));
      particle.velocity.multiplyScalar(0.96); // Damping
      
      // Boundary conditions with soft bounce
      const boundary = 60;
      if (Math.abs(particle.position.x) > boundary) {
        particle.velocity.x *= -0.7;
        particle.position.x = Math.sign(particle.position.x) * boundary;
      }
      if (Math.abs(particle.position.y) > boundary) {
        particle.velocity.y *= -0.7;
        particle.position.y = Math.sign(particle.position.y) * boundary;
      }
      if (Math.abs(particle.position.z) > boundary) {
        particle.velocity.z *= -0.7;
        particle.position.z = Math.sign(particle.position.z) * boundary;
      }
      
      // Update life cycle
      particle.life++;
      if (particle.life > particle.maxLife) {
        // Respawn particle
        particle.life = 0;
        particle.position.set(
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 120
        );
        particle.velocity.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        );
      }
      
      // Update opacity and color based on life
      const lifeRatio = particle.life / particle.maxLife;
      particle.opacity = Math.sin(lifeRatio * Math.PI) * 0.8;
      
      // Color shifting over lifetime
      const hueShift = (timeRef.current * 0.1 + i * 0.01) % 1;
      particle.color.setHSL(hueShift, 0.7, 0.6);
      
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
      if (!node.mesh) return;
      
      // Organic floating motion with multiple frequencies
      const floatX = Math.sin(time * 0.5 + index * 0.3) * ORGANIC_MOTION_SCALE;
      const floatY = Math.cos(time * 0.7 + index * 0.2) * ORGANIC_MOTION_SCALE * 0.8;
      const floatZ = Math.sin(time * 0.4 + index * 0.4) * ORGANIC_MOTION_SCALE * 0.6;
      
      node.position.set(
        node.originalPosition.x + floatX,
        node.originalPosition.y + floatY,
        node.originalPosition.z + floatZ
      );
      
      // Mouse interaction with magnetic effect
      const mouseWorld = new THREE.Vector3(mouse.worldX, mouse.worldY, 0);
      const distToMouse = node.position.distanceTo(mouseWorld);
      
      if (distToMouse < MOUSE_INFLUENCE_RADIUS) {
        const magneticForce = (MOUSE_INFLUENCE_RADIUS - distToMouse) / MOUSE_INFLUENCE_RADIUS;
        const attraction = mouseWorld.clone().sub(node.position).normalize().multiplyScalar(magneticForce * 0.2);
        node.position.add(attraction);
        
        // Scale and glow effect
        const scale = 1 + magneticForce * 0.4;
        node.mesh.scale.setScalar(scale);
        
        // Enhanced emissive effect
        const material = node.mesh.material as THREE.MeshPhongMaterial;
        material.emissiveIntensity = 0.3 + magneticForce * 0.7;
      } else {
        node.mesh.scale.setScalar(1);
        const material = node.mesh.material as THREE.MeshPhongMaterial;
        material.emissiveIntensity = 0.2;
      }
      
      node.mesh.position.copy(node.position);
      
      // Complex rotation patterns
      node.mesh.rotation.x += 0.003 * (1 + index * 0.01);
      node.mesh.rotation.y += 0.005 * (1 + index * 0.02);
      node.mesh.rotation.z += 0.002 * (1 + index * 0.015);
      
      // Pulsing effect
      node.pulsePhase += 0.02;
      const pulseIntensity = Math.sin(node.pulsePhase) * 0.1 + 0.9;
      const material = node.mesh.material as THREE.MeshPhongMaterial;
      material.emissiveIntensity *= pulseIntensity;
    });
  };

  const updateNeuralConnections = () => {
    if (!sceneRef.current) return;
    
    const time = timeRef.current;
    
    connectionsRef.current.forEach(connection => {
      const material = connection.line.material as THREE.LineBasicMaterial;
      
      // Advanced pulsing with energy flow
      connection.pulsePhase += NEURAL_PULSE_SPEED;
      const basePulse = Math.sin(connection.pulsePhase) * 0.3 + 0.4;
      const energyPulse = Math.sin(connection.pulsePhase * 1.5) * 0.2;
      
      material.opacity = basePulse + energyPulse;
      
      // Color shifting based on energy
      const energyLevel = connection.energy + Math.sin(time * 2) * 0.1;
      const hue = (time * 0.05 + connection.pulsePhase * 0.1) % 1;
      material.color.setHSL(hue, 0.8, 0.5 + energyLevel * 0.3);
    });
  };

  const updateCentralCore = () => {
    if (!centralCoreRef.current) return;
    
    const time = timeRef.current;
    const core = centralCoreRef.current;
    
    // Multi-axis rotation
    core.rotation.x = time * 0.3;
    core.rotation.y = time * 0.4;
    core.rotation.z = time * 0.2;
    
    // Complex pulsing with multiple frequencies
    const pulse1 = Math.sin(time * 4) * 0.15;
    const pulse2 = Math.sin(time * 6) * 0.08;
    const scale = 1 + pulse1 + pulse2;
    core.scale.setScalar(scale);
    
    // Advanced material effects
    const material = core.material as THREE.MeshPhongMaterial;
    const intensity = 0.5 + Math.sin(time * 5) * 0.4 + Math.sin(time * 8) * 0.2;
    material.emissiveIntensity = intensity;
    
    // Dynamic color shifting
    const hue = (time * 0.15) % 1;
    material.color.setHSL(hue, 0.9, 0.6);
    material.emissive.setHSL(hue, 0.9, 0.4);
  };

  const updateCamera = () => {
    if (!cameraRef.current) return;
    
    const time = timeRef.current;
    
    // Smooth orbital camera movement
    const radius = 60;
    const height = Math.sin(time * 0.1) * 10;
    const angle = time * 0.05;
    
    cameraRef.current.position.x = Math.cos(angle) * radius + Math.sin(time * 0.3) * 5;
    cameraRef.current.position.y = height + Math.cos(time * 0.2) * 8;
    cameraRef.current.position.z = Math.sin(angle) * radius + Math.cos(time * 0.4) * 5;
    
    cameraRef.current.lookAt(0, 0, 0);
  };

  const handleAppClick = (appId: string) => {
    const app = nodesRef.current.find(node => node.id === appId);
    if (app) {
      setSelectedApp(app);
    }
  };

  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      
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
          <h4 className="font-semibold mb-4 text-xl">🎮 How to Explore the Neural Network</h4>
          <ul className="text-sm text-gray-300 space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-blue-400">🖱️</span>
              <span>Move your mouse to influence the 3D particle flow</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-purple-400">📱</span>
              <span>69 apps are organized by category and color</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">👆</span>
              <span>Click on any app sphere to learn more</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-yellow-400">🚀</span>
              <span>Use navigation to access full OS features</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Revolutionary Stats Dashboard */}
      <div className="absolute bottom-8 right-8 z-10 text-white">
        <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-xl p-6">
          <h4 className="font-semibold mb-4 text-lg">🧠 Neural Network Stats</h4>
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
              <span>Fluid Particles:</span>
              <span className="font-bold text-green-400 text-lg">3,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Network Status:</span>
              <span className="font-bold text-yellow-400 text-lg">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Screen with Progress */}
      {!isLoaded && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-8 animate-pulse">🧠</div>
            <h2 className="text-4xl font-bold text-white mb-4">Initializing Neural Network</h2>
            <p className="text-gray-400 text-xl mb-8">Connecting 69 apps in perfect harmony...</p>
            <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
            <p className="text-gray-500 mt-4">Loading advanced 3D visualization...</p>
          </div>
        </div>
      )}
    </div>
  );
}