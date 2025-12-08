import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketplaceCartService } from '../services/marketplace-cart.service';
import { MarketplaceCheckoutService } from '../services/marketplace-checkout.service';
import { MarketplaceOrderService } from '../services/marketplace-order.service';

class AddToCartDto {
  productId: string;
  quantity: number;
  variantId?: string;
}

class UpdateCartItemDto {
  quantity: number;
}

class CheckoutDto {
  shippingAddress: {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  paymentMethod: 'paystack' | 'flutterwave' | 'wallet';
  saveAddress?: boolean;
  notes?: string;
  cart?: any; // Optional cart data
}

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(
    private cartService: MarketplaceCartService,
    private checkoutService: MarketplaceCheckoutService,
    private orderService: MarketplaceOrderService,
  ) {}

  // Cart endpoints
  @Get('cart')
  async getCart(@Request() req) {
    const cart = await this.cartService.getCart(req.user.id);
    return {
      success: true,
      data: {
        ...cart,
        totals: {
          subtotal: cart.totals.subtotal.toString(),
          shipping: cart.totals.shipping.toString(),
          tax: cart.totals.tax.toString(),
          total: cart.totals.total.toString(),
        },
        vendors: cart.vendors.map(vendor => ({
          ...vendor,
          subtotal: vendor.subtotal.toString(),
          shipping: vendor.shipping.toString(),
        })),
      },
    };
  }

  @Post('cart/items')
  @HttpCode(HttpStatus.CREATED)
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    const cart = await this.cartService.addToCart(req.user.id, addToCartDto);
    return {
      success: true,
      message: 'Item added to cart successfully',
      data: {
        ...cart,
        totals: {
          subtotal: cart.totals.subtotal.toString(),
          shipping: cart.totals.shipping.toString(),
          tax: cart.totals.tax.toString(),
          total: cart.totals.total.toString(),
        },
        vendors: cart.vendors.map(vendor => ({
          ...vendor,
          subtotal: vendor.subtotal.toString(),
          shipping: vendor.shipping.toString(),
        })),
      },
    };
  }

  @Put('cart/items/:itemId')
  async updateCartItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() updateCartDto: UpdateCartItemDto,
  ) {
    const cart = await this.cartService.updateCartItem(
      req.user.id,
      itemId,
      updateCartDto.quantity,
    );
    return {
      success: true,
      message: 'Cart item updated successfully',
      data: {
        ...cart,
        totals: {
          subtotal: cart.totals.subtotal.toString(),
          shipping: cart.totals.shipping.toString(),
          tax: cart.totals.tax.toString(),
          total: cart.totals.total.toString(),
        },
        vendors: cart.vendors.map(vendor => ({
          ...vendor,
          subtotal: vendor.subtotal.toString(),
          shipping: vendor.shipping.toString(),
        })),
      },
    };
  }

  @Delete('cart/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCartItem(@Request() req, @Param('itemId') itemId: string) {
    await this.cartService.removeCartItem(req.user.id, itemId);
    return {
      success: true,
      message: 'Item removed from cart',
    };
  }

  @Delete('cart')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@Request() req) {
    await this.cartService.clearCart(req.user.id);
    return {
      success: true,
      message: 'Cart cleared successfully',
    };
  }

  // Checkout endpoints
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(@Request() req, @Body() checkoutDto: CheckoutDto) {
    const result = await this.checkoutService.processCheckout(req.user.id, checkoutDto);
    
    return {
      success: true,
      message: 'Checkout completed successfully',
      data: {
        orders: result.orders,
        payment: result.payment ? {
          ...result.payment,
          amount: result.payment.amount.toString(),
        } : null,
      },
    };
  }

  // Order endpoints
  @Get('orders')
  async getOrders(@Request() req) {
    const orders = await this.orderService.getUserOrders(req.user.id);
    return {
      success: true,
      data: orders,
    };
  }

  @Get('orders/:orderId')
  async getOrder(@Request() req, @Param('orderId') orderId: string) {
    const order = await this.orderService.getOrder(req.user.id, orderId);
    return {
      success: true,
      data: order,
    };
  }


}