'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useOSKernel } from '@/lib/os-kernel-context';
import { ChatWindow } from '@/components/chat/chat-window';
import { SubscriptionApp } from '@/components/subscription/subscription-app';

export function OSWindowManager() {
  const { systemState, updateWindow } = useOSKernel();
  const [draggedWindow, setDraggedWindow] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, windowId: string) => {
    e.preventDefault();
    const window = systemState?.activeWindows.find(w => w.id === windowId);
    if (!window) return;

    setDraggedWindow(windowId);
    setDragOffset({
      x: e.clientX - window.position.x,
      y: e.clientY - window.position.y,
    });

    // Make window active
    updateWindow(windowId, { isActive: true });
  }, [systemState, updateWindow]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedWindow) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    updateWindow(draggedWindow, {
      position: { x: newX, y: newY },
    });
  }, [draggedWindow, dragOffset, updateWindow]);

  const handleMouseUp = useCallback(() => {
    setDraggedWindow(null);
  }, []);

  useEffect(() => {
    if (draggedWindow) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedWindow, handleMouseMove, handleMouseUp]);

  if (!systemState) return null;

  return (
    <div className="os-window-manager">
      {systemState.activeWindows.map((window) => (
        <OSWindow
          key={window.id}
          window={window}
          isActive={window.isActive}
          onMouseDown={handleMouseDown}
        />
      ))}
    </div>
  );
}

interface OSWindowProps {
  window: {
    id: string;
    appId: string;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMinimized: boolean;
    isMaximized: boolean;
    isActive: boolean;
    zIndex: number;
  };
  isActive: boolean;
  onMouseDown: (e: React.MouseEvent, windowId: string) => void;
}

function OSWindow({ window, isActive, onMouseDown }: OSWindowProps) {
  const { closeWindow } = useOSKernel();

  if (window.isMinimized) return null;

  return (
    <div
      className={`os-window ${isActive ? 'active' : ''}`}
      style={{
        left: `${window.position.x}px`,
        top: `${window.position.y}px`,
        width: `${window.size.width}px`,
        height: `${window.size.height}px`,
        zIndex: window.zIndex,
      }}
    >
      <div
        className="os-window-header"
        onMouseDown={(e) => onMouseDown(e, window.id)}
      >
        <div className="os-window-controls">
          <button
            className="os-window-control close"
            onClick={() => closeWindow(window.id)}
          />
          <button className="os-window-control minimize" />
          <button className="os-window-control maximize" />
        </div>
        <div className="os-window-title">{window.title}</div>
        <div style={{ width: '60px' }} />
      </div>
      <div className="os-window-content">
        <OSAppContent appId={window.appId} />
      </div>
    </div>
  );
}

function OSAppContent({ appId }: { appId: string }) {
  // This would render the actual app content based on appId
  const appComponents = {
    'dorce-chat': () => <ChatWindow
      windowId="chat-window"
      title="Dorce Chat"
      isMinimized={false}
      isMaximized={false}
      onClose={() => {}}
      onMinimize={() => {}}
      onMaximize={() => {}}
    />,
    'dorce-marketplace': () => <div>Marketplace App Content</div>,
    'dorce-wallet': () => <div>Wallet App Content</div>,
    'dorce-crypto': () => <div>Crypto App Content</div>,
    'dorce-tax': () => <div>Tax App Content</div>,
    'dorce-education': () => <div>Education App Content</div>,
    'dorce-farms': () => <div>Farms App Content</div>,
    'dorce-news': () => <div>News App Content</div>,
    'dorce-community': () => <div>Community App Content</div>,
    'dorce-business': () => <SubscriptionApp />,
  };

  const AppComponent = appComponents[appId as keyof typeof appComponents];
  
  if (!AppComponent) {
    return <div>App {appId} not found</div>;
  }

  return <AppComponent />;
}