import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Delete,
} from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { MarketplaceCartService } from "../services/marketplace-cart.service"
import { MarketplaceOrderService } from "../services/marketplace-order.service"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { AddToCartDto, UpdateCartItemDto } from "../dto/marketplace-cart.dto"
import { CreateOrderDto } from "../dto/marketplace-order.dto"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@ApiTags("marketplace-ecommerce")
@Controller("api/marketplace/ecommerce")
export class MarketplaceEcommerceController {
  constructor(
    private cartService: MarketplaceCartService,
    private orderService: MarketplaceOrderService
  ) {}

  // Cart endpoints
  @Get('cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved' })
  async getCart(@CurrentUser() userId: string) {
    return this.cartService.getCart(userId)
  }

  @Post('cart/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @HttpCode(HttpStatus.CREATED)
  async addToCart(@CurrentUser() userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(userId, dto)
  }

  @Put('cart/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  async updateCartItem(
    @CurrentUser() userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartService.updateCartItem(userId, itemId, dto.quantity)
  }

  @Delete('cart/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  async removeCartItem(@CurrentUser() userId: string, @Param('itemId') itemId: string) {
    return this.cartService.removeCartItem(userId, itemId)
  }

  @Delete('cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@CurrentUser() userId: string) {
    return this.cartService.clearCart(userId)
  }

  @Post('cart/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate cart for checkout' })
  @ApiResponse({ status: 200, description: 'Cart validated' })
  async validateCart(@CurrentUser() userId: string) {
    return this.cartService.validateCartForCheckout(userId)
  }

  // Order endpoints
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@CurrentUser() userId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(userId, dto)
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async getUserOrders(
    @CurrentUser() userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return this.orderService.getUserOrders(userId, page, limit)
  }

  @Get('orders/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific order' })
  @ApiResponse({ status: 200, description: 'Order retrieved' })
  async getOrder(@CurrentUser() userId: string, @Param('orderId') orderId: string) {
    return this.orderService.getOrder(userId, orderId)
  }

  @Post('orders/:orderId/confirm-delivery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm order delivery' })
  @ApiResponse({ status: 200, description: 'Delivery confirmed' })
  async confirmOrderDelivery(
    @CurrentUser() userId: string,
    @Param('orderId') orderId: string
  ) {
    return this.orderService.confirmOrderDelivery(userId, orderId)
  }
}