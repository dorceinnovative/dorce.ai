import { IsEnum, IsOptional, IsNumber } from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"
// import { FraudAlertStatus, FraudSeverity } from "@prisma/client"

export class GetFraudAlertsDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'RESOLVED', 'DISMISSED'] })
  @IsEnum(['PENDING', 'RESOLVED', 'DISMISSED'])
  @IsOptional()
  status?: string

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  severity?: string

  @ApiPropertyOptional({ description: "Number of records to skip" })
  @IsNumber()
  @IsOptional()
  skip?: number

  @ApiPropertyOptional({ description: "Number of records to take" })
  @IsNumber()
  @IsOptional()
  take?: number
}
