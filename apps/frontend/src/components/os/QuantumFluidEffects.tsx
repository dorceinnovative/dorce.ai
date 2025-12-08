import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface QuantumParticle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  mass: number
  charge: number
  spin: number
  energy: number
  quantumState: number
  color: string
  trail: { x: number; y: number; timestamp: number }[]
  connections: string[]
  waveFunction: number[]
}

interface FluidField {
  x: number
  y: number
  vx: number
  vy: number
  density: number
  pressure: number
  temperature: number
  vorticity: number
  viscosity: number
}

interface QuantumField {
  particles: QuantumParticle[]
  fluidGrid: FluidField[][]
  waveInterference: number[][]
  entanglementPairs: [string, string][]
  quantumFoam: { x: number; y: number; intensity: number; lifetime: number }[]
}

export default function QuantumFluidEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [quantumField, setQuantumField] = useState<QuantumField>({
    particles: [],
    fluidGrid: [],
    waveInterference: [],
    entanglementPairs: [],
    quantumFoam: []
  })
  const [isRunning, setIsRunning] = useState(true)
  const [renderMode, setRenderMode] = useState<'particles' | 'fluid' | 'waves' | 'quantum'>('quantum')
  const [particleCount, setParticleCount] = useState(150)
  const [fluidViscosity, setFluidViscosity] = useState(0.1)
  const [quantumEntanglement, setQuantumEntanglement] = useState(true)
  const [showTrails, setShowTrails] = useState(true)
  const [waveIntensity, setWaveIntensity] = useState(0.8)

  // Initialize quantum field
  const initializeQuantumField = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const particles: QuantumParticle[] = []
    const gridSize = 50
    const fluidGrid: FluidField[][] = []
    const waveInterference: number[][] = []

    // Create fluid grid
    for (let i = 0; i < gridSize; i++) {
      fluidGrid[i] = []
      waveInterference[i] = []
      for (let j = 0; j < gridSize; j++) {
        fluidGrid[i][j] = {
          x: (i / gridSize) * canvas.width,
          y: (j / gridSize) * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          density: 1 + Math.random() * 0.5,
          pressure: Math.random() * 100,
          temperature: 20 + Math.random() * 30,
          vorticity: (Math.random() - 0.5) * 0.1,
          viscosity: fluidViscosity
        }
        waveInterference[i][j] = Math.random() * 2 * Math.PI
      }
    }

    // Create quantum particles
    for (let i = 0; i < particleCount; i++) {
      const quantumState = Math.random()
      particles.push({
        id: `particle-${i}`,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 2 + Math.random() * 8,
        mass: 0.5 + Math.random() * 2,
        charge: Math.random() > 0.5 ? 1 : -1,
        spin: Math.random() * 2 * Math.PI,
        energy: Math.random() * 100,
        quantumState,
        color: `hsl(${quantumState * 360}, 70%, 60%)`,
        trail: [],
        connections: [],
        waveFunction: Array.from({ length: 10 }, () => Math.random() * 2 - 1)
      })
    }

    setQuantumField({
      particles,
      fluidGrid,
      waveInterference,
      entanglementPairs: [],
      quantumFoam: []
    })
  }, [particleCount, fluidViscosity])

  // Quantum physics calculations
  const calculateQuantumPhysics = useCallback((field: QuantumField, canvas: HTMLCanvasElement): QuantumField => {
    const newField = { ...field }
    const { particles, fluidGrid, waveInterference } = newField

    // Update fluid dynamics (Navier-Stokes simplified)
    for (let i = 1; i < fluidGrid.length - 1; i++) {
      for (let j = 1; j < fluidGrid[i].length - 1; j++) {
        const cell = fluidGrid[i][j]
        const neighbors = [
          fluidGrid[i-1][j], fluidGrid[i+1][j],
          fluidGrid[i][j-1], fluidGrid[i][j+1]
        ]

        // Calculate pressure gradient
        const pressureGradientX = (neighbors[1].pressure - neighbors[0].pressure) / 2
        const pressureGradientY = (neighbors[3].pressure - neighbors[2].pressure) / 2

        // Apply viscosity
        const viscosityEffect = fluidViscosity * 0.01
        cell.vx += (pressureGradientX * 0.001 - cell.vx * viscosityEffect)
        cell.vy += (pressureGradientY * 0.001 - cell.vy * viscosityEffect)

        // Update density and pressure
        const divergence = (neighbors[1].vx - neighbors[0].vx + neighbors[3].vy - neighbors[2].vy) * 0.5
        cell.density += divergence * 0.01
        cell.pressure = cell.density * 100 + Math.random() * 10

        // Apply vorticity confinement
        const vorticity = (neighbors[1].vy - neighbors[0].vy - neighbors[3].vx + neighbors[2].vx) * 0.5
        cell.vorticity = vorticity
        cell.vx += vorticity * 0.1
        cell.vy -= vorticity * 0.1
      }
    }

    // Update wave interference
    for (let i = 0; i < waveInterference.length; i++) {
      for (let j = 0; j < waveInterference[i].length; j++) {
        waveInterference[i][j] += 0.1 * waveIntensity
        if (waveInterference[i][j] > 2 * Math.PI) {
          waveInterference[i][j] -= 2 * Math.PI
        }
      }
    }

    // Update particle physics
    newField.particles = particles.map(particle => {
      const newParticle = { ...particle }
      
      // Quantum wave function collapse simulation
      const waveInfluence = waveInterference[
        Math.floor((particle.x / canvas.width) * waveInterference.length)
      ]?.[Math.floor((particle.y / canvas.height) * waveInterference[0].length)] || 0
      
      // Apply quantum uncertainty
      const uncertainty = (1 - particle.quantumState) * 2
      newParticle.vx += (Math.random() - 0.5) * uncertainty
      newParticle.vy += (Math.random() - 0.5) * uncertainty

      // Fluid interaction
      const gridX = Math.floor((particle.x / canvas.width) * fluidGrid.length)
      const gridY = Math.floor((particle.y / canvas.height) * fluidGrid[0].length)
      if (fluidGrid[gridX] && fluidGrid[gridX][gridY]) {
        const fluidCell = fluidGrid[gridX][gridY]
        newParticle.vx += fluidCell.vx * 0.1
        newParticle.vy += fluidCell.vy * 0.1
        
        // Buoyancy effect
        const buoyancy = (fluidCell.density - 1) * 0.5
        newParticle.vy -= buoyancy
      }

      // Quantum entanglement effects
      if (quantumEntanglement) {
        newField.entanglementPairs.forEach(([id1, id2]) => {
          if (id1 === particle.id || id2 === particle.id) {
            const otherId = id1 === particle.id ? id2 : id1
            const otherParticle = particles.find(p => p.id === otherId)
            if (otherParticle) {
              const dx = otherParticle.x - particle.x
              const dy = otherParticle.y - particle.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              if (distance > 0 && distance < 200) {
                const force = 0.001 * (1 - distance / 200)
                newParticle.vx += dx * force
                newParticle.vy += dy * force
              }
            }
          }
        })
      }

      // Update position
      newParticle.x += newParticle.vx
      newParticle.y += newParticle.vy

      // Boundary conditions with quantum tunneling
      if (newParticle.x < 0 || newParticle.x > canvas.width) {
        if (Math.random() < particle.quantumState * 0.1) {
          // Quantum tunneling
          newParticle.x = newParticle.x < 0 ? canvas.width : 0
        } else {
          newParticle.vx *= -0.8
          newParticle.x = Math.max(0, Math.min(canvas.width, newParticle.x))
        }
      }
      
      if (newParticle.y < 0 || newParticle.y > canvas.height) {
        if (Math.random() < particle.quantumState * 0.1) {
          // Quantum tunneling
          newParticle.y = newParticle.y < 0 ? canvas.height : 0
        } else {
          newParticle.vy *= -0.8
          newParticle.y = Math.max(0, Math.min(canvas.height, newParticle.y))
        }
      }

      // Update trail
      if (showTrails) {
        newParticle.trail.push({ x: newParticle.x, y: newParticle.y, timestamp: Date.now() })
        if (newParticle.trail.length > 20) {
          newParticle.trail.shift()
        }
      }

      // Update energy and quantum state
      newParticle.energy = Math.sqrt(newParticle.vx * newParticle.vx + newParticle.vy * newParticle.vy) * 10
      newParticle.quantumState = (newParticle.quantumState + 0.01) % 1
      newParticle.spin += 0.05

      return newParticle
    })

    // Create quantum foam
    if (Math.random() < 0.1) {
      newField.quantumFoam.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        intensity: Math.random(),
        lifetime: 100
      })
    }
    
    newField.quantumFoam = newField.quantumFoam
      .map(foam => ({ ...foam, lifetime: foam.lifetime - 1 }))
      .filter(foam => foam.lifetime > 0)

    return newField
  }, [fluidViscosity, quantumEntanglement, showTrails, waveIntensity])

  // Render functions
  const renderParticles = (ctx: CanvasRenderingContext2D, field: QuantumField) => {
    const { particles } = field

    particles.forEach(particle => {
      // Render particle trail
      if (showTrails && particle.trail.length > 1) {
        ctx.strokeStyle = particle.color
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        particle.trail.forEach((point, index) => {
          const alpha = index / particle.trail.length
          ctx.globalAlpha = alpha * 0.3
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      }

      // Render particle with quantum effects
      ctx.globalAlpha = 0.8
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 2
      )
      gradient.addColorStop(0, particle.color)
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI)
      ctx.fill()

      // Render quantum aura
      ctx.globalAlpha = 0.2
      ctx.strokeStyle = particle.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, 2 * Math.PI)
      ctx.stroke()
    })

    // Render entanglement connections
    if (quantumEntanglement) {
      field.entanglementPairs.forEach(([id1, id2]) => {
        const p1 = particles.find(p => p.id === id1)
        const p2 = particles.find(p => p.id === id2)
        if (p1 && p2) {
          ctx.globalAlpha = 0.5
          ctx.strokeStyle = '#ff00ff'
          ctx.lineWidth = 1
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
          ctx.setLineDash([])
        }
      })
    }
  }

  const renderFluid = (ctx: CanvasRenderingContext2D, field: QuantumField) => {
    const { fluidGrid } = field
    const cellSize = 8

    fluidGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        const intensity = Math.abs(cell.vorticity) * 1000
        const hue = (cell.temperature - 20) * 6
        
        ctx.globalAlpha = Math.min(intensity, 0.8)
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
        
        // Render velocity vectors
        ctx.strokeStyle = `hsl(${hue}, 70%, 80%)`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cell.x, cell.y)
        ctx.lineTo(cell.x + cell.vx * 20, cell.y + cell.vy * 20)
        ctx.stroke()
        
        // Render density as circles
        ctx.beginPath()
        ctx.arc(cell.x, cell.y, cell.density * 5, 0, 2 * Math.PI)
        ctx.fill()
      })
    })
  }

  const renderWaves = (ctx: CanvasRenderingContext2D, field: QuantumField) => {
    const { waveInterference } = field
    const cellSize = 10

    for (let i = 0; i < waveInterference.length - 1; i++) {
      for (let j = 0; j < waveInterference[i].length - 1; j++) {
        const wave1 = Math.sin(waveInterference[i][j])
        const wave2 = Math.sin(waveInterference[i][j] + Math.PI / 4)
        const interference = (wave1 + wave2) / 2
        
        const intensity = Math.abs(interference)
        const hue = (waveInterference[i][j] / (2 * Math.PI)) * 360
        
        ctx.globalAlpha = intensity * 0.6
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
      }
    }
  }

  const renderQuantumFoam = (ctx: CanvasRenderingContext2D, field: QuantumField) => {
    field.quantumFoam.forEach(foam => {
      const alpha = foam.lifetime / 100
      ctx.globalAlpha = alpha * foam.intensity
      
      const gradient = ctx.createRadialGradient(
        foam.x, foam.y, 0,
        foam.x, foam.y, 20
      )
      gradient.addColorStop(0, `hsl(${Math.random() * 360}, 100%, 70%)`)
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(foam.x, foam.y, 20 * (1 - alpha), 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !isRunning) return

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Update physics
    const newField = calculateQuantumPhysics(quantumField, canvas)
    setQuantumField(newField)

    // Render based on mode
    ctx.save()
    switch (renderMode) {
      case 'particles':
        renderParticles(ctx, newField)
        break
      case 'fluid':
        renderFluid(ctx, newField)
        break
      case 'waves':
        renderWaves(ctx, newField)
        break
      case 'quantum':
        renderWaves(ctx, newField)
        renderFluid(ctx, newField)
        renderParticles(ctx, newField)
        renderQuantumFoam(ctx, newField)
        break
    }
    ctx.restore()

    animationRef.current = requestAnimationFrame(animate)
  }, [quantumField, isRunning, renderMode, calculateQuantumPhysics])

  // Initialize and start animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    initializeQuantumField()
  }, [initializeQuantumField])

  useEffect(() => {
    if (isRunning) {
      animate()
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate, isRunning])

  // Create entanglement pairs
  const createEntanglement = () => {
    const particles = quantumField.particles
    if (particles.length < 2) return

    const availableParticles = particles.filter(p => 
      !quantumField.entanglementPairs.some(([id1, id2]) => id1 === p.id || id2 === p.id)
    )

    if (availableParticles.length >= 2) {
      const p1 = availableParticles[Math.floor(Math.random() * availableParticles.length)]
      const p2 = availableParticles[Math.floor(Math.random() * availableParticles.length)]
      if (p1.id !== p2.id) {
        setQuantumField(prev => ({
          ...prev,
          entanglementPairs: [...prev.entanglementPairs, [p1.id, p2.id]]
        }))
      }
    }
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-lg p-4 space-y-4">
        <h2 className="text-white font-bold text-lg">Quantum Fluid Control</h2>
        
        <div className="space-y-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? 'Pause' : 'Play'}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Render Mode</label>
          <select
            value={renderMode}
            onChange={(e) => setRenderMode(e.target.value as any)}
            className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600"
          >
            <option value="quantum">Quantum Complete</option>
            <option value="particles">Particles Only</option>
            <option value="fluid">Fluid Dynamics</option>
            <option value="waves">Wave Interference</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Particles: {particleCount}</label>
          <input
            type="range"
            min="50"
            max="300"
            value={particleCount}
            onChange={(e) => setParticleCount(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Fluid Viscosity: {fluidViscosity.toFixed(2)}</label>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={fluidViscosity}
            onChange={(e) => setFluidViscosity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Wave Intensity: {waveIntensity.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={waveIntensity}
            onChange={(e) => setWaveIntensity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-white text-sm">
            <input
              type="checkbox"
              checked={quantumEntanglement}
              onChange={(e) => setQuantumEntanglement(e.target.checked)}
              className="rounded"
            />
            <span>Quantum Entanglement</span>
          </label>
          
          <label className="flex items-center space-x-2 text-white text-sm">
            <input
              type="checkbox"
              checked={showTrails}
              onChange={(e) => setShowTrails(e.target.checked)}
              className="rounded"
            />
            <span>Show Trails</span>
          </label>
        </div>

        <button
          onClick={createEntanglement}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
        >
          Create Entanglement
        </button>

        <button
          onClick={initializeQuantumField}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
        >
          Reset Field
        </button>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md rounded-lg p-4 text-white text-sm">
        <div className="space-y-1">
          <div>Particles: {quantumField.particles.length}</div>
          <div>Entangled Pairs: {quantumField.entanglementPairs.length}</div>
          <div>Quantum Foam: {quantumField.quantumFoam.length}</div>
          <div>FPS: {isRunning ? '60' : '0'}</div>
        </div>
      </div>
    </div>
  )
}