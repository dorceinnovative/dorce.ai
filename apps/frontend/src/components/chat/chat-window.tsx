import React from 'react';
import { ChatApp } from './chat-app';
import { MessageSquare, X, Minus, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  windowId: string;
  title?: string;
  isMinimized?: boolean;
  isMaximized?: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ChatWindow({
  windowId,
  title = 'Dorce Chat',
  isMinimized = false,
  isMaximized = false,
  onClose,
  onMinimize,
  onMaximize,
  className,
  style,
}: ChatWindowProps) {
  if (isMinimized) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-background border border-border rounded-lg shadow-lg",
        "w-[900px] h-[600px] min-w-[600px] min-h-[400px]",
        isMaximized && "w-full h-full",
        className
      )}
      style={style}
    >
      {/* Window Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted"
            onClick={onMinimize}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted"
            onClick={onMaximize}
          >
            <Square className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <ChatApp className="h-full" data-window-id={windowId} />
      </div>
    </div>
  );
}

// Floating chat panel for quick access
export function FloatingChatPanel({
  isOpen,
  onClose,
  position = 'bottom-right',
}: {
  isOpen: boolean;
  onClose: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}) {
  if (!isOpen) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div className={cn(
      "fixed z-50",
      positionClasses[position]
    )}>
      <div className="bg-background border border-border rounded-lg shadow-xl w-[350px] h-[500px] flex flex-col">
        {/* Panel Header */}
        <div className="flex items-center justify-between p-3 border-b bg-primary/5">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Quick Chat</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatApp className="h-full" />
        </div>
      </div>
    </div>
  );
}

// Chat notification badge
export function ChatNotificationBadge({
  count,
  onClick,
  className,
}: {
  count: number;
  onClick: () => void;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <Button
      variant="default"
      size="icon"
      className={cn(
        "fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-40",
        className
      )}
      onClick={onClick}
    >
      <MessageSquare className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
}