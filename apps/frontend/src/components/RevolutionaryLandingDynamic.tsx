'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Dynamically load Three.js to avoid build issues
export default function RevolutionaryLandingDynamic() {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    console.log('🚀 Starting dynamic Three.js load...');
    
    const loadThreeJSScene = async () => {
      try {
        // Dynamically import Three.js
        const THREE = await import('three');
        console.log('✅ Three.js loaded:', THREE);
        
        if (!mountRef.current) {
          console.error('❌ Mount ref not found');
          return;
        }

        // Create basic Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        mountRef.current.appendChild(renderer.domElement);

        // Add some basic geometry
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        camera.position.z = 5;

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
          
          renderer.render(scene, camera);
        };

        animate();
        setThreeLoaded(true);
        setIsLoading(false);
        
        console.log('✅ Basic Three.js scene created');

        // Handle resize
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };

      } catch (err) {
        console.error('❌ Failed to load Three.js scene:', err);
        setError(err instanceof Error ? err.message : 'Failed to load 3D scene');
        setIsLoading(false);
      }
    };

    // Add delay to ensure DOM is ready
    const timer = setTimeout(() => {
      loadThreeJSScene();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center p-8 bg-gray-900 rounded-xl">
            <h1 className="text-4xl font-bold text-red-400 mb-4">❌ 3D Scene Error</h1>
            <p className="text-gray-300 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Three.js Mount Point */}
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">⚡</div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading 3D Experience</h2>
            <p className="text-gray-400">Initializing Three.js engine...</p>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-8">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DORCE AI
            </h1>
            <p className="text-gray-300 mt-2">The Operating System for Human Connection</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Get Started
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-3 border border-gray-600 text-white rounded-full font-semibold hover:bg-gray-800 transition-all duration-300"
            >
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-lg rounded-full px-8 py-4 border border-gray-700">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DORCE AI
            </div>
            <nav className="flex gap-6">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Register
              </button>
            </nav>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Enter OS
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Panel */}
      <div className="absolute top-32 right-8 z-20">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 max-w-xs">
          <h3 className="text-lg font-bold text-white mb-4">Quick Access</h3>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-xl">📊</span>
              <span className="text-gray-300">Dashboard</span>
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-xl">🔐</span>
              <span className="text-gray-300">Login</span>
            </button>
            <button 
              onClick={() => router.push('/register')}
              className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-xl">📝</span>
              <span className="text-gray-300">Register</span>
            </button>
            <div className="border-t border-gray-700 pt-3 mt-3">
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                Explore Full OS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-8 z-10 text-white">
        <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-lg p-4 max-w-sm">
          <h4 className="font-semibold mb-2">How to Explore</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Move your mouse to influence the 3D scene</li>
            <li>• Use navigation to access full OS features</li>
            <li>• Click buttons to explore Dorce.ai</li>
            <li>• Experience the revolutionary interface</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-8 right-8 z-10 text-white">
        <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-lg p-4">
          <div className="text-sm text-gray-300">
            <div className="flex justify-between mb-2">
              <span>Connected Apps:</span>
              <span className="font-bold text-blue-400">69</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Neural Connections:</span>
              <span className="font-bold text-purple-400">500+</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-green-400">{threeLoaded ? 'Active' : 'Loading'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}