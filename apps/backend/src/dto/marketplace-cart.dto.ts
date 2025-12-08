import { IsString, IsOptional, IsInt, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Product variant ID (optional)', required: false })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ description: 'Quantity to add', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Product attributes (size, color, etc.)', required: false })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity', minimum: 0 })
  @IsInt()
  @Min(0)
  quantity: number;
}

export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    images: string[];
    store: {
      id: string;
      name: string;
      slug: string;
    };
  };

  @ApiProperty({ required: false })
  variant?: {
    id: string;
    name: string;
    price?: string;
  } | null;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: string;

  @ApiProperty()
  totalPrice: string;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  totalAmount: string;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  expiresAt: Date;
}