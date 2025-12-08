'use client';

import React from 'react';
import { useOSKernel } from '@/lib/os-kernel-context';

interface OSDesktopIconProps {
  app: {
    id: string;
    name: string;
    icon: string;
    isRunning: boolean;
  };
  position: { x: number; y: number };
}

export function OSDesktopIcon({ app, position }: OSDesktopIconProps) {
  const { launchApp } = useOSKernel();

  const handleDoubleClick = async () => {
    try {
      await launchApp(app.id);
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  };

  return (
    <div
      className="os-desktop-icon"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <div className="os-desktop-icon-container">
        <div className="os-desktop-icon-icon">
          {app.icon}
        </div>
        <div className="os-desktop-icon-label">
          {app.name}
        </div>
        {app.isRunning && (
          <div className="os-desktop-icon-indicator"></div>
        )}
      </div>
    </div>
  );
}