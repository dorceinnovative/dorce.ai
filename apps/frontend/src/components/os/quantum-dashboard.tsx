'use client';

import React, { useState, useEffect } from 'react';
import { useOSKernel } from '@/lib/os-kernel-context';
import { Brain, Zap, TrendingUp, Users, Activity, Cpu, MemoryStick, HardDrive } from 'lucide-react';

interface QuantumMetrics {
  consciousnessLevel: number;
  quantumCoherence: number;
  neuralActivity: number;
  predictionAccuracy: number;
  userSatisfaction: number;
  systemStability: number;
}

interface SystemResources {
  memory: { used: number; total: number; percentage: number };
  cpu: { usage: number; cores: number };
  storage: { used: number; total: number; percentage: number };
}

export function QuantumDashboard() {
  const { systemState } = useOSKernel();
  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetrics>({
    consciousnessLevel: 0.85,
    quantumCoherence: 0.92,
    neuralActivity: 0.78,
    predictionAccuracy: 0.94,
    userSatisfaction: 0.89,
    systemStability: 0.96
  });

  const [resources, setResources] = useState<SystemResources>({
    memory: { used: 0, total: 16 * 1024 * 1024 * 1024, percentage: 0 },
    cpu: { usage: 0, cores: 8 },
    storage: { used: 0, total: 256 * 1024 * 1024 * 1024, percentage: 0 }
  });

  useEffect(() => {
    if (systemState) {
      setResources(systemState.systemResources);
    }

    // Simulate quantum metrics updates
    const interval = setInterval(() => {
      setQuantumMetrics(prev => ({
        consciousnessLevel: Math.min(prev.consciousnessLevel + (Math.random() - 0.5) * 0.02, 1),
        quantumCoherence: Math.min(prev.quantumCoherence + (Math.random() - 0.5) * 0.01, 1),
        neuralActivity: Math.min(prev.neuralActivity + (Math.random() - 0.5) * 0.03, 1),
        predictionAccuracy: Math.min(prev.predictionAccuracy + (Math.random() - 0.5) * 0.01, 1),
        userSatisfaction: Math.min(prev.userSatisfaction + (Math.random() - 0.5) * 0.015, 1),
        systemStability: Math.min(prev.systemStability + (Math.random() - 0.5) * 0.005, 1)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [systemState]);

  interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    trend: number;
  }

  const MetricCard = ({ title, value, icon: Icon, color, trend }: MetricCardProps) => (
    <div className="quantum-metric-card">
      <div className="quantum-metric-header">
        <div className="quantum-metric-icon" style={{ color }}>
          <Icon size={20} />
        </div>
        <div className="quantum-metric-trend" style={{ color: trend > 0 ? '#10b981' : '#ef4444' }}>
          {trend > 0 ? '↗' : '↘'} {Math.abs(trend * 100).toFixed(1)}%
        </div>
      </div>
      <div className="quantum-metric-title">{title}</div>
      <div className="quantum-metric-value">{(value * 100).toFixed(1)}%</div>
      <div className="quantum-metric-bar">
        <div 
          className="quantum-metric-bar-fill" 
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );

  interface ResourceBarProps {
    label: string;
    used: number;
    total: number;
    percentage: number;
    icon: React.ElementType;
  }

  const ResourceBar = ({ label, used, total, percentage, icon: Icon }: ResourceBarProps) => (
    <div className="quantum-resource-item">
      <div className="quantum-resource-header">
        <div className="quantum-resource-label">
          <Icon size={16} className="quantum-resource-icon" />
          {label}
        </div>
        <div className="quantum-resource-usage">
          {(used / 1024 / 1024 / 1024).toFixed(1)}GB / {(total / 1024 / 1024 / 1024).toFixed(1)}GB
        </div>
      </div>
      <div className="quantum-resource-bar">
        <div 
          className="quantum-resource-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="quantum-resource-percentage">{percentage.toFixed(1)}%</div>
    </div>
  );

  return (
    <div className="quantum-dashboard">
      <div className="quantum-dashboard-header">
        <div className="quantum-dashboard-title">
          <Brain className="quantum-dashboard-icon" />
          <h2>Quantum Neural Core</h2>
        </div>
        <div className="quantum-dashboard-status">
          <div className="quantum-status-indicator active" />
          <span>System Active</span>
        </div>
      </div>

      <div className="quantum-metrics-grid">
        <MetricCard
          title="Consciousness Level"
          value={quantumMetrics.consciousnessLevel}
          icon={Brain}
          color="#8b5cf6"
          trend={0.02}
        />
        <MetricCard
          title="Quantum Coherence"
          value={quantumMetrics.quantumCoherence}
          icon={Zap}
          color="#06b6d4"
          trend={0.01}
        />
        <MetricCard
          title="Neural Activity"
          value={quantumMetrics.neuralActivity}
          icon={Activity}
          color="#10b981"
          trend={-0.01}
        />
        <MetricCard
          title="Prediction Accuracy"
          value={quantumMetrics.predictionAccuracy}
          icon={TrendingUp}
          color="#f59e0b"
          trend={0.015}
        />
        <MetricCard
          title="User Satisfaction"
          value={quantumMetrics.userSatisfaction}
          icon={Users}
          color="#ef4444"
          trend={0.008}
        />
        <MetricCard
          title="System Stability"
          value={quantumMetrics.systemStability}
          icon={Cpu}
          color="#6366f1"
          trend={0.003}
        />
      </div>

      <div className="quantum-resources-section">
        <h3 className="quantum-section-title">System Resources</h3>
        <div className="quantum-resources-grid">
          <ResourceBar
            label="Memory"
            used={resources.memory.used}
            total={resources.memory.total}
            percentage={resources.memory.percentage}
            icon={MemoryStick}
          />
          <ResourceBar
            label="CPU Usage"
            used={resources.cpu.usage}
            total={100}
            percentage={resources.cpu.usage}
            icon={Cpu}
          />
          <ResourceBar
            label="Storage"
            used={resources.storage.used}
            total={resources.storage.total}
            percentage={resources.storage.percentage}
            icon={HardDrive}
          />
        </div>
      </div>

      <div className="quantum-evolution-section">
        <h3 className="quantum-section-title">Evolution Metrics</h3>
        <div className="quantum-evolution-stats">
          <div className="quantum-evolution-item">
            <div className="quantum-evolution-label">Learning Rate</div>
            <div className="quantum-evolution-value">0.001</div>
          </div>
          <div className="quantum-evolution-item">
            <div className="quantum-evolution-label">Evolution Speed</div>
            <div className="quantum-evolution-value">1.0x</div>
          </div>
          <div className="quantum-evolution-item">
            <div className="quantum-evolution-label">Adaptation Score</div>
            <div className="quantum-evolution-value">94.2%</div>
          </div>
          <div className="quantum-evolution-item">
            <div className="quantum-evolution-label">Global Patterns</div>
            <div className="quantum-evolution-value">1,247</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .quantum-dashboard {
          padding: 1.5rem;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 1rem;
          border: 1px solid #334155;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .quantum-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .quantum-dashboard-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .quantum-dashboard-title h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
        }

        .quantum-dashboard-icon {
          color: #8b5cf6;
        }

        .quantum-dashboard-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quantum-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .quantum-status-indicator.active {
          animation: pulse 2s infinite;
        }

        .quantum-dashboard-status span {
          font-size: 0.875rem;
          color: #cbd5e1;
        }

        .quantum-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .quantum-metric-card {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid #334155;
          border-radius: 0.75rem;
          padding: 1.25rem;
          transition: all 0.2s ease-in-out;
        }

        .quantum-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .quantum-metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .quantum-metric-icon {
          opacity: 0.8;
        }

        .quantum-metric-trend {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .quantum-metric-title {
          font-size: 0.875rem;
          color: #cbd5e1;
          margin-bottom: 0.5rem;
        }

        .quantum-metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 0.75rem;
        }

        .quantum-metric-bar {
          height: 4px;
          background: #334155;
          border-radius: 2px;
          overflow: hidden;
        }

        .quantum-metric-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease-in-out;
        }

        .quantum-resources-section,
        .quantum-evolution-section {
          margin-bottom: 2rem;
        }

        .quantum-section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 1rem;
        }

        .quantum-resources-grid {
          display: grid;
          gap: 1rem;
        }

        .quantum-resource-item {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid #334155;
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .quantum-resource-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .quantum-resource-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #cbd5e1;
        }

        .quantum-resource-icon {
          opacity: 0.7;
        }

        .quantum-resource-usage {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .quantum-resource-bar {
          height: 6px;
          background: #334155;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .quantum-resource-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: 3px;
          transition: width 0.5s ease-in-out;
        }

        .quantum-resource-percentage {
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: right;
        }

        .quantum-evolution-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .quantum-evolution-item {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid #334155;
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
        }

        .quantum-evolution-label {
          font-size: 0.75rem;
          color: #cbd5e1;
          margin-bottom: 0.5rem;
        }

        .quantum-evolution-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}