'use client';

import React, { useState, useEffect } from 'react';
import { useOSKernel } from '@/lib/os-kernel-context';

interface OSAppLauncherProps {
  onClose: () => void;
}

export function OSAppLauncher({ onClose }: OSAppLauncherProps) {
  const { availableApps, launchApp } = useOSKernel();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredApps, setFilteredApps] = useState(availableApps);

  useEffect(() => {
    const filtered = availableApps.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredApps(filtered);
  }, [searchTerm, availableApps]);

  const handleAppClick = async (appId: string) => {
    try {
      await launchApp(appId);
      onClose();
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && filteredApps.length > 0) {
      // Launch first app on Enter
      handleAppClick(filteredApps[0].id);
    } else if (e.key === 'c' && e.ctrlKey) {
      // Ctrl+C for quick chat
      e.preventDefault();
      handleAppClick('dorce-chat');
    }
  };

  return (
    <div className="os-app-launcher-overlay" onClick={onClose}>
      <div className="os-app-launcher" onClick={(e) => e.stopPropagation()}>
        <div className="os-app-launcher-header">
          <h2 className="os-app-launcher-title">Launch App</h2>
          <input
            type="text"
            placeholder="Search apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="os-app-launcher-search"
            autoFocus
          />
        </div>
        <div className="os-app-launcher-grid">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="os-app-launcher-item"
              onClick={() => handleAppClick(app.id)}
            >
              <div className="os-app-launcher-icon">{app.icon}</div>
              <div className="os-app-launcher-name">{app.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}