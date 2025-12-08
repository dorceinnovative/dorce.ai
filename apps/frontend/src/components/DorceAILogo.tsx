import React, { useEffect, useState } from 'react';

interface DorceAILogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function DorceAILogo({ size = 'medium', className = '' }: DorceAILogoProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  // Use state to prevent hydration mismatch for random values
  const [particles, setParticles] = useState<Array<{left: string, top: string, delay: string, duration: string}>>([]);

  useEffect(() => {
    // Generate random values only on client side
    const newParticles = [...Array(6)].map((_, i) => ({
      left: `${20 + Math.random() * 60}%`,
      top: `${20 + Math.random() * 60}%`,
      delay: `${i * 0.5}s`,
      duration: `${2 + Math.random() * 2}s`
    }));
    setParticles(newParticles);
  }, []);

  // Pre-calculate connection points to avoid floating point precision issues
  const connectionPoints = [
    { cx: 85, cy: 50 },    // 0 degrees
    { cx: 67.5, cy: 80.31 }, // 60 degrees
    { cx: 32.5, cy: 80.31 }, // 120 degrees
    { cx: 15, cy: 50 },    // 180 degrees
    { cx: 32.5, cy: 19.69 }, // 240 degrees
    { cx: 67.5, cy: 19.69 }  // 300 degrees
  ];

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`} suppressHydrationWarning>
      {/* Main logo - represents the 69 integrated apps */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer circle - represents the national scope */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          className="animate-pulse"
        />
        
        {/* Inner hexagon - represents the 6 core services */}
        <polygon
          points="50,15 80,35 80,65 50,85 20,65 20,35"
          fill="url(#logoGradient)"
          fillOpacity="0.2"
          stroke="url(#logoGradient)"
          strokeWidth="1.5"
        />
        
        {/* Center AI symbol - represents artificial intelligence */}
        <circle cx="50" cy="50" r="15" fill="url(#logoGradient)" />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          className="fill-white text-xs font-bold"
          fontSize="12"
        >
          AI
        </text>
        
        {/* 6 connection points - represents service integration */}
        {connectionPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.cx}
            cy={point.cy}
            r="3"
            fill="url(#logoGradient)"
            className="animate-pulse"
            style={{ animationDelay: `${index * 0.2}s` }}
          />
        ))}
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Floating particles effect - only render on client to prevent hydration mismatch */}
      {particles.length > 0 && (
        <div className="absolute inset-0 pointer-events-none" suppressHydrationWarning>
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60 animate-ping"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}