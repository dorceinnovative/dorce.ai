import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CinematicBackgroundProps {
  className?: string;
}

export default function CinematicBackground({ className = '' }: CinematicBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Detect WebGL2 support and guard renderer creation
    const canvas = document.createElement('canvas');
    const webgl2 = !!canvas.getContext('webgl2');
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    try {
      if (!webgl2) {
        setFallback(true);
        return;
      }
      // Scene setup
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      mountRef.current.appendChild(renderer.domElement);
    } catch (e) {
      setFallback(true);
      return;
    }

    // Create particle system for cinematic effect
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Position
      posArray[i] = (Math.random() - 0.5) * 100;
      posArray[i + 1] = (Math.random() - 0.5) * 100;
      posArray[i + 2] = (Math.random() - 0.5) * 100;

      // Colors - Nigerian flag colors with variations
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        // Green (#008751)
        colorArray[i] = 0.0;
        colorArray[i + 1] = 0.53;
        colorArray[i + 2] = 0.32;
      } else if (colorChoice < 0.7) {
        // Gold (#FFD700)
        colorArray[i] = 1.0;
        colorArray[i + 1] = 0.84;
        colorArray[i + 2] = 0.0;
      } else {
        // White with slight variations
        colorArray[i] = 0.9 + Math.random() * 0.1;
        colorArray[i + 1] = 0.9 + Math.random() * 0.1;
        colorArray[i + 2] = 0.9 + Math.random() * 0.1;
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    // Particle material
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Add some floating geometric shapes for depth
    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x008751, 
      transparent: true, 
      opacity: 0.1,
      wireframe: true 
    });
    
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(mesh);
    }

    camera.position.z = 30;
    
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate particles slowly
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.0008;
      
      // Move geometric shapes
      scene.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && index > 0) {
          child.rotation.x += 0.001;
          child.rotation.y += 0.002;
          child.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01;
        }
      });

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (renderer) {
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,135,81,0.1) 0%, rgba(0,0,0,0.8) 100%)' }}
    >
      {fallback && (
        <div className="absolute inset-0">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: i % 3 === 0 ? '#008751' : i % 3 === 1 ? '#FFD700' : 'rgba(255,255,255,0.9)',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
