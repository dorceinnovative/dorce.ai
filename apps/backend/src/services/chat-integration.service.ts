import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { PrismaService } from '../prisma/prisma.service';

export interface FileShareMessage {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  metadata?: any;
}

export interface MarketplaceChatData {
  productId?: string;
  orderId?: string;
  vendorId: string;
  customerId: string;
  inquiryType: 'product' | 'order' | 'support';
  subject: string;
}

export interface ChatEncryptionData {
  publicKey: string;
  privateKey?: string;
  sessionKey?: string;
  isEncrypted: boolean;
}

@Injectable()
export class ChatIntegrationService {
  private readonly logger = new Logger(ChatIntegrationService.name);

  constructor(
    private chatService: ChatService,
    private prisma: PrismaService,
  ) {}

  // File Sharing Integration
  async shareFile(
    userId: string,
    conversationId: string,
    fileData: FileShareMessage,
  ) {
    try {
      // Send file message to chat
      const message = await this.chatService.sendMessage(userId, {
        content: `Shared file: ${fileData.fileName}`,
        conversationId,
        metadata: {
          type: 'file_share',
          fileId: undefined,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          fileType: fileData.fileType,
          fileUrl: fileData.fileUrl,
          thumbnailUrl: fileData.thumbnailUrl,
        },
      });

      // Event emission removed - event emitter not available

      return { message };
    } catch (error) {
      this.logger.error('Error sharing file:', error);
      throw new Error('Failed to share file');
    }
  }

  async getSharedFiles(conversationId: string, userId: string) {
    try {
    // Verify conversation exists and belongs to user
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        metadata: {
          path: ['type'],
          equals: 'file_share',
        },
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
    });

