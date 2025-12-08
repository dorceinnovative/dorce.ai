'use client';

import React from 'react';
import { useOSKernel } from '@/lib/os-kernel-context';

interface OSNotificationCenterProps {
  onClose: () => void;
}

export function OSNotificationCenter({ onClose }: OSNotificationCenterProps) {
  const { systemState, markNotificationRead } = useOSKernel();

  if (!systemState) return null;

  const handleNotificationClick = async (notificationId: string) => {
    await markNotificationRead(notificationId);
  };

  const handleClearAll = () => {
    systemState.notifications.forEach(notification => {
      markNotificationRead(notification.id);
    });
  };

  const unreadCount = systemState.notifications.filter(n => !n.isRead).length;

  return (
    <div className="os-notification-overlay" onClick={onClose}>
      <div className="os-notification-center" onClick={(e) => e.stopPropagation()}>
        <div className="os-notification-header">
          <h3 className="os-notification-title">
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </h3>
          <button className="os-notification-clear" onClick={handleClearAll}>
            Clear All
          </button>
        </div>
        <div className="os-notification-list">
          {systemState.notifications.length === 0 ? (
            <div className="os-notification-empty">
              <p>No notifications</p>
            </div>
          ) : (
            systemState.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`os-notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="os-notification-item-header">
                  <h4 className="os-notification-item-title">{notification.title}</h4>
                  <span className="os-notification-item-time">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="os-notification-item-message">{notification.message}</p>
                {notification.actions && notification.actions.length > 0 && (
                  <div className="os-notification-actions">
                    {notification.actions.map((action) => (
                      <button
                        key={action.id}
                        className="os-notification-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle action
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}