'use client';

import React, { useState, useEffect } from 'react';
import { useOSKernel } from '@/lib/os-kernel-context';
import { OSDesktopIcon } from './desktop-icon';
import { ChatNotificationBadge, FloatingChatPanel } from '@/components/chat/chat-window';
import { useChatShortcuts } from '@/lib/chat-integration';

export function OSDesktop() {
  const { availableApps, chatUnreadCount, openChat, closeChat, isChatOpen } = useOSKernel();
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  const desktopApps = availableApps.slice(0, 6); // Show first 6 apps on desktop

  // Handle chat shortcuts
  useChatShortcuts(
    () => {
      // Ctrl/Cmd + Shift + C - Open floating chat
      setShowFloatingChat(true);
    },
    () => {
      // Ctrl/Cmd + N - Open full chat app
      openChat();
    }
  );

  const handleChatBadgeClick = () => {
    if (isChatOpen) {
      // If full chat is open, switch to floating
      closeChat();
      setShowFloatingChat(true);
    } else {
      // Otherwise open floating chat
      setShowFloatingChat(true);
    }
  };

  const handleFloatingChatClose = () => {
    setShowFloatingChat(false);
  };

  // Sync with OS kernel chat state
  useEffect(() => {
    if (isChatOpen && showFloatingChat) {
      // If full chat opens while floating is shown, close floating
      setShowFloatingChat(false);
    }
  }, [isChatOpen, showFloatingChat]);

  return (
    <div className="os-desktop">
      <div className="os-desktop-grid">
        {desktopApps.map((app, index) => (
          <OSDesktopIcon
            key={app.id}
            app={app}
            position={{
              x: 50 + (index % 3) * 150,
              y: 50 + Math.floor(index / 3) * 150,
            }}
          />
        ))}
      </div>
      
      <div className="os-desktop-wallpaper">
        <div className="os-desktop-gradient"></div>
      </div>

      {/* Chat notification badge */}
      <ChatNotificationBadge
        count={chatUnreadCount}
        onClick={handleChatBadgeClick}
      />

      {/* Floating chat panel */}
      <FloatingChatPanel
        isOpen={showFloatingChat}
        onClose={handleFloatingChatClose}
        position="bottom-right"
      />
    </div>
  );
}