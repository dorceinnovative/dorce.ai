import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface QuantumParticle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  life: number
  maxLife: number
}

interface QuantumField {
  strength: number
  frequency: number
  phase: number
}

export function QuantumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [particles, setParticles] = useState<QuantumParticle[]>([])
  const [quantumField, setQuantumField] = useState<QuantumField>({
    strength: 0.5,
    frequency: 0.02,
    phase: 0
  })
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize quantum particles
    const initialParticles: QuantumParticle[] = Array.from({ length: 150 }, (_, i) => ({
      id: `particle-${i}`,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      color: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0080'][Math.floor(Math.random() * 5)],
      life: Math.random() * 100,
      maxLife: 100
    }))

    setParticles(initialParticles)

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update quantum field
      setQuantumField(prev => ({
        ...prev,
        phase: prev.phase + prev.frequency
      }))

      // Update and draw particles
      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          // Quantum field effects
          const fieldEffect = Math.sin(particle.x * 0.01 + quantumField.phase) * quantumField.strength
          const fieldEffectY = Math.cos(particle.y * 0.01 + quantumField.phase) * quantumField.strength

          // Update position with quantum interference
          particle.x += particle.vx + fieldEffect
          particle.y += particle.vy + fieldEffectY

          // Quantum tunneling effect (random position jumps)
          if (Math.random() < 0.001) {
            particle.x = Math.random() * canvas.width
            particle.y = Math.random() * canvas.height
          }

          // Boundary conditions with quantum reflection
          if (particle.x < 0 || particle.x > canvas.width) {
            particle.vx *= -0.8
            particle.x = Math.max(0, Math.min(canvas.width, particle.x))
          }
          if (particle.y < 0 || particle.y > canvas.height) {
            particle.vy *= -0.8
            particle.y = Math.max(0, Math.min(canvas.height, particle.y))
          }

          // Update life
          particle.life = (particle.life + 0.5) % particle.maxLife
          const lifeRatio = particle.life / particle.maxLife

          // Draw particle with quantum glow
          ctx.save()
          ctx.globalAlpha = particle.opacity * (1 - Math.abs(lifeRatio - 0.5) * 2)
          
          // Quantum glow effect
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 3
          )
          gradient.addColorStop(0, particle.color)
          gradient.addColorStop(1, 'transparent')
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
          ctx.fill()

          // Core particle
          ctx.fillStyle = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()

          return particle
        })
      })

      // Draw quantum entanglement lines
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.strokeStyle = '#00ffff'
      ctx.lineWidth = 0.5

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x
          const dy = particles[j].y - particles[i].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            const opacity = (100 - distance) / 100 * 0.5
            ctx.globalAlpha = opacity
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.restore()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #000000 100%)' }}
    />
  )
}

export function QuantumHologram({ children, intensity = 0.8 }: { children: React.ReactNode, intensity?: number }) {
  return (
    <motion.div
      className="relative"
      animate={{
        boxShadow: [
          `0 0 20px rgba(0, 255, 255, ${intensity * 0.3})`,
          `0 0 40px rgba(255, 0, 255, ${intensity * 0.5})`,
          `0 0 60px rgba(0, 255, 255, ${intensity * 0.3})`
        ]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-lg"
        animate={{
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {children}
    </motion.div>
  )
}

export function QuantumFieldEffect({ active = false }: { active?: boolean }) {
  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 20%, rgba(255, 255, 0, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 80%, rgba(0, 255, 0, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

export function QuantumEntanglementVisualization({ connections = 50 }: { connections?: number }) {
  const [entangledPairs, setEntangledPairs] = useState<Array<{x1: number, y1: number, x2: number, y2: number}>>([])

  useEffect(() => {
    const generatePairs = () => {
      const pairs = []
      for (let i = 0; i < connections; i++) {
        pairs.push({
          x1: Math.random() * 100,
          y1: Math.random() * 100,
          x2: Math.random() * 100,
          y2: Math.random() * 100
        })
      }
      setEntangledPairs(pairs)
    }

    generatePairs()
    const interval = setInterval(generatePairs, 5000)

    return () => clearInterval(interval)
  }, [connections])

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
      {entangledPairs.map((pair, index) => (
        <motion.line
          key={index}
          x1={`${pair.x1}%`}
          y1={`${pair.y1}%`}
          x2={`${pair.x2}%`}
          y2={`${pair.y2}%`}
          stroke="#00ffff"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{
            duration: 3,
            delay: index * 0.1,
            repeat: Infinity,
            repeatDelay: 2
          }}
        />
      ))}
    </svg>
  )
}