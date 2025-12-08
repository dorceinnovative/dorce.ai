'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { api } from './api';
import { useChatIntegration } from './chat-integration';
import type { ChatConversation } from './chat-integration';

export interface OSApp {
  id: string;
  name: string;
  icon: string;
  description?: string;
  windowId?: string;
  isRunning: boolean;
  permissions: string[];
  memoryUsage: number;
  cpuUsage: number;
}

export interface OSWindow {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;
  zIndex: number;
}

export interface OSNotification {
  id: string;
  appId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
  actions?: OSNotificationAction[];
}

export interface OSNotificationAction {
  id: string;
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface OSSystemState {
  activeWindows: OSWindow[];
  runningApps: OSApp[];
  notifications: OSNotification[];
  processes: Array<Record<string, unknown>>;
  systemResources: {
    memory: { used: number; total: number; percentage: number };
    cpu: { usage: number; cores: number };
    storage: { used: number; total: number; percentage: number };
  };
  user: {
    id: string;
    username: string;
    permissions: string[];
    isAdmin: boolean;
  };
}

interface OSKernelContextType {
  systemState: OSSystemState | null;
  availableApps: OSApp[];
  launchApp: (appId: string) => Promise<OSWindow>;
  closeApp: (appId: string) => Promise<void>;
  updateWindow: (windowId: string, updates: Partial<OSWindow>) => Promise<OSWindow>;
  closeWindow: (windowId: string) => Promise<void>;
  sendNotification: (notification: Omit<OSNotification, 'id' | 'timestamp' | 'isRead'>) => Promise<OSNotification>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  refreshSystemState: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  // Chat integration
  chatSocket: Socket | null;
  chatConnected: boolean;
  chatConversations: ChatConversation[];
  chatUnreadCount: number;
  openChat: () => void;
  closeChat: () => void;
  isChatOpen: boolean;
}

const OSKernelContext = createContext<OSKernelContextType | undefined>(undefined);

export function OSKernelProvider({ children }: { children: ReactNode }) {
  const [systemState, setSystemState] = useState<OSSystemState | null>(null);
  const [availableApps, setAvailableApps] = useState<OSApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Chat integration
  const {
    socket: chatSocket,
    isConnected: chatConnected,
    conversations: chatConversations,
    unreadCount: chatUnreadCount,
    connect: connectChat,
    disconnect: disconnectChat,
  } = useChatIntegration();

  const refreshSystemState = useCallback(async () => {
    try {
      const tokens = typeof window !== 'undefined' ? localStorage.getItem('auth_tokens') : null
      if (!tokens) return
      const response = await api.get('/api/os/system-state');
      setSystemState(response.data as OSSystemState);
    } catch (err) {
      console.error('Error fetching system state:', err);
    }
  }, []);

  const fetchAvailableApps = async () => {
    try {
      const tokens = typeof window !== 'undefined' ? localStorage.getItem('auth_tokens') : null
      if (!tokens) return
      const response = await api.get('/api/os/apps');
      setAvailableApps(response.data as OSApp[]);
    } catch (err) {
      console.error('Error fetching apps:', err);
    }
  };

  useEffect(() => {
    const initializeOS = async () => {
      setIsLoading(true);
      try {
        const tokens = typeof window !== 'undefined' ? localStorage.getItem('auth_tokens') : null
        if (!tokens) {
          setIsLoading(false)
          return
        }
        await Promise.all([
          refreshSystemState(),
          fetchAvailableApps(),
        ])
      } finally {
        setIsLoading(false);
      }
    };

    initializeOS();
  }, [refreshSystemState]);

  const launchApp = useCallback(async (appId: string): Promise<OSWindow> => {
    try {
      const response = await api.post(`/api/os/apps/${appId}/launch`);
      await refreshSystemState();
      return response.data as OSWindow;
    } catch (err) {
      setError(`Failed to launch app ${appId}`);
      throw err;
    }
  }, [refreshSystemState]);

  const closeApp = async (appId: string): Promise<void> => {
    try {
      await api.delete(`/api/os/apps/${appId}/close`);
      await refreshSystemState();
    } catch (err) {
      setError(`Failed to close app ${appId}`);
      throw err;
    }
  };

  const updateWindow = async (windowId: string, updates: Partial<OSWindow>): Promise<OSWindow> => {
    try {
      const response = await api.put(`/api/os/windows/${windowId}`, updates);
      await refreshSystemState();
      return response.data as OSWindow;
    } catch (err) {
      setError(`Failed to update window ${windowId}`);
      throw err;
    }
  };

  const closeWindow = async (windowId: string): Promise<void> => {
    try {
      await api.delete(`/api/os/windows/${windowId}`);
      await refreshSystemState();
    } catch (err) {
      setError(`Failed to close window ${windowId}`);
      throw err;
    }
  };

  const sendNotification = async (notification: Omit<OSNotification, 'id' | 'timestamp' | 'isRead'>): Promise<OSNotification> => {
    try {
      const response = await api.post('/api/os/notifications', notification);
      await refreshSystemState();
      return response.data as OSNotification;
    } catch (err) {
      setError('Failed to send notification');
      throw err;
    }
  };

  const markNotificationRead = async (notificationId: string): Promise<void> => {
    try {
      await api.put(`/api/os/notifications/${notificationId}/read`);
      await refreshSystemState();
    } catch (err) {
      setError(`Failed to mark notification ${notificationId} as read`);
      throw err;
    }
  };

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    // Launch chat app if not already running
    if (!systemState?.runningApps.find(app => app.id === 'dorce-chat')) {
      launchApp('dorce-chat').catch(console.error);
    }
    // Connect to chat if not already connected
    if (!chatConnected) {
      connectChat();
    }
  }, [systemState, launchApp, chatConnected, connectChat]);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    // Disconnect from chat when closing
    if (chatConnected) {
      disconnectChat();
    }
  }, [chatConnected, disconnectChat]);

  const value: OSKernelContextType = {
    systemState,
    availableApps,
    launchApp,
    closeApp,
    updateWindow,
    closeWindow,
    sendNotification,
    markNotificationRead,
    refreshSystemState,
    isLoading,
    error,
    // Chat integration
    chatSocket,
    chatConnected,
    chatConversations,
    chatUnreadCount,
    openChat,
    closeChat,
    isChatOpen,
  };

  return (
    <OSKernelContext.Provider value={value}>
      {children}
    </OSKernelContext.Provider>
  );
}

export function useOSKernel() {
  const context = useContext(OSKernelContext);
  if (context === undefined) {
    throw new Error('useOSKernel must be used within an OSKernelProvider');
  }
  return context;
}
