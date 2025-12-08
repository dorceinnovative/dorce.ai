import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'ai' | 'system';
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: any;
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
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  conversationId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastReadAt: Date;
  isMuted: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createConversation(
    userId: string,
    type: 'direct' | 'group' | 'channel' | 'ai',
    title: string,
    participants: string[] = [],
    metadata?: any,
  ): Promise<ChatConversation> {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
        status: 'active',
      },
    });

    const result: ChatConversation = {
      id: conversation.id,
      type,
      title: conversation.title || 'New Conversation',
      participants: [userId, ...participants],
      metadata: metadata,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      unreadCount: 0,
    };

    this.eventEmitter.emit('chat.conversation.created', {
      conversationId: conversation.id,
      userId,
      type,
    });

    return result;
  }

  async sendMessage(
    userId: string,
    dto: {
      content: string;
      conversationId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{
    message: ChatMessage;
    assistantMessage?: ChatMessage;
    conversation?: ChatConversation;
  }> {
    // Check if user is participant
    let conversationId = dto.conversationId;
    
    // Create new conversation if none provided
    if (!conversationId) {
      const conversation = await this.createConversation(userId, 'direct', 'New Chat');
      conversationId = conversation.id;
    }

    // Verify conversation exists and user has access
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        userId,
        content: dto.content,
        role: 'user',
        intent: 'none',
        metadata: dto.metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const chatMessage: ChatMessage = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.userId,
      senderType: 'user',
      content: message.content,
      type: 'text',
      metadata: message.metadata,
      timestamp: message.createdAt,
      isEncrypted: false,
      isDelivered: true,
      isRead: false,
    };

    this.eventEmitter.emit('chat.message.sent', {
      messageId: message.id,
      conversationId,
      userId,
    });

    return {
      message: chatMessage,
    };
  }

  async getConversation(userId: string, conversationId: string): Promise<ChatConversation | null> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      return null;
    }

    const result: ChatConversation = {
      id: conversation.id,
      type: 'direct',
      title: conversation.title || 'Conversation',
      participants: [conversation.userId],
      metadata: undefined,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      unreadCount: 0,
    };

    if (conversation.messages.length > 0) {
      result.lastMessage = this.mapToChatMessage(conversation.messages[0]);
    }

    return result;
  }

  async getConversations(userId: string): Promise<ChatConversation[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map(conversation => {
      const result: ChatConversation = {
        id: conversation.id,
        type: 'direct',
        title: conversation.title || 'Conversation',
        participants: [conversation.userId],
        metadata: undefined,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        unreadCount: 0,
      };

      if (conversation.messages.length > 0) {
        result.lastMessage = this.mapToChatMessage(conversation.messages[0]);
      }

      return result;
    });
  }

  async getMessages(userId: string, conversationId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(before && { id: { lt: before } }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.map(message => this.mapToChatMessage(message));
  }

  async markAsRead(userId: string, conversationId: string, messageId?: string): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    if (messageId) {
      await this.prisma.message.updateMany({
        where: {
          conversationId,
          id: { lte: messageId },
        },
        data: { metadata: { isRead: true } },
      });
    }

    this.eventEmitter.emit('chat.message.read', {
      conversationId,
      userId,
      messageId,
    });
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
      },
    });

    if (!message) {
      throw new Error('Message not found or access denied');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    this.eventEmitter.emit('chat.message.deleted', {
      messageId,
      userId,
    });
  }

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    this.eventEmitter.emit('chat.conversation.deleted', {
      conversationId,
      userId,
    });
  }

  async sendSystemMessage(userId: string, messageData: {
    type: string;
    title: string;
    content: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Find or create a system conversation for the user
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          userId,
          title: 'System Notifications',
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            userId,
            title: 'System Notifications',
          },
        });
      }

      // Create the system message
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          userId,
          content: messageData.content,
          role: 'assistant',
          metadata: messageData.metadata,
        },
      });

      this.eventEmitter.emit('chat.system.message.sent', {
        userId,
        messageData,
      });
    } catch (error) {
      this.logger.error(`Failed to send system message: ${(error as Error).message}`);
    }
  }

  async updateConversationTitle(userId: string, conversationId: string, title: string): Promise<ChatConversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const updatedConversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });

    const result: ChatConversation = {
      id: updatedConversation.id,
      type: 'direct',
      title: updatedConversation.title || title,
      participants: [updatedConversation.userId],
      metadata: undefined,
      createdAt: updatedConversation.createdAt,
      updatedAt: updatedConversation.updatedAt,
      unreadCount: 0,
    };

    this.eventEmitter.emit('chat.conversation.updated', {
      conversationId,
      userId,
      title,
    });

    return result;
  }

  async getUnreadCount(userId: string, conversationId?: string): Promise<number> {
    if (conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!conversation) {
        return 0;
      }

      return await this.prisma.message.count({
        where: {
          conversationId,
          metadata: {
            not: { isRead: true }
          }
        },
      });
    }

    return await this.prisma.message.count({
      where: {
        conversation: {
          userId,
        },
        metadata: {
          not: { isRead: true }
        }
      },
    });
  }

  private mapToChatMessage(message: any): ChatMessage {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.userId,
      senderType: message.role === 'assistant' ? 'ai' : 'user',
      content: message.content,
      type: 'text',
      metadata: message.metadata,
      timestamp: message.createdAt,
      isEncrypted: false,
      isDelivered: true,
      isRead: message.metadata?.isRead || false,
    };
  }
}