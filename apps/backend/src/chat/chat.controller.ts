import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, HttpCode, HttpStatus, Request } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { ChatService } from "./chat.service"
import { CreateConversationDto, SendMessageDto, GetConversationsDto } from "./dto/create-chat.dto"

@ApiTags("chat")
@Controller("api/chat")
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post("conversations")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new conversation" })
  @ApiResponse({ status: 201, description: "Conversation created" })
  @HttpCode(HttpStatus.CREATED)
  async createConversation(@Request() req: any, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(req.user.id, 'direct', dto.title || 'New Chat')
  }

  @Get("conversations")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all conversations for user" })
  @ApiResponse({ status: 200, description: "Conversations retrieved" })
  async getConversations(@Request() req: any, @Body() dto: GetConversationsDto) {
    return this.chatService.getConversations(req.user.id)
  }

  @Get("conversations/:conversationId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a specific conversation with messages" })
  @ApiResponse({ status: 200, description: "Conversation retrieved" })
  async getConversation(@Request() req: any, @Param('conversationId') conversationId: string) {
    return this.chatService.getConversation(req.user.id, conversationId)
  }

  @Post("messages")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send message and get AI response" })
  @ApiResponse({ status: 200, description: "Message sent and response received" })
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Request() req: any, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto)
  }

  @Delete("conversations/:conversationId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a conversation" })
  @ApiResponse({ status: 200, description: "Conversation deleted" })
  async deleteConversation(@Request() req: any, @Param('conversationId') conversationId: string) {
    return this.chatService.deleteConversation(req.user.id, conversationId)
  }

  @Put("conversations/:conversationId/title")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update conversation title" })
  @ApiResponse({ status: 200, description: "Title updated" })
  async updateConversationTitle(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body('title') title: string,
  ) {
    return this.chatService.updateConversationTitle(req.user.id, conversationId, title)
  }
}
