'use client';

import React, { useState } from 'react';
import { useOSKernel } from '@/lib/os-kernel-context';

export function OSFloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { sendNotification } = useOSKernel();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendNotification({
        appId: 'dorce-ai',
        title: 'AI Assistant',
        message: message,
        type: 'info',
      });
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <>
      <div className="os-floating-ai">
        <button
          className="os-floating-ai-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          🤖
        </button>
      </div>

      {isOpen && (
        <div className="os-floating-ai-chat">
          <div className="os-floating-ai-chat-header">
            <h4>Dorce AI Assistant</h4>
            <button
              className="os-floating-ai-chat-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="os-floating-ai-chat-content">
            <div className="os-floating-ai-chat-message ai">
              <div className="os-floating-ai-chat-avatar">🤖</div>
              <div className="os-floating-ai-chat-text">
                Hello! I&apos;m Dorce AI Assistant. How can I help you today?
              </div>
            </div>
          </div>
          <div className="os-floating-ai-chat-input">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="os-floating-ai-chat-textarea"
            />
            <button
              className="os-floating-ai-chat-send"
              onClick={handleSendMessage}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}