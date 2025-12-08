import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ChatIntegrationService } from '../services/chat-integration.service';

@ApiTags('chat-integration')
@Controller('api/chat-integration')
export class ChatIntegrationController {
  constructor(private chatIntegrationService: ChatIntegrationService) {}

  @Post('files/:conversationId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share a file in chat' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File shared successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async shareFile(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: any,
    @Body() body: {
      fileName: string;
      fileType: string;
      metadata?: string;
    },
  ) {
    const fileData = {
      fileName: body.fileName || file.originalname,
      fileSize: file.size,
      fileType: body.fileType || file.mimetype,
      fileUrl: `/uploads/chat/${file.filename}`,
      metadata: body.metadata ? JSON.parse(body.metadata) : {},
    };

    return this.chatIntegrationService.shareFile(
      req.user.id,
      conversationId,
      fileData,
    );
  }

  @Get('files/:conversationId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shared files in conversation' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  async getSharedFiles(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatIntegrationService.getSharedFiles(
      conversationId,
      req.user.id,
    );
  }

  @Post('marketplace-chat')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create marketplace chat between customer and vendor' })
  @ApiResponse({ status: 201, description: 'Marketplace chat created successfully' })
  async createMarketplaceChat(
    @Request() req: any,
    @Body() body: {
      vendorId: string;
      productId?: string;
      orderId?: string;
      inquiryType: 'product' | 'order' | 'support';
      subject: string;
    },
  ) {
    return this.chatIntegrationService.createMarketplaceChat(
      req.user.id,
      body.vendorId,
      {
        productId: body.productId,
        orderId: body.orderId,
        vendorId: body.vendorId,
        customerId: req.user.id,
        inquiryType: body.inquiryType,
        subject: body.subject,
      },
    );
  }

  @Post('encryption/:conversationId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup encryption for conversation' })
  @ApiResponse({ status: 201, description: 'Encryption setup successfully' })
  async setupEncryption(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatIntegrationService.setupEncryption(
      req.user.id,
      conversationId,
    );
  }

  @Get('encryption/:conversationId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get encryption data for conversation' })
  @ApiResponse({ status: 200, description: 'Encryption data retrieved successfully' })
  async getEncryptionData(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatIntegrationService.getEncryptionData(
      req.user.id,
      conversationId,
    );
  }

  @Post('calls/:conversationId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate voice or video call' })
  @ApiResponse({ status: 201, description: 'Call initiated successfully' })
  async initiateCall(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body() body: {
      callType: 'voice' | 'video';
    },
  ) {
    return this.chatIntegrationService.initiateCall(
      req.user.id,
      conversationId,
      body.callType,
    );
  }

  @Post('ai-request/:conversationId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process AI request in conversation' })
  @ApiResponse({ status: 200, description: 'AI request processed successfully' })
  async processAIRequest(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body() body: {
      request: string;
    },
  ) {
    return this.chatIntegrationService.processAIRequest(
      req.user.id,
      conversationId,
      body.request,
    );
  }

  @Post('group-chat')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create group chat' })
  @ApiResponse({ status: 201, description: 'Group chat created successfully' })
  async createGroupChat(
    @Request() req: any,
    @Body() body: {
      title: string;
      participants: string[];
      settings?: {
        isPublic?: boolean;
        allowInvites?: boolean;
        maxParticipants?: number;
      };
    },
  ) {
    return this.chatIntegrationService.createGroupChat(
      req.user.id,
      body.title,
      body.participants,
      body.settings,
    );
  }

  @Post('group-chat/:conversationId/participants')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add participant to group chat' })
  @ApiResponse({ status: 201, description: 'Participant added successfully' })
  async addGroupParticipant(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body() body: {
      userId: string;
    },
  ) {
    return this.chatIntegrationService.addGroupParticipant(
      req.user.id,
      conversationId,
      body.userId,
    );
  }
}