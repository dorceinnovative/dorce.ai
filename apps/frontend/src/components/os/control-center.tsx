'use client';

import React from 'react';
import { useOSKernel } from '@/lib/os-kernel-context';

interface OSControlCenterProps {
  onClose: () => void;
}

export function OSControlCenter({ onClose }: OSControlCenterProps) {
  const { systemState } = useOSKernel();

  if (!systemState) return null;

  return (
    <div className="os-control-overlay" onClick={onClose}>
      <div className="os-control-center" onClick={(e) => e.stopPropagation()}>
        <div className="os-control-header">
          <h3 className="os-control-title">Control Center</h3>
        </div>
        
        <div className="os-control-section">
          <h4 className="os-control-section-title">System Resources</h4>
          <div className="os-control-item">
            <span className="os-control-label">Memory Usage</span>
            <span className="os-control-value">
              {systemState.systemResources.memory.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="os-control-item">
            <span className="os-control-label">CPU Usage</span>
            <span className="os-control-value">
              {systemState.systemResources.cpu.usage.toFixed(1)}%
            </span>
          </div>
          <div className="os-control-item">
            <span className="os-control-label">Storage Usage</span>
            <span className="os-control-value">
              {systemState.systemResources.storage.percentage.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="os-control-section">
          <h4 className="os-control-section-title">Running Apps</h4>
          {systemState.runningApps.length === 0 ? (
            <div className="os-control-item">
              <span className="os-control-label">No apps running</span>
            </div>
          ) : (
            systemState.runningApps.map((app) => (
              <div key={app.id} className="os-control-item">
                <span className="os-control-label">
                  {app.icon} {app.name}
                </span>
                <span className="os-control-value">
                  {app.memoryUsage}MB
                </span>
              </div>
            ))
          )}
        </div>

        <div className="os-control-section">
          <h4 className="os-control-section-title">Quick Actions</h4>
          <div className="os-control-item">
            <button className="os-control-button">
              🔄 Restart System
            </button>
          </div>
          <div className="os-control-item">
            <button className="os-control-button">
              🛡️ Security Settings
            </button>
          </div>
          <div className="os-control-item">
            <button className="os-control-button">
              ⚡ Power Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}