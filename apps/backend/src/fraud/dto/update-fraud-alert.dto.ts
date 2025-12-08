import { IsEnum, IsOptional, IsString } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
// import { FraudAlertStatus } from "@prisma/client"

export class UpdateFraudAlertDto {
  @ApiProperty({ enum: ['PENDING', 'RESOLVED', 'DISMISSED'], description: "New alert status" })
  @IsEnum(['PENDING', 'RESOLVED', 'DISMISSED'])
  status: string

  @ApiPropertyOptional({ description: "Action taken on alert" })
  @IsString()
  @IsOptional()
  action?: string
}
