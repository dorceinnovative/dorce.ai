import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'ai' | 'system';
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, unknown>;
  timestamp: Date;
  isEncrypted: boolean;
  isDelivered: boolean;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'group' | 'channel' | 'ai';
  title: string;
  participants: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface UseChatIntegrationReturn {
  socket: Socket | null;
  isConnected: boolean;
  conversations: ChatConversation[];
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string, conversationId?: string) => void;
  createConversation: (title?: string) => void;
  markAsRead: (conversationId: string) => void;
}

export function useChatIntegration(): UseChatIntegrationReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const connect = useCallback(() => {
    let token: string | null = null;
    try {
      const raw = localStorage.getItem('auth_tokens');
      if (raw) {
        const parsed = JSON.parse(raw) as { accessToken?: string };
        token = parsed?.accessToken || null;
      }
      // fallback for legacy storage key
      if (!token) token = localStorage.getItem('access_token');
    } catch {
      token = localStorage.getItem('access_token');
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!token || socket || !apiUrl) return;

    const newSocket = io(`${apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Chat socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Chat socket disconnected');
    });

    newSocket.on('conversations', (data: ChatConversation[]) => {
      setConversations(data);
      const totalUnread = data.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    });

    newSocket.on('conversation_created', (conversation: ChatConversation) => {
      setConversations(prev => [conversation, ...prev]);
    });

    newSocket.on('message_sent', (data: { message: ChatMessage }) => {
      setConversations(prev => prev.map(conv => {
        if (conv.id === data.message.conversationId) {
          return {
            ...conv,
            lastMessage: data.message,
            updatedAt: new Date(),
          };
        }
        return conv;
      }));
    });

    newSocket.on('ai_response', (data: { message: ChatMessage }) => {
      setConversations(prev => prev.map(conv => {
        if (conv.id === data.message.conversationId) {
          return {
            ...conv,
            lastMessage: data.message,
            updatedAt: new Date(),
          };
        }
        return conv;
      }));
    });

    setSocket(newSocket);
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const sendMessage = useCallback((content: string, conversationId?: string) => {
    if (!socket || !isConnected) return;

    socket.emit('send_message', {
      content,
      conversationId,
    });
  }, [socket, isConnected]);

  const createConversation = useCallback((title?: string) => {
    if (!socket || !isConnected) return;

    socket.emit('create_conversation', { title });
  }, [socket, isConnected]);

  const markAsRead = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('mark_as_read', { conversationId });
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    }));

    setUnreadCount(prev => {
      const conversation = conversations.find(conv => conv.id === conversationId);
      return Math.max(0, prev - (conversation?.unreadCount || 0));
    });
  }, [socket, isConnected, conversations]);

  // Auto-connect on mount only if API URL is available
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Refresh conversations periodically
  useEffect(() => {
    if (!socket || !isConnected) return;

    const interval = setInterval(() => {
      socket.emit('get_conversations');
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    conversations,
    unreadCount,
    connect,
    disconnect,
    sendMessage,
    createConversation,
    markAsRead,
  };
}

// Chat notification manager
export function useChatNotifications() {
  const [notifications, setNotifications] = useState<ChatMessage[]>([]);

  const addNotification = useCallback((message: ChatMessage) => {
    setNotifications(prev => [...prev, message]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== message.id));
    }, 5000);
  }, []);

  const clearNotification = useCallback((messageId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== messageId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    clearNotification,
    clearAllNotifications,
  };
}

// Chat shortcuts and hotkeys
export function useChatShortcuts(
  onQuickChat: () => void,
  onNewMessage: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C for quick chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        onQuickChat();
      }
      
      // Ctrl/Cmd + N for new message
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onNewMessage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onQuickChat, onNewMessage]);
}