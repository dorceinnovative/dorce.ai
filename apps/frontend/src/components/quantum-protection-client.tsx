'use client';

import { quantumProtection } from '@/lib/quantum-anti-clone-safe'
import { useEffect } from 'react'

export function QuantumProtectionClient() {
  useEffect(() => {
    // Initialize quantum protection on client side only
    quantumProtection.getProtectionStatus();
  }, []);

  return null;
}