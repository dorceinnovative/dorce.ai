import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { ChatService } from "./chat.service"
import { ChatController } from "./chat.controller"
import { ChatGateway } from "./chat.gateway"
import { ChatIntegrationService } from "../services/chat-integration.service"
import { ChatIntegrationController } from "../controllers/chat-integration.controller"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { AuthModule } from "../auth/auth.module"

@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot(), AuthModule],
  controllers: [ChatController, ChatIntegrationController],
  providers: [ChatService, ChatGateway, ChatIntegrationService],
  exports: [ChatService, ChatIntegrationService],
})
export class ChatModule {}
