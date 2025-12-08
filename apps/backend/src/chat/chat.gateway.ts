import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayInit,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from "@nestjs/websockets"
import type { Server, Socket } from "socket.io"
import { Injectable, Logger } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { JwtSecretService } from "../auth/jwt-secret.service"
import { ChatService } from "./chat.service"
import { PrismaService } from "../prisma/prisma.service"

interface AuthenticatedSocket extends Socket {
  userId?: string
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowed = process.env.FRONTEND_URL || ''
      const list = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      const allowlist = new Set([allowed, ...list].filter(Boolean))
      if (allowlist.size === 0) return callback(null, true)
      return callback(null, allowlist.has(origin || '') ? true : false)
    },
    credentials: true,
  },
  namespace: "chat",
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private logger = new Logger("ChatGateway")
  private userSockets: Map<string, Set<string>> = new Map()

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private jwtSecretService: JwtSecretService,
  ) {}

  afterInit() {
    this.logger.log("WebSocket Gateway initialized")
  }

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        socket.disconnect()
        return
      }

      const secret = this.jwtSecretService.getAccessSecretForToken(token) || (process.env.JWT_ACCESS_SECRET as string)
      const payload = this.jwtService.verify(token, {
        secret,
      })
      socket.userId = payload.sub

      const userId = socket.userId! // ✅ tell TS it's defined

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set())
      }
      this.userSockets.get(userId)?.add(socket.id)

      this.logger.log(`User ${userId} connected`)
      socket.emit("connected", { message: "Connected to chat" })
    } catch (error) {
      this.logger.error("Connection error:", error)
      socket.disconnect()
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId
    if (userId) {
      this.userSockets.get(userId)?.delete(socket.id)
      this.logger.log(`User ${userId} disconnected`)
    }
  }

  async handleSendMessage(
    socket: AuthenticatedSocket,
    data: { content: string; conversationId?: string; metadata?: Record<string, any> },
  ) {
    try {
      const userId = socket.userId
      if (!userId) {
        return socket.emit("error", { message: "Not authenticated" })
      }

      socket.emit("stream_start")

      // Send message and get AI response
      const result = await this.chatService.sendMessage(userId, {
        content: data.content,
        conversationId: data.conversationId,
        metadata: data.metadata,
      })

      // Emit the user message
      socket.emit("message_sent", { message: result.message })

      // Emit AI response if available
      if (result.assistantMessage) {
        socket.emit("ai_response", { 
          message: result.assistantMessage,
          conversation: result.conversation 
        })
      }

      socket.emit("stream_end", {
        message: result.assistantMessage,
        conversation: result.conversation,
      })
    } catch (error) {
      this.logger.error("Message error:", error)
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to send message",
      })
    }
  }

  @SubscribeMessage("get_conversations")
  async handleGetConversations(socket: AuthenticatedSocket, data: { skip?: number; take?: number }) {
    try {
      const userId = socket.userId
      if (!userId) {
        return socket.emit("error", { message: "Not authenticated" })
      }

      const result = await this.chatService.getConversations(userId)

      socket.emit("conversations", result)
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to fetch conversations",
      })
    }
  }

  @SubscribeMessage("get_conversation")
  async handleGetConversation(socket: AuthenticatedSocket, data: { conversationId: string }) {
    try {
      const userId = socket.userId
      if (!userId) {
        return socket.emit("error", { message: "Not authenticated" })
      }

      const conversation = await this.chatService.getConversation(userId, data.conversationId)
      socket.emit("conversation", conversation)
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to fetch conversation",
      })
    }
  }

  @SubscribeMessage("create_conversation")
  async handleCreateConversation(socket: AuthenticatedSocket, data: { title?: string }) {
    try {
      const userId = socket.userId
      if (!userId) {
        return socket.emit("error", { message: "Not authenticated" })
      }

      const conversation = await this.chatService.createConversation(userId, 'direct', data.title || 'New Chat')
      socket.emit("conversation_created", conversation)
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to create conversation",
      })
    }
  }

  @SubscribeMessage("delete_conversation")
  async handleDeleteConversation(socket: AuthenticatedSocket, data: { conversationId: string }) {
    try {
      const userId = socket.userId
      if (!userId) {
        return socket.emit("error", { message: "Not authenticated" })
      }

      await this.chatService.deleteConversation(userId, data.conversationId)
      socket.emit("conversation_deleted", { conversationId: data.conversationId })
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to delete conversation",
      })
    }
  }
}
