import { IsString, IsOptional, IsNumber, IsPositive, IsEnum, IsBoolean, IsObject } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export enum ProductCategoryEnum {
  AIRTIME = "AIRTIME",
  DATA = "DATA",
  ELECTRICITY = "ELECTRICITY",
  PIN_VOUCHER = "PIN_VOUCHER",
}

export class CreateProductDto {
  @ApiProperty({ description: "Product name" })
  @IsString()
  name: string

  @ApiProperty({ enum: ProductCategoryEnum, description: "Product category" })
  @IsEnum(ProductCategoryEnum)
  category: ProductCategoryEnum

  @ApiPropertyOptional({ description: "Product description" })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: "Product icon/image URL" })
  @IsString()
  @IsOptional()
  icon?: string

  @ApiPropertyOptional({ description: "Service provider name" })
  @IsString()
  @IsOptional()
  provider?: string

  @ApiPropertyOptional({
    description: "Fixed price in kobo (null for dynamic pricing)",
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number

  @ApiPropertyOptional({ description: "Additional metadata (JSON)" })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: "Product name" })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: "Product description" })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: "Product icon/image URL" })
  @IsString()
  @IsOptional()
  icon?: string

  @ApiPropertyOptional({ description: "Fixed price in kobo" })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number

  @ApiPropertyOptional({ description: "Is product active" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({ description: "Additional metadata (JSON)" })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

export class GetProductsDto {
  @ApiPropertyOptional({ enum: ProductCategoryEnum, description: "Filter by category" })
  @IsEnum(ProductCategoryEnum)
  @IsOptional()
  category?: ProductCategoryEnum

  @ApiPropertyOptional({ description: "Filter by active status" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true

  @ApiPropertyOptional({ description: "Number of records to skip" })
  @IsNumber()
  @IsOptional()
  skip?: number = 0

  @ApiPropertyOptional({ description: "Number of records to take" })
  @IsNumber()
  @IsOptional()
  take?: number = 50
}
