'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { OSDesktop } from '@/components/os/desktop';
import { OSWindowManager } from '@/components/os/window-manager';
import { OSNotificationCenter } from '@/components/os/notification-center';
import { OSAppLauncher } from '@/components/os/app-launcher';
import { OSControlCenter } from '@/components/os/control-center';
import { OSFloatingAI } from '@/components/os/floating-ai';
import { OSKernelProvider } from '@/lib/os-kernel-context';

export function OSInterface({ children }: { children: React.ReactNode }) {
  const [isOSReady, setIsOSReady] = useState(false);
  const [showAppLauncher, setShowAppLauncher] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Initialize OS
    setIsOSReady(true);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // OS-level keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setShowAppLauncher(prev => !prev);
          break;
        case 'n':
          e.preventDefault();
          setShowNotifications(prev => !prev);
          break;
        case 'c':
          e.preventDefault();
          setShowControlCenter(prev => !prev);
          break;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOSReady) {
    return (
      <div className="os-boot-screen">
        <div className="os-boot-logo">
          <div className="os-logo">🚀</div>
          <h1>Dorce OS</h1>
          <p>Loading your business operating system...</p>
          <div className="os-boot-progress">
            <div className="os-boot-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OSKernelProvider>
      <div className="os-interface">
          {/* OS Desktop */}
          <OSDesktop />

          {/* OS Window Manager */}
          <OSWindowManager />

          {/* OS App Launcher */}
          {showAppLauncher && (
            <OSAppLauncher onClose={() => setShowAppLauncher(false)} />
          )}

          {/* OS Notification Center */}
          {showNotifications && (
            <OSNotificationCenter onClose={() => setShowNotifications(false)} />
          )}

          {/* OS Control Center */}
          {showControlCenter && (
            <OSControlCenter onClose={() => setShowControlCenter(false)} />
          )}

          {/* OS Floating AI Assistant */}
          <OSFloatingAI />

          {/* OS Status Bar */}
          <OSStatusBar
            onAppLauncher={() => setShowAppLauncher(true)}
            onNotifications={() => setShowNotifications(true)}
            onControlCenter={() => setShowControlCenter(true)}
          />

          {/* Main Content Area */}
          <main className="os-main-content">
            {children}
          </main>
        </div>
      </OSKernelProvider>
  );
}

function OSStatusBar({ 
  onAppLauncher, 
  onNotifications, 
  onControlCenter 
}: {
  onAppLauncher: () => void;
  onNotifications: () => void;
  onControlCenter: () => void;
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="os-status-bar">
      <div className="os-status-left">
        <button className="os-status-item" onClick={onAppLauncher}>
          <span className="os-icon">🚀</span>
          <span>Dorce OS</span>
        </button>
      </div>
      
      <div className="os-status-center">
        <div className="os-search-bar">
          <input 
            type="text" 
            placeholder="Search apps, files, and more..." 
            className="os-search-input"
          />
          <span className="os-search-icon">🔍</span>
        </div>
      </div>
      
      <div className="os-status-right">
        <button className="os-status-item" onClick={onNotifications}>
          <span className="os-icon">🔔</span>
        </button>
        <button className="os-status-item" onClick={onControlCenter}>
          <span className="os-icon">⚙️</span>
        </button>
        <div className="os-status-time">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}