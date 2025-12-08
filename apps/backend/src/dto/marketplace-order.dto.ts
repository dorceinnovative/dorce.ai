import { IsString, IsOptional, IsInt, Min, IsObject, IsEnum, IsEmail, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ description: 'Payment method' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Customer email for payment' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Callback URL for payment' })
  @IsString()
  @IsOptional()
  callbackUrl?: string;

  @ApiProperty({ description: 'Coupon code (optional)' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({ description: 'Shipping address' })
  @IsObject()
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode?: string;
    country?: string;
    phone: string;
  };

  @ApiProperty({ description: 'Billing address (optional, defaults to shipping)' })
  @IsOptional()
  @IsObject()
  billingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode?: string;
    country?: string;
    phone: string;
  };

  @ApiProperty({ description: 'Customer notes (optional)' })
  @IsOptional()
  @IsString()
  customerNotes?: string;
}

export class ApplyCouponDto {
  @ApiProperty({ description: 'Coupon code' })
  @IsString()
  code: string;
}

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: string;

  @ApiProperty()
  totalPrice: string;

  @ApiProperty()
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };

  @ApiProperty({ required: false })
  variant?: {
    id: string;
    name: string;
  } | null;
}

export class StoreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class EscrowResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amountHeld: string;

  @ApiProperty()
  amountReleased: string;

  @ApiProperty()
  amountRefunded: string;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  status: OrderStatus;

  @ApiProperty()
  subtotal: string;

  @ApiProperty()
  shippingCost: string;

  @ApiProperty()
  taxAmount: string;

  @ApiProperty()
  discountAmount: string;

  @ApiProperty()
  totalAmount: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  paymentStatus: PaymentStatus;

  @ApiProperty()
  paymentReference?: string;

  @ApiProperty()
  shippingAddress?: any;

  @ApiProperty()
  billingAddress?: any;

  @ApiProperty()
  trackingNumber?: string;

  @ApiProperty()
  shippedAt?: Date;

  @ApiProperty()
  deliveredAt?: Date;

  @ApiProperty()
  store: StoreResponseDto;

  @ApiProperty({ required: false })
  escrow?: EscrowResponseDto | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  createdAt: Date;
}