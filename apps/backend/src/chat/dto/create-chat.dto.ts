import { IsString, IsOptional, IsUUID } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateConversationDto {
  @ApiPropertyOptional({ description: "Conversation title" })
  @IsString()
  @IsOptional()
  title?: string
}

export class SendMessageDto {
  @ApiProperty({ description: "Message content" })
  @IsString()
  content: string

  @ApiPropertyOptional({ description: "Conversation ID" })
  @IsUUID()
  @IsOptional()
  conversationId?: string

  @ApiPropertyOptional({ description: "Message metadata" })
  @IsOptional()
  metadata?: Record<string, any>
}

export class GetConversationsDto {
  @ApiPropertyOptional({ description: "Number of records to skip" })
  @IsOptional()
  skip?: number = 0

  @ApiPropertyOptional({ description: "Number of records to take" })
  @IsOptional()
  take?: number = 20
}
