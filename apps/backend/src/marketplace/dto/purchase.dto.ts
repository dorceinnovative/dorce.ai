import { IsString, IsNumber, IsPositive, IsOptional } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class PurchaseAirtimeDto {
  @ApiProperty({ description: "Product ID" })
  @IsString()
  productId: string

  @ApiProperty({ description: "Recipient phone number" })
  @IsString()
  phoneNumber: string

  @ApiPropertyOptional({ description: "Custom amount in kobo (if not fixed price)" })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  customAmount?: number

  @ApiPropertyOptional({ description: "Purchase metadata" })
  @IsOptional()
  metadata?: Record<string, any>
}

export class PurchaseElectricityDto {
  @ApiProperty({ description: "Meter number" })
  @IsString()
  meterNumber: string

  @ApiProperty({ description: "Disco (Distribution Company)" })
  @IsString()
  disco: string

  @ApiProperty({ description: "Amount in kobo" })
  @IsNumber()
  @IsPositive()
  amount: number

  @ApiPropertyOptional({ description: "Purchase metadata" })
  @IsOptional()
  metadata?: Record<string, any>
}

export class GetTransactionsDto {
  @ApiPropertyOptional({ description: "Filter by status" })
  @IsString()
  @IsOptional()
  status?: string

  @ApiPropertyOptional({ description: "Number of records to skip" })
  @IsNumber()
  @IsOptional()
  skip?: number = 0

  @ApiPropertyOptional({ description: "Number of records to take" })
  @IsNumber()
  @IsOptional()
  take?: number = 20
}

export class ProcessPaymentDto {
  @ApiProperty({ description: "Transaction ID" })
  @IsString()
  transactionId: string

  @ApiProperty({ description: "Payment reference" })
  @IsString()
  reference: string

  @ApiPropertyOptional({ description: "Provider response data" })
  @IsOptional()
  providerResponse?: Record<string, any>
}