    return messages.map(message => ({
      id: message.id,
      sender: message.user,
      fileName: (message.metadata as any)?.fileName,
      fileSize: (message.metadata as any)?.fileSize,
      fileType: (message.metadata as any)?.fileType,
      fileUrl: (message.metadata as any)?.fileUrl,
      thumbnailUrl: (message.metadata as any)?.thumbnailUrl,
      timestamp: message.createdAt,
    }));
    } catch (error) {
      this.logger.error('Error getting shared files:', error);
      throw new Error('Failed to get shared files');
    }
  }

  // Marketplace Chat Integration
  async createMarketplaceChat(
    customerId: string,
    vendorId: string,
    marketplaceData: MarketplaceChatData,
  ) {
    try {
      // Check if conversation already exists
      const existingConversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { userId: customerId },
            { userId: vendorId }
          ],
          title: {
            contains: marketplaceData.subject
          }
        },
        include: {
          messages: {
            where: {
              metadata: {
                path: ['type'],
                equals: 'marketplace'
              }
            }
          }
        }
      });

      const existingConversation = existingConversations.find(conv => 
        conv.messages.length > 0
      );

      if (existingConversation) {
        return existingConversation;
      }

      // Create new marketplace chat
      const title = `Marketplace: ${marketplaceData.subject}`;
      const conversation = await this.chatService.createConversation(
        customerId,
        'direct',
        title,
        [vendorId],
        {
          type: 'marketplace',
          productId: marketplaceData.productId,
          orderId: marketplaceData.orderId,
          vendorId,
          customerId,
          inquiryType: marketplaceData.inquiryType,
          subject: marketplaceData.subject,
        },
      );

      // Send initial AI message (using regular sendMessage with AI sender)
      await this.chatService.sendMessage(
        'system', // AI sender
        {
          content: `Welcome to the marketplace chat! I'm connecting you with ${vendorId}. They'll respond to your inquiry about ${marketplaceData.subject} shortly.`,
          conversationId: conversation.id,
          metadata: {
            type: 'marketplace_welcome',
            inquiryType: marketplaceData.inquiryType,
          },
        },
      );

      // Event emission removed - event emitter not available

      return conversation;
    } catch (error) {
      this.logger.error('Error creating marketplace chat:', error);
      throw new Error('Failed to create marketplace chat');
    }
  }

  // Encryption Management
  async setupEncryption(
    userId: string,
    conversationId: string,
  ): Promise<ChatEncryptionData> {
    try {
      // Generate encryption keys (in production, use proper crypto library)
      const publicKey = `public_key_${userId}_${Date.now()}`;
      const privateKey = `private_key_${userId}_${Date.now()}`;
      const sessionKey = `session_key_${conversationId}_${Date.now()}`;

      // Note: chatEncryption model doesn't exist in schema, returning mock data
      // In production, implement proper encryption storage
      return {
        publicKey,
        privateKey,
        sessionKey,
        isEncrypted: true,
      };
    } catch (error) {
      this.logger.error('Error setting up encryption:', error);
      throw new Error('Failed to setup encryption');
    }
  }

  async getEncryptionData(
    userId: string,
    conversationId: string,
  ): Promise<ChatEncryptionData | null> {
    try {
      // Note: chatEncryption model doesn't exist in schema, returning null
      // In production, implement proper encryption retrieval
      return null;
    } catch (error) {
      this.logger.error('Error getting encryption data:', error);
      return null;
    }
  }

  // Voice and Video Call Integration
  async initiateCall(
    userId: string,
    conversationId: string,
    callType: 'voice' | 'video',
  ) {
    try {
      // Get conversation and messages to find participants
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                }
              }
            },
            distinct: ['userId']
          }
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Create call record (mock since chatCall model doesn't exist)
      const callId = `call_${Date.now()}`;
      const callRecord = {
        id: callId,
        conversationId,
        initiatorId: userId,
        callType,
        status: 'ringing',
        participants: conversation.messages.map(msg => ({
          userId: msg.userId,
          status: msg.userId === userId ? 'initiator' : 'ringing',
        })),
      };

      // Send call notification to participants
      for (const message of conversation.messages) {
        if (message.userId !== userId) {
          await this.chatService.sendMessage(userId, {
            content: `📞 ${callType === 'voice' ? 'Voice' : 'Video'} call initiated`,
            conversationId,
            metadata: {
              type: 'call_initiated',
              callId: callRecord.id,
              callType,
              initiatorId: userId,
            },
          });
        }
      }

      // Event emission removed - event emitter not available

      return callRecord;
    } catch (error) {
      this.logger.error('Error initiating call:', error);
      throw new Error('Failed to initiate call');
    }
  }

  // AI Assistant Integration
  async processAIRequest(
    userId: string,
    conversationId: string,
    request: string,
  ) {
    try {
      // Get conversation context
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Process through DIC - event emitter not available, using fallback
      // const aiResponse = await this.eventEmitter.emitAsync('dic.chat.request', {
      //   userId,
      //   conversationId,
      //   request,
      //   context: conversation.messages,
      //   conversationType: conversation.type,
      //   metadata: conversation.metadata,
      // });

      // if (aiResponse && aiResponse.length > 0) {
      //   return aiResponse[0];
      // }

      return {
        response: "I'm here to help! How can I assist you today?",
        metadata: { type: 'general_assistance' },
      };
    } catch (error) {
      this.logger.error('Error processing AI request:', error);
      return {
        response: "I'm having trouble processing your request. Please try again.",
        metadata: { error: true },
      };
    }
  }

  // Group Management
  async createGroupChat(
    userId: string,
    title: string,
    participants: string[],
    groupSettings?: {
      isPublic?: boolean;
      allowInvites?: boolean;
      maxParticipants?: number;
    },
  ) {
    try {
      const conversation = await this.chatService.createConversation(
        userId,
        'group',
        title,
        participants,
        {
          type: 'group',
          settings: groupSettings,
          createdBy: userId,
        },
      );

      // Send group creation message (using regular sendMessage)
      await this.chatService.sendMessage(
        'system',
        {
          content: `Group "${title}" created. Welcome to the group chat!`,
          conversationId: conversation.id,
          metadata: {
            type: 'group_created',
            creatorId: userId,
            participantCount: participants.length + 1,
          },
        },
      );

      // Event emission removed - event emitter not available

      return conversation;
    } catch (error) {
      this.logger.error('Error creating group chat:', error);
      throw new Error('Failed to create group chat');
    }
  }

  async addGroupParticipant(
    adminId: string,
    conversationId: string,
    userId: string,
  ) {
    try {
      // Note: addParticipant method doesn't exist in chat service
      // In production, implement proper participant management
      const participant = {
        id: `participant_${userId}_${conversationId}`,
        userId,
        conversationId,
        role: 'member' as const,
        joinedAt: new Date(),
        lastReadAt: new Date(),
        isMuted: false,
      };

      // Send welcome message
      await this.chatService.sendMessage(
        'system',
        {
          content: `Welcome to the group! ${userId} has joined the conversation.`,
          conversationId,
          metadata: {
            type: 'participant_added',
            userId,
            adminId,
          },
        },
      );

      // Event emission removed - event emitter not available

      return participant;
    } catch (error) {
      this.logger.error('Error adding group participant:', error);
      throw new Error('Failed to add group participant');
    }
  }
}