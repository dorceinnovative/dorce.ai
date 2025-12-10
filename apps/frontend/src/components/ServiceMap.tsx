'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, OrbitControls, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useSpring, animated } from '@react-spring/three'

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

interface ServiceNodeProps {
  service: Service
  position: [number, number, number]
  onHover: (service: Service | null) => void
  onClick: (service: Service) => void
}

function ServiceNode({ service, position, onHover, onClick }: ServiceNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  const { scale, color } = useSpring({
    scale: hovered ? 1.2 : 1,
    color: hovered ? '#007AFF' : service.metadata.color,
    config: { tension: 300, friction: 10 }
  })

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      if (service.status === 'active') {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
    }
  })

  return (
    <animated.group position={position} scale={scale}>
      <animated.mesh
        ref={meshRef}
        onPointerEnter={() => {
          setHovered(true)
          onHover(service)
          document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={() => {
          setHovered(false)
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={() => onClick(service)}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <animated.meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </animated.mesh>
      
      {/* Status indicator */}
      <mesh position={[0, -1.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color={service.status === 'active' ? '#34C759' : service.status === 'maintenance' ? '#FF9500' : '#FF3B30'}
          emissive={service.status === 'active' ? '#34C759' : service.status === 'maintenance' ? '#FF9500' : '#FF3B30'}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Service name */}
      <Text
        position={[0, -1.8, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/SF-Pro-Display-Regular.otf"
      >
        {service.name}
      </Text>
      
      {/* Connection lines */}
      {service.status === 'active' && (
        <mesh>
          <ringGeometry args={[1.5, 1.52, 32]} />
          <meshBasicMaterial 
            color="#007AFF" 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </animated.group>
  )
}

interface ConnectionLineProps {
  start: [number, number, number]
  end: [number, number, number]
  active?: boolean
}

function ConnectionLine({ start, end, active = false }: ConnectionLineProps) {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)]
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
  
  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial 
        color={active ? "#007AFF" : "#8E8E93"} 
        transparent 
        opacity={active ? 0.6 : 0.2}
        linewidth={active ? 2 : 1}
      />
    </line>
  )
}

interface ServiceMapProps {
  services: Service[]
  onServiceClick: (service: Service) => void
  className?: string
}

export default function ServiceMap({ services, onServiceClick, className = '' }: ServiceMapProps) {
  const [hoveredService, setHoveredService] = useState<Service | null>(null)
  
  // Calculate 3D positions based on 2D coordinates
  const get3DPosition = (x: number, y: number): [number, number, number] => {
    return [(x - 300) / 100, (y - 200) / 100, 0]
  }

  // Create connection lines between related services
  const connections = [
    { from: 0, to: 1 }, // Transfer to Business Registration
    { from: 1, to: 2 }, // Business Registration to Vendor Onboarding
    { from: 2, to: 3 }, // Vendor Onboarding to Store Link Creation
    { from: 0, to: 4 }, // Transfer to Digital Subscriptions
    { from: 0, to: 5 }, // Transfer to NIN Registration
    { from: 1, to: 7 }, // Business Registration to TIN Registration
    { from: 5, to: 6 }, // NIN Registration to Premium Card Printing
  ]

  return (
    <div className={`w-full h-[600px] bg-gradient-to-br from-black via-gray-900 to-blue-900 rounded-3xl overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#007AFF" />
        
        {/* Background stars */}
        {Array.from({ length: 100 }).map((_, i) => (
          <Sphere
            key={i}
            position={[
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20 - 10
            ]}
            args={[0.02, 8, 8]}
          >
            <meshBasicMaterial color="white" transparent opacity={0.6} />
          </Sphere>
        ))}
        
        {/* Connection lines */}
        {connections.map((conn, index) => {
          const fromService = services[conn.from]
          const toService = services[conn.to]
          if (!fromService || !toService) return null
          
          const startPos = get3DPosition(fromService.position_x, fromService.position_y)
          const endPos = get3DPosition(toService.position_x, toService.position_y)
          
          return (
            <ConnectionLine
              key={index}
              start={startPos}
              end={endPos}
              active={fromService.status === 'active' && toService.status === 'active'}
            />
          )
        })}
        
        {/* Service nodes */}
        {services.map((service, index) => (
          <ServiceNode
            key={service.id}
            service={service}
            position={get3DPosition(service.position_x, service.position_y)}
            onHover={setHoveredService}
            onClick={onServiceClick}
          />
        ))}
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={15}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Tooltip */}
      {hoveredService && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-80 backdrop-blur-md rounded-xl p-4 text-white max-w-xs">
          <h3 className="text-lg font-semibold mb-2">{hoveredService.name}</h3>
          <p className="text-sm text-gray-300 mb-3">{hoveredService.description}</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              hoveredService.status === 'active' ? 'bg-green-500' :
              hoveredService.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-400 capitalize">{hoveredService.status}</span>
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 backdrop-blur-md rounded-lg p-2">
        <div className="text-xs text-gray-400 mb-2">Controls</div>
        <div className="flex gap-2">
          <div className="text-xs text-gray-500">Drag to rotate</div>
          <div className="text-xs text-gray-500">•</div>
          <div className="text-xs text-gray-500">Scroll to zoom</div>
        </div>
      </div>
    </div>
  )
}