import { IsNumber, IsPositive, IsString, IsOptional } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateWalletDto {
  @ApiProperty({ description: "Initial wallet balance in kobo" })
  @IsNumber()
  @IsPositive()
  initialBalance?: number = 0
}

export class TopupWalletDto {
  @ApiProperty({ description: "Amount to topup in kobo" })
  @IsNumber()
  @IsPositive()
  amount: number

  @ApiPropertyOptional({ description: "Payment method (paystack, bank_transfer, etc.)" })
  @IsString()
  @IsOptional()
  paymentMethod?: string

  @ApiPropertyOptional({ description: "Paystack reference for verification" })
  @IsString()
  @IsOptional()
  paystackReference?: string
}

export class WithdrawWalletDto {
  @ApiProperty({ description: "Amount to withdraw in kobo" })
  @IsNumber()
  @IsPositive()
  amount: number

  @ApiPropertyOptional({ description: "Withdrawal description" })
  @IsString()
  @IsOptional()
  description?: string
}

export class TransferMoneyDto {
  @ApiProperty({ description: "Recipient user ID" })
  @IsString()
  recipientId: string

  @ApiProperty({ description: "Transfer amount in kobo" })
  @IsNumber()
  @IsPositive()
  amount: number

  @ApiPropertyOptional({ description: "Transfer description" })
  @IsString()
  @IsOptional()
  description?: string
}

export class TransactionFilterDto {
  @ApiPropertyOptional({ description: "Filter by transaction type" })
  @IsString()
  @IsOptional()
  type?: string

  @ApiPropertyOptional({ description: "Filter by transaction status" })
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
